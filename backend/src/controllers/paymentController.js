import { query, getClient } from '../config/db.js';

export const submitPaymentDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { transactionReference, senderName, senderAccount, bankName, paymentNotes, proofImageUrl } = req.body;

    if (!transactionReference || !transactionReference.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required for payment confirmation.',
      });
    }

    // Verify order exists and belongs to user (or admin)
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const existingPayment = await query('SELECT * FROM payments WHERE order_id = $1', [orderId]);

    let payment;
    if (existingPayment.rows.length > 0) {
      const updateRes = await query(
        `UPDATE payments
         SET transaction_reference = $1,
             sender_name = COALESCE($2, sender_name),
             sender_account = COALESCE($3, sender_account),
             bank_name = COALESCE($4, bank_name),
             payment_notes = COALESCE($5, payment_notes),
             proof_image_url = COALESCE($6, proof_image_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $7
         RETURNING *`,
        [transactionReference.trim(), senderName, senderAccount, bankName, paymentNotes, proofImageUrl, orderId]
      );
      payment = updateRes.rows[0];
    } else {
      const insertRes = await query(
        `INSERT INTO payments (
          order_id, payment_method, payment_status, amount, transaction_reference,
          sender_name, sender_account, bank_name, payment_notes, proof_image_url
        ) VALUES ($1, 'bank_transfer', 'pending', $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          orderId,
          order.total_amount,
          transactionReference.trim(),
          senderName || null,
          senderAccount || null,
          bankName || null,
          paymentNotes || null,
          proofImageUrl || null,
        ]
      );
      payment = insertRes.rows[0];
    }

    res.json({
      success: true,
      message: 'Payment details submitted successfully. An administrator will review and verify your transfer shortly.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const result = await query(
      `SELECT p.*, o.order_number, o.total_amount, o.status as order_status,
              u.name as customer_name, u.email as customer_email
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE p.order_id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payment = result.rows[0];
    if (req.user.role !== 'admin' && req.user.email !== payment.customer_email) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

export const adminConfirmPayment = async (req, res, next) => {
  const client = await getClient();
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;

    await client.query('BEGIN');

    const paymentRes = await client.query('SELECT * FROM payments WHERE order_id = $1 FOR UPDATE', [orderId]);
    if (paymentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Update payment to confirmed
    const updatedPaymentRes = await client.query(
      `UPDATE payments
       SET payment_status = 'confirmed',
           confirmed_by = $1,
           confirmed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $2
       RETURNING *`,
      [adminId, orderId]
    );

    // Automatically update order status to 'processing' if currently 'pending'
    await client.query(
      `UPDATE orders
       SET status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment confirmed successfully. Order status updated to processing.',
      data: updatedPaymentRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const adminRejectPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE payments
       SET payment_status = 'failed',
           payment_notes = COALESCE(payment_notes, '') || ' [Rejected: ' || $1 || ']',
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $2
       RETURNING *`,
      [reason || 'Verification rejected by administrator', orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    res.json({
      success: true,
      message: 'Payment status updated to failed.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const adminRefundPayment = async (req, res, next) => {
  const client = await getClient();
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    await client.query('BEGIN');

    const paymentRes = await client.query('SELECT * FROM payments WHERE order_id = $1 FOR UPDATE', [orderId]);
    if (paymentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    await client.query(
      `UPDATE payments
       SET payment_status = 'refunded',
           payment_notes = COALESCE(payment_notes, '') || ' [Refunded: ' || $1 || ']',
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $2`,
      [notes || 'Refund processed by administrator', orderId]
    );

    // Cancel order and restore stock
    await client.query(
      `UPDATE orders
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP,
           cancel_reason = 'Payment refunded by administrator',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );

    const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment marked as refunded, order cancelled, and inventory restored.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
