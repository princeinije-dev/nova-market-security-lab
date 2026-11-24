import { query, getClient } from '../config/db.js';
import { getPagination, generatePaymentReference } from '../utils/helpers.js';

// ─── Customer: Get wallet balance + recent transactions ───────────────────────
export const getWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userRes = await query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );
    const balance = parseFloat(userRes.rows[0]?.wallet_balance || 0);

    const txRes = await query(
      `SELECT * FROM wallet_transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: { balance, recentTransactions: txRes.rows },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Customer: Get paginated transaction history ──────────────────────────────
export const getWalletTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const { page: currentPage, limit: pageLimit, offset } = getPagination(page, limit);

    let whereClauses = ['user_id = $1'];
    let params = [userId];

    if (type) {
      params.push(type);
      whereClauses.push(`type = $${params.length}`);
    }

    const where = whereClauses.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(*) FROM wallet_transactions WHERE ${where}`,
      params
    );
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const txRes = await query(
      `SELECT * FROM wallet_transactions WHERE ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageLimit, offset]
    );

    res.json({
      success: true,
      data: {
        transactions: txRes.rows,
        pagination: {
          currentPage,
          totalPages: Math.ceil(totalItems / pageLimit),
          totalItems,
          limit: pageLimit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Customer: Request a wallet top-up via bank transfer ─────────────────────
export const requestTopup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, reference } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ success: false, message: 'Minimum top-up amount is $1.00' });
    }
    if (parsedAmount > 10000) {
      return res.status(400).json({ success: false, message: 'Maximum single top-up is $10,000' });
    }
    if (!reference || reference.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Bank transfer reference is required' });
    }

    // Prevent duplicate references
    const dupCheck = await query(
      `SELECT id FROM wallet_transactions WHERE reference = $1 AND type = 'topup_pending'`,
      [reference.trim()]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A top-up request with this reference already exists.',
      });
    }

    const tx = await query(
      `INSERT INTO wallet_transactions
         (user_id, type, amount, reference, description, status)
       VALUES ($1, 'topup_pending', $2, $3, $4, 'pending')
       RETURNING *`,
      [
        userId,
        parsedAmount.toFixed(2),
        reference.trim(),
        `Wallet top-up request of $${parsedAmount.toFixed(2)} via bank transfer`,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Top-up request submitted. Your balance will be credited after admin confirmation.',
      data: tx.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: List all pending top-up requests ─────────────────────────────────
export const adminListTopups = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const { page: currentPage, limit: pageLimit, offset } = getPagination(page, limit);

    let whereClauses = [`wt.type IN ('topup_pending','topup_approved','topup_rejected')`];
    let params = [];

    if (status !== 'all') {
      params.push(status);
      whereClauses.push(`wt.status = $${params.length}`);
    }

    const where = whereClauses.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(*) FROM wallet_transactions wt WHERE ${where}`,
      params
    );
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const rows = await query(
      `SELECT wt.*,
              u.name as customer_name, u.email as customer_email,
              u.wallet_balance as current_balance,
              a.name as admin_name
       FROM wallet_transactions wt
       JOIN users u ON u.id = wt.user_id
       LEFT JOIN users a ON a.id = wt.admin_id
       WHERE ${where}
       ORDER BY wt.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageLimit, offset]
    );

    res.json({
      success: true,
      data: {
        topups: rows.rows,
        pagination: {
          currentPage,
          totalPages: Math.ceil(totalItems / pageLimit),
          totalItems,
          limit: pageLimit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Approve a top-up (credit user's wallet) ──────────────────────────
export const adminApproveTopup = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user.id;

    // Lock the transaction row
    const txRes = await client.query(
      `SELECT * FROM wallet_transactions WHERE id = $1 AND type = 'topup_pending' FOR UPDATE`,
      [id]
    );

    if (txRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Pending top-up not found.' });
    }

    const tx = txRes.rows[0];
    if (tx.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `This request is already ${tx.status}.` });
    }

    const amount = parseFloat(tx.amount);

    // Credit user's wallet
    const userRes = await client.query(
      `UPDATE users SET wallet_balance = wallet_balance + $1, updated_at = NOW()
       WHERE id = $2 RETURNING wallet_balance`,
      [amount, tx.user_id]
    );
    const newBalance = parseFloat(userRes.rows[0].wallet_balance);

    // Update transaction record → approved
    await client.query(
      `UPDATE wallet_transactions
       SET type = 'topup_approved', status = 'completed',
           balance_after = $1, admin_id = $2, admin_note = $3, updated_at = NOW()
       WHERE id = $4`,
      [newBalance, adminId, note || null, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Top-up of $${amount.toFixed(2)} approved. Customer wallet credited.`,
      data: { newBalance },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// ─── Admin: Reject a top-up request ──────────────────────────────────────────
export const adminRejectTopup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user.id;

    const txRes = await query(
      `SELECT * FROM wallet_transactions WHERE id = $1 AND type = 'topup_pending' AND status = 'pending'`,
      [id]
    );

    if (txRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pending top-up not found.' });
    }

    await query(
      `UPDATE wallet_transactions
       SET type = 'topup_rejected', status = 'failed',
           admin_id = $1, admin_note = $2, updated_at = NOW()
       WHERE id = $3`,
      [adminId, note || 'Rejected by administrator', id]
    );

    res.json({ success: true, message: 'Top-up request rejected.' });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Manual wallet adjustment (credit or debit) ───────────────────────
export const adminAdjustWallet = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { userId } = req.params;
    const { amount, description, type = 'adjustment' } = req.body;
    const adminId = req.user.id;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid adjustment amount.' });
    }

    const userRes = await client.query(
      `UPDATE users SET wallet_balance = GREATEST(0, wallet_balance + $1), updated_at = NOW()
       WHERE id = $2 RETURNING wallet_balance, name, email`,
      [parsedAmount, userId]
    );

    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const newBalance = parseFloat(userRes.rows[0].wallet_balance);

    await client.query(
      `INSERT INTO wallet_transactions
         (user_id, type, amount, balance_after, description, status, admin_id, admin_note)
       VALUES ($1, 'adjustment', $2, $3, $4, 'completed', $5, $6)`,
      [userId, Math.abs(parsedAmount), newBalance, description || 'Manual admin adjustment', adminId, description]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Wallet adjusted. New balance: $${newBalance.toFixed(2)}`,
      data: { newBalance, customer: userRes.rows[0] },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// ─── Checkout helper: Pay order with wallet balance ───────────────────────────
// Called internally from orderService or as a standalone endpoint
export const payOrderWithWallet = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userId = req.user.id;
    const { orderId } = req.params;

    // Fetch order and ensure it belongs to user and is unpaid
    const orderRes = await client.query(
      `SELECT o.*, p.id as payment_id, p.payment_status, p.amount as payment_amount
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1 AND o.user_id = $2 FOR UPDATE`,
      [orderId, userId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.payment_status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Order is already paid.' });
    }

    const amountDue = parseFloat(order.payment_amount || order.total_amount);

    // Check wallet balance
    const userRes = await client.query(
      `SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const currentBalance = parseFloat(userRes.rows[0].wallet_balance);

    if (currentBalance < amountDue) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: $${currentBalance.toFixed(2)}, Required: $${amountDue.toFixed(2)}`,
      });
    }

    const newBalance = parseFloat((currentBalance - amountDue).toFixed(2));

    // Deduct from wallet
    await client.query(
      `UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2`,
      [newBalance, userId]
    );

    // Log the wallet debit transaction
    const txRef = generatePaymentReference();
    await client.query(
      `INSERT INTO wallet_transactions
         (user_id, type, amount, balance_after, reference, description, status)
       VALUES ($1, 'order_payment', $2, $3, $4, $5, 'completed')`,
      [userId, amountDue, newBalance, txRef, `Payment for order #${order.order_number}`]
    );

    // Update payment record → completed
    await client.query(
      `UPDATE payments
       SET payment_status = 'completed', payment_method = 'wallet',
           transaction_reference = $1, paid_at = NOW(), updated_at = NOW()
       WHERE order_id = $2`,
      [txRef, orderId]
    );

    // Update order status → processing
    await client.query(
      `UPDATE orders SET status = 'processing', payment_status = 'paid', updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Payment of $${amountDue.toFixed(2)} deducted from wallet. Order confirmed!`,
      data: { newBalance, orderNumber: order.order_number },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
