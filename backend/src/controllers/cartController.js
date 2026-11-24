import { query, getClient } from '../config/db.js';

const getOrCreateCartId = async (client, userId) => {
  const existing = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  const created = await client.query(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
    [userId]
  );
  return created.rows[0].id;
};

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);

    if (cartRes.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
          subtotal: 0,
          itemCount: 0,
        },
      });
    }

    const cartId = cartRes.rows[0].id;
    const itemsSql = `
      SELECT ci.id, ci.product_id, ci.quantity, ci.created_at,
             p.name, p.slug, p.price, p.discount_price, p.stock_quantity, p.is_active,
             COALESCE(p.discount_price, p.price) as unit_price,
             (ci.quantity * COALESCE(p.discount_price, p.price)) as line_total,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1)
             ) as image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC
    `;
    const itemsRes = await query(itemsSql, [cartId]);

    const items = itemsRes.rows;
    let subtotal = 0;
    let itemCount = 0;

    for (const item of items) {
      subtotal += parseFloat(item.line_total);
      itemCount += parseInt(item.quantity, 10);
    }

    res.json({
      success: true,
      data: {
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        itemCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  const client = await getClient();
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    const qtyToAdd = parseInt(quantity, 10);
    if (!productId || isNaN(qtyToAdd) || qtyToAdd <= 0) {
      return res.status(400).json({ success: false, message: 'Valid productId and quantity are required.' });
    }

    // Check product existence, stock, and status
    const prodRes = await client.query(
      'SELECT id, name, price, discount_price, stock_quantity, is_active FROM products WHERE id = $1',
      [productId]
    );

    if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active) {
      return res.status(404).json({ success: false, message: 'Product not found or currently unavailable.' });
    }

    const product = prodRes.rows[0];
    if (product.stock_quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Sorry, this product is currently out of stock.' });
    }

    await client.query('BEGIN');
    const cartId = await getOrCreateCartId(client, userId);

    const existingItemRes = await client.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    let newQuantity = qtyToAdd;
    if (existingItemRes.rows.length > 0) {
      newQuantity = existingItemRes.rows[0].quantity + qtyToAdd;
    }

    // Validate that new quantity does not exceed stock
    if (newQuantity > product.stock_quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot add ${qtyToAdd} more. Only ${product.stock_quantity} available in stock (you already have ${existingItemRes.rows.length > 0 ? existingItemRes.rows[0].quantity : 0} in your cart).`,
      });
    }

    if (existingItemRes.rows.length > 0) {
      await client.query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, existingItemRes.rows[0].id]
      );
    } else {
      await client.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, newQuantity]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Added ${product.name} to your cart.`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const updateCartItem = async (req, res, next) => {
  const client = await getClient();
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (!productId || isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Valid productId and quantity are required.' });
    }

    await client.query('BEGIN');
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }
    const cartId = cartRes.rows[0].id;

    if (qty <= 0) {
      await client.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    // Verify stock
    const prodRes = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (qty > prodRes.rows[0].stock_quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock (${prodRes.rows[0].stock_quantity} available).`,
      });
    }

    await client.query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE cart_id = $2 AND product_id = $3',
      [qty, cartId, productId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Cart updated successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length > 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [
        cartRes.rows[0].id,
        productId,
      ]);
    }

    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length > 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1', [cartRes.rows[0].id]);
    }
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    next(error);
  }
};

export const syncCart = async (req, res, next) => {
  const client = await getClient();
  try {
    const userId = req.user.id;
    const { localItems = [] } = req.body;

    if (!Array.isArray(localItems) || localItems.length === 0) {
      return res.json({ success: true, message: 'No items to sync.' });
    }

    await client.query('BEGIN');
    const cartId = await getOrCreateCartId(client, userId);

    for (const item of localItems) {
      const prodRes = await client.query('SELECT stock_quantity, is_active FROM products WHERE id = $1', [item.productId]);
      if (prodRes.rows.length > 0 && prodRes.rows[0].is_active) {
        const availableStock = prodRes.rows[0].stock_quantity;
        const currentItemRes = await client.query(
          'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
          [cartId, item.productId]
        );

        let finalQty = item.quantity;
        if (currentItemRes.rows.length > 0) {
          finalQty = Math.min(currentItemRes.rows[0].quantity + item.quantity, availableStock);
          await client.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [finalQty, currentItemRes.rows[0].id]);
        } else {
          finalQty = Math.min(item.quantity, availableStock);
          if (finalQty > 0) {
            await client.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)', [cartId, item.productId, finalQty]);
          }
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Cart synced successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
