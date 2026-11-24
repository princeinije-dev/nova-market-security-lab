import { query } from '../config/db.js';
import { slugify } from '../utils/helpers.js';

export const getCategories = async (req, res, next) => {
  try {
    const sql = `
      SELECT c.*,
             COUNT(p.id) FILTER (WHERE p.is_active = true) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const sql = `
      SELECT c.*,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image_url, is_active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    let slug = slugify(name);
    let count = 1;
    while (true) {
      const existing = await query('SELECT id FROM categories WHERE slug = $1', [slug]);
      if (existing.rows.length === 0) break;
      slug = `${slugify(name)}-${count++}`;
    }

    const result = await query(
      `INSERT INTO categories (name, slug, description, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), slug, description || null, image_url || null, is_active !== undefined ? !!is_active : true]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, is_active } = req.body;

    const check = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    let slug = check.rows[0].slug;
    if (name && name.trim() !== check.rows[0].name) {
      slug = slugify(name);
      let count = 1;
      while (true) {
        const existing = await query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
        if (existing.rows.length === 0) break;
        slug = `${slugify(name)}-${count++}`;
      }
    }

    const result = await query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = $2,
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name ? name.trim() : null, slug, description, image_url, is_active, id]
    );

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.json({ success: true, message: `Category "${result.rows[0].name}" deleted.` });
  } catch (error) {
    next(error);
  }
};
