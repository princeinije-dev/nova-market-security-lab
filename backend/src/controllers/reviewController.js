import { query, getClient } from '../config/db.js';

const recalculateProductRating = async (client, productId) => {
  const ratingRes = await client.query(
    `SELECT COUNT(*) as count, AVG(rating) as avg
     FROM reviews
     WHERE product_id = $1 AND status = 'approved'`,
    [productId]
  );
  const count = parseInt(ratingRes.rows[0].count, 10);
  const avg = count > 0 ? parseFloat(parseFloat(ratingRes.rows[0].avg).toFixed(2)) : 0.0;

  await client.query(
    'UPDATE products SET rating_avg = $1, rating_count = $2 WHERE id = $3',
    [avg, count, productId]
  );
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at,
              u.name as user_name, u.avatar as user_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [productId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req, res, next) => {
  const client = await getClient();
  try {
    const userId = req.user.id;
    const { productId, rating, title, comment } = req.body;

    const parsedRating = parseInt(rating, 10);
    if (!productId || isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Review comment cannot be empty.' });
    }

    await client.query('BEGIN');

    // Check if user already reviewed
    const existing = await client.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, userId]
    );

    let review;
    if (existing.rows.length > 0) {
      const updateRes = await client.query(
        `UPDATE reviews
         SET rating = $1, title = $2, comment = $3, status = 'approved', updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [parsedRating, title || null, comment.trim(), existing.rows[0].id]
      );
      review = updateRes.rows[0];
    } else {
      const insertRes = await client.query(
        `INSERT INTO reviews (product_id, user_id, rating, title, comment, status)
         VALUES ($1, $2, $3, $4, $5, 'approved')
         RETURNING *`,
        [productId, userId, parsedRating, title || null, comment.trim()]
      );
      review = insertRes.rows[0];
    }

    await recalculateProductRating(client, productId);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Review posted successfully.',
      data: review,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const sql = `
      SELECT r.*,
             p.name as product_name, p.slug as product_slug,
             u.name as user_name, u.email as user_email
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatusAdmin = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    await client.query('BEGIN');

    const updateRes = await client.query(
      'UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING product_id',
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    await recalculateProductRating(client, updateRes.rows[0].product_id);

    await client.query('COMMIT');

    res.json({ success: true, message: `Review status changed to ${status}.` });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const deleteReviewAdmin = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const delRes = await client.query('DELETE FROM reviews WHERE id = $1 RETURNING product_id', [id]);
    if (delRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    await recalculateProductRating(client, delRes.rows[0].product_id);

    await client.query('COMMIT');

    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
