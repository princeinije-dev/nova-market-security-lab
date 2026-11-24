import { query } from '../config/db.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const sub = parseFloat(subtotal || 0);

    const result = await query(
      `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = true`,
      [code.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    const coupon = result.rows[0];

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    // Check min spend
    const minSpend = parseFloat(coupon.min_spend || 0);
    if (sub < minSpend) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum subtotal of $${minSpend.toFixed(2)}.`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (sub * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
        discountAmount = parseFloat(coupon.max_discount);
      }
    } else {
      discountAmount = parseFloat(coupon.discount_value);
    }

    // Never exceed subtotal
    discountAmount = Math.min(discountAmount, sub);
    discountAmount = parseFloat(discountAmount.toFixed(2));

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCouponsAdmin = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createCouponAdmin = async (req, res, next) => {
  try {
    const { code, discount_type, discount_value, min_spend, max_discount, usage_limit, expires_at, is_active } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await query('SELECT id FROM coupons WHERE code = $1', [cleanCode]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A coupon with this code already exists.' });
    }

    const result = await query(
      `INSERT INTO coupons (
        code, discount_type, discount_value, min_spend, max_discount, usage_limit, expires_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        cleanCode,
        discount_type || 'percentage',
        parseFloat(discount_value),
        min_spend ? parseFloat(min_spend) : 0,
        max_discount ? parseFloat(max_discount) : null,
        usage_limit ? parseInt(usage_limit, 10) : 100,
        expires_at || null,
        is_active !== undefined ? !!is_active : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateCouponAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, discount_type, discount_value, min_spend, max_discount, usage_limit, expires_at, is_active } = req.body;

    const check = await query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const cleanCode = code ? code.trim().toUpperCase() : check.rows[0].code;

    const result = await query(
      `UPDATE coupons
       SET code = $1,
           discount_type = COALESCE($2, discount_type),
           discount_value = COALESCE($3, discount_value),
           min_spend = COALESCE($4, min_spend),
           max_discount = $5,
           usage_limit = COALESCE($6, usage_limit),
           expires_at = $7,
           is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [
        cleanCode,
        discount_type,
        discount_value !== undefined ? parseFloat(discount_value) : null,
        min_spend !== undefined ? parseFloat(min_spend) : null,
        max_discount !== undefined ? (max_discount ? parseFloat(max_discount) : null) : check.rows[0].max_discount,
        usage_limit !== undefined ? parseInt(usage_limit, 10) : null,
        expires_at !== undefined ? expires_at : check.rows[0].expires_at,
        is_active !== undefined ? !!is_active : null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Coupon updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCouponAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM coupons WHERE id = $1 RETURNING code', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    res.json({ success: true, message: `Coupon "${result.rows[0].code}" deleted.` });
  } catch (error) {
    next(error);
  }
};
