import { query, getClient } from '../config/db.js';
import { processOrderCreation } from '../services/orderService.js';
import { getPagination } from '../utils/helpers.js';

export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, billingAddress, couponCode, customerNotes } = req.body;

    const result = await processOrderCreation({
      userId: req.user ? req.user.id : null,
      items,
      shippingAddress,
      billingAddress,
      couponCode,
      customerNotes,
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully. Please proceed with payment transfer.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const { page: currentPage, limit: pageLimit, offset } = getPagination(page, limit);

    const countRes = await query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const sql = `
      SELECT o.*,
             p.payment_status, p.payment_method, p.transaction_reference,
             (
               SELECT json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'product_name', oi.product_name,
                   'product_price', oi.product_price,
                   'product_image', oi.product_image,
                   'quantity', oi.quantity,
                   'total_price', oi.total_price
                 )
               )
               FROM order_items oi
               WHERE oi.order_id = o.id
             ) as items
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [userId, pageLimit, offset]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: totalItems,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(totalItems / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isOrderNumber = isNaN(id);

    const condition = isOrderNumber ? 'o.order_number = $1' : 'o.id = $1';

    const orderSql = `
      SELECT o.*,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             p.id as payment_id, p.payment_status, p.payment_method, p.transaction_reference,
             p.sender_name, p.sender_account, p.bank_name, p.proof_image_url, p.payment_notes,
             p.confirmed_at, p.confirmed_by
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE ${condition}
    `;

    const orderRes = await query(orderSql, [id]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Authorization: User can only view their own order unless they are an admin
    if (req.user && req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this order.' });
    }

    // Fetch order items
    const itemsRes = await query(
      `SELECT oi.*, p.slug as product_slug
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [order.id]
    );
    order.items = itemsRes.rows;

    // Fetch store bank details for payment instructions
    const settingsRes = await query('SELECT * FROM store_settings LIMIT 1');
    order.storeBankDetails = settingsRes.rows[0];

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await client.query('BEGIN');

    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // If customer, verify ownership and ensure order is cancellable
    if (req.user.role !== 'admin') {
      if (order.user_id !== req.user.id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
      }
      if (order.status !== 'pending' && order.status !== 'processing') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Cannot cancel order with status "${order.status}". Only pending or processing orders can be cancelled.`,
        });
      }
    }

    if (order.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    // Restore stock for all items
    const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    // Update order status
    await client.query(
      `UPDATE orders
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP,
           cancel_reason = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason || 'Cancelled by customer', order.id]
    );

    // Update payment record if exists
    await client.query(
      `UPDATE payments
       SET payment_status = 'failed',
           payment_notes = COALESCE(payment_notes, '') || ' [Order cancelled]',
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1 AND payment_status != 'confirmed'`,
      [order.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Order cancelled successfully and product inventory has been restored.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getInvoiceData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isOrderNumber = isNaN(id);

    const condition = isOrderNumber ? 'o.order_number = $1' : 'o.id = $1';

    const orderRes = await query(
      `SELECT o.*,
              u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
              p.payment_status, p.payment_method, p.transaction_reference, p.confirmed_at
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE ${condition}`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    if (req.user && req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC', [order.id]);
    const settingsRes = await query('SELECT * FROM store_settings LIMIT 1');

    res.json({
      success: true,
      data: {
        order,
        items: itemsRes.rows,
        store: settingsRes.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};
