import { query } from '../config/db.js';

const getOrCreateWishlistId = async (userId) => {
  const existing = await query('SELECT id FROM wishlists WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  const created = await query('INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id', [userId]);
  return created.rows[0].id;
};

export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlistId = await getOrCreateWishlistId(userId);

    const sql = `
      SELECT wi.id, wi.product_id, wi.created_at,
             p.name, p.slug, p.price, p.discount_price, p.stock_quantity, p.is_active, p.rating_avg,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1)
             ) as primary_image
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      WHERE wi.wishlist_id = $1
      ORDER BY wi.created_at DESC
    `;
    const result = await query(sql, [wishlistId]);

    res.json({
      success: true,
      data: result.rows,
      itemCount: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required.' });
    }

    const wishlistId = await getOrCreateWishlistId(userId);

    const check = await query(
      'SELECT id FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2',
      [wishlistId, productId]
    );

    if (check.rows.length > 0) {
      await query('DELETE FROM wishlist_items WHERE id = $1', [check.rows[0].id]);
      return res.json({
        success: true,
        inWishlist: false,
        message: 'Removed from your wishlist.',
      });
    } else {
      await query(
        'INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1, $2)',
        [wishlistId, productId]
      );
      return res.json({
        success: true,
        inWishlist: true,
        message: 'Added to your wishlist.',
      });
    }
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlistId = await getOrCreateWishlistId(userId);

    await query(
      'DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2',
      [wishlistId, productId]
    );

    res.json({ success: true, message: 'Item removed from wishlist.' });
  } catch (error) {
    next(error);
  }
};
