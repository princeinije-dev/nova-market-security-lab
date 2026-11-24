import { query } from '../config/db.js';
import { getPagination } from '../utils/helpers.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Overall counts & metrics
    const statsSql = `
      SELECT
        COALESCE(SUM(CASE WHEN p.payment_status = 'confirmed' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as completed_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'processing' THEN o.id END) as processing_orders,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE stock_quantity <= 5) as low_stock_products
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
    `;
    const statsRes = await query(statsSql);

    // 2. Recent orders (latest 6)
    const recentOrdersSql = `
      SELECT o.id, o.order_number, o.created_at, o.total_amount, o.status,
             u.name as customer_name, u.email as customer_email,
             p.payment_status, p.payment_method
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      ORDER BY o.created_at DESC
      LIMIT 6
    `;
    const recentOrdersRes = await query(recentOrdersSql);

    // 3. Sales statistics by day for the last 7 days
    const chartSql = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as day
      )
      SELECT
        TO_CHAR(ds.day, 'Mon DD') as date_label,
        ds.day as full_date,
        COALESCE(COUNT(DISTINCT o.id), 0) as order_count,
        COALESCE(SUM(CASE WHEN p.payment_status = 'confirmed' THEN o.total_amount ELSE 0 END), 0) as daily_revenue
      FROM date_series ds
      LEFT JOIN orders o ON DATE(o.created_at) = ds.day
      LEFT JOIN payments p ON p.order_id = o.id
      GROUP BY ds.day
      ORDER BY ds.day ASC
    `;
    const chartRes = await query(chartSql);

    // 4. Category breakdown
    const categoryBreakdownSql = `
      SELECT c.name, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY count DESC
    `;
    const categoryBreakdownRes = await query(categoryBreakdownSql);

    res.json({
      success: true,
      data: {
        metrics: statsRes.rows[0],
        recentOrders: recentOrdersRes.rows,
        salesChart: chartRes.rows,
        categoryBreakdown: categoryBreakdownRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 15 } = req.query;
    const { page: currentPage, limit: pageLimit, offset } = getPagination(page, limit);

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      values.push(status);
      conditions.push(`o.status = $${paramIndex}`);
      paramIndex++;
    }

    if (paymentStatus) {
      values.push(paymentStatus);
      conditions.push(`p.payment_status = $${paramIndex}`);
      paramIndex++;
    }

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(o.order_number ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR p.transaction_reference ILIKE $${paramIndex})`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const totalItems = parseInt(countRes.rows[0].total, 10);

    const dataSql = `
      SELECT o.*,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             p.payment_status, p.payment_method, p.transaction_reference, p.sender_name,
             p.bank_name, p.confirmed_at,
             (
               SELECT json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_name', oi.product_name,
                   'product_price', oi.product_price,
                   'quantity', oi.quantity,
                   'total_price', oi.total_price,
                   'product_image', oi.product_image
                 )
               )
               FROM order_items oi
               WHERE oi.order_id = o.id
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(pageLimit, offset);
    const dataRes = await query(dataSql, values);

    res.json({
      success: true,
      data: dataRes.rows,
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

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, admin_notes } = req.body;

    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const result = await query(
      `UPDATE orders
       SET status = COALESCE($1, status),
           tracking_number = COALESCE($2, tracking_number),
           admin_notes = COALESCE($3, admin_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, tracking_number, admin_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCustomers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const { page: currentPage, limit: pageLimit, offset } = getPagination(page, limit);

    const conditions = [`u.role = 'customer'`];
    const values = [];
    let paramIndex = 1;

    if (status) {
      values.push(status);
      conditions.push(`u.status = $${paramIndex}`);
      paramIndex++;
    }

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const countRes = await query(countSql, values);
    const totalItems = parseInt(countRes.rows[0].total, 10);

    const dataSql = `
      SELECT u.id, u.name, u.email, u.phone, u.avatar, u.status, u.created_at,
             COUNT(DISTINCT o.id) as order_count,
             COALESCE(SUM(CASE WHEN p.payment_status = 'confirmed' THEN o.total_amount ELSE 0 END), 0) as total_spent,
             MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      LEFT JOIN payments p ON p.order_id = o.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(pageLimit, offset);
    const dataRes = await query(dataSql, values);

    res.json({
      success: true,
      data: dataRes.rows,
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

export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRes = await query('SELECT id, status, name, role FROM users WHERE id = $1', [id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (userRes.rows[0].role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot deactivate administrator accounts here.' });
    }

    const newStatus = userRes.rows[0].status === 'active' ? 'inactive' : 'active';
    await query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);

    res.json({
      success: true,
      message: `Customer account ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      status: newStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreSettings = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM store_settings LIMIT 1');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateStoreSettings = async (req, res, next) => {
  try {
    const {
      store_name,
      store_email,
      store_phone,
      store_address,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_routing_code,
      bank_swift_code,
      payment_instructions,
      standard_shipping_fee,
      free_shipping_threshold,
      currency,
      currency_symbol,
    } = req.body;

    const result = await query(
      `UPDATE store_settings
       SET store_name = COALESCE($1, store_name),
           store_email = COALESCE($2, store_email),
           store_phone = COALESCE($3, store_phone),
           store_address = COALESCE($4, store_address),
           bank_name = COALESCE($5, bank_name),
           bank_account_name = COALESCE($6, bank_account_name),
           bank_account_number = COALESCE($7, bank_account_number),
           bank_routing_code = COALESCE($8, bank_routing_code),
           bank_swift_code = COALESCE($9, bank_swift_code),
           payment_instructions = COALESCE($10, payment_instructions),
           standard_shipping_fee = COALESCE($11, standard_shipping_fee),
           free_shipping_threshold = COALESCE($12, free_shipping_threshold),
           currency = COALESCE($13, currency),
           currency_symbol = COALESCE($14, currency_symbol),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [
        store_name, store_email, store_phone, store_address,
        bank_name, bank_account_name, bank_account_number, bank_routing_code, bank_swift_code,
        payment_instructions, standard_shipping_fee, free_shipping_threshold, currency, currency_symbol
      ]
    );

    res.json({
      success: true,
      message: 'Store settings updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getBanners = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM banners ORDER BY display_order ASC, id ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image_url, link_url, button_text, badge_text, display_order, is_active } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ success: false, message: 'Title and image URL are required.' });
    }

    const result = await query(
      `INSERT INTO banners (title, subtitle, image_url, link_url, button_text, badge_text, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title, subtitle || null, image_url, link_url || '/shop',
        button_text || 'Shop Now', badge_text || null,
        display_order ? parseInt(display_order, 10) : 0,
        is_active !== undefined ? !!is_active : true,
      ]
    );

    res.status(201).json({ success: true, message: 'Banner created.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image_url, link_url, button_text, badge_text, display_order, is_active } = req.body;

    const result = await query(
      `UPDATE banners
       SET title = COALESCE($1, title),
           subtitle = COALESCE($2, subtitle),
           image_url = COALESCE($3, image_url),
           link_url = COALESCE($4, link_url),
           button_text = COALESCE($5, button_text),
           badge_text = COALESCE($6, badge_text),
           display_order = COALESCE($7, display_order),
           is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [title, subtitle, image_url, link_url, button_text, badge_text, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    res.json({ success: true, message: 'Banner updated.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM banners WHERE id = $1', [id]);
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    // Top 5 selling products
    const topProductsSql = `
      SELECT oi.product_id, oi.product_name, oi.product_image,
             SUM(oi.quantity) as units_sold,
             SUM(oi.total_price) as gross_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE p.payment_status = 'confirmed' OR o.status IN ('processing', 'shipped', 'delivered')
      GROUP BY oi.product_id, oi.product_name, oi.product_image
      ORDER BY units_sold DESC
      LIMIT 5
    `;
    const topProductsRes = await query(topProductsSql);

    // Inventory status (stock levels, out of stock, valuation)
    const inventorySql = `
      SELECT
        COUNT(*) as total_skus,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN stock_quantity > 0 AND stock_quantity <= 10 THEN 1 END) as low_stock_count,
        COALESCE(SUM(stock_quantity * price), 0) as total_inventory_value
      FROM products
    `;
    const inventoryRes = await query(inventorySql);

    // Low stock items list
    const lowStockItemsSql = `
      SELECT id, name, sku, stock_quantity, price, is_active
      FROM products
      WHERE stock_quantity <= 15
      ORDER BY stock_quantity ASC
    `;
    const lowStockItemsRes = await query(lowStockItemsSql);

    res.json({
      success: true,
      data: {
        topSellingProducts: topProductsRes.rows,
        inventorySummary: inventoryRes.rows[0],
        lowStockItems: lowStockItemsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};
