import { query, getClient } from '../config/db.js';
import { slugify, getPagination } from '../utils/helpers.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      rating,
      sort = 'newest',
      page = 1,
      limit = 12,
      featured,
      allStatus,
    } = req.query;

    const { page: currentPage, limit: pageLimit, offset } = getPagination(page, limit);

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // By default only active products for public unless admin requests allStatus
    if (allStatus !== 'true') {
      conditions.push(`p.is_active = true`);
    }

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
      paramIndex++;
    }

    if (category) {
      values.push(category);
      conditions.push(`(c.slug = $${paramIndex} OR c.id::text = $${paramIndex})`);
      paramIndex++;
    }

    if (minPrice && !isNaN(minPrice)) {
      values.push(parseFloat(minPrice));
      conditions.push(`COALESCE(p.discount_price, p.price) >= $${paramIndex}`);
      paramIndex++;
    }

    if (maxPrice && !isNaN(maxPrice)) {
      values.push(parseFloat(maxPrice));
      conditions.push(`COALESCE(p.discount_price, p.price) <= $${paramIndex}`);
      paramIndex++;
    }

    if (inStock === 'true') {
      conditions.push(`p.stock_quantity > 0`);
    }

    if (rating && !isNaN(rating)) {
      values.push(parseFloat(rating));
      conditions.push(`p.rating_avg >= $${paramIndex}`);
      paramIndex++;
    }

    if (featured === 'true') {
      conditions.push(`p.is_featured = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'COALESCE(p.discount_price, p.price) ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'COALESCE(p.discount_price, p.price) DESC';
    } else if (sort === 'rating') {
      orderBy = 'p.rating_avg DESC, p.rating_count DESC';
    } else if (sort === 'name_asc') {
      orderBy = 'p.name ASC';
    } else if (sort === 'name_desc') {
      orderBy = 'p.name DESC';
    } else if (sort === 'featured') {
      orderBy = 'p.is_featured DESC, p.created_at DESC';
    }

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const totalItems = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(totalItems / pageLimit);

    // Data query with primary image
    const dataSql = `
      SELECT p.*,
             c.name as category_name, c.slug as category_slug,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1)
             ) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
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
        totalPages,
        hasMore: currentPage < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const sql = `
      SELECT p.*,
             c.name as category_name, c.slug as category_slug,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1)
             ) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.is_featured = true
      ORDER BY p.rating_avg DESC, p.created_at DESC
      LIMIT 8
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlugOrId = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);

    const condition = isNumeric ? 'p.id = $1 OR p.slug = $1' : 'p.slug = $1';

    const productSql = `
      SELECT p.*,
             c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${condition}
    `;
    const productRes = await query(productSql, [identifier]);

    if (productRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = productRes.rows[0];

    // Fetch images
    const imagesRes = await query(
      `SELECT id, image_url, is_primary, display_order
       FROM product_images
       WHERE product_id = $1
       ORDER BY is_primary DESC, display_order ASC, id ASC`,
      [product.id]
    );
    product.images = imagesRes.rows;

    // Fetch approved reviews
    const reviewsRes = await query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at,
              u.name as user_name, u.avatar as user_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [product.id]
    );
    product.reviews = reviewsRes.rows;

    // Fetch related products
    const relatedSql = `
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.rating_avg, p.rating_count, p.stock_quantity,
             COALESCE(
               (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1)
             ) as primary_image
      FROM products p
      WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
      ORDER BY p.rating_avg DESC
      LIMIT 4
    `;
    const relatedRes = await query(relatedSql, [product.category_id, product.id]);
    product.related = relatedRes.rows;

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  const client = await getClient();
  try {
    const {
      name,
      description,
      short_description,
      price,
      discount_price,
      category_id,
      stock_quantity,
      sku,
      is_featured,
      is_active,
      images = [],
    } = req.body;

    if (!name || !price || !description) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and description are required.',
      });
    }

    await client.query('BEGIN');

    let baseSlug = slugify(name);
    let uniqueSlug = baseSlug;
    let count = 1;
    while (true) {
      const existing = await client.query('SELECT id FROM products WHERE slug = $1', [uniqueSlug]);
      if (existing.rows.length === 0) break;
      uniqueSlug = `${baseSlug}-${count++}`;
    }

    const generatedSku = sku || `SKU-${Date.now().toString(36).toUpperCase()}`;

    const insertSql = `
      INSERT INTO products (
        name, slug, description, short_description, price, discount_price,
        category_id, stock_quantity, sku, is_featured, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const productRes = await client.query(insertSql, [
      name.trim(),
      uniqueSlug,
      description,
      short_description || null,
      parseFloat(price),
      discount_price ? parseFloat(discount_price) : null,
      category_id ? parseInt(category_id, 10) : null,
      parseInt(stock_quantity || 0, 10),
      generatedSku,
      !!is_featured,
      is_active !== undefined ? !!is_active : true,
    ]);

    const product = productRes.rows[0];

    // Insert images
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = typeof images[i] === 'string' ? { url: images[i], is_primary: i === 0 } : images[i];
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
           VALUES ($1, $2, $3, $4)`,
          [product.id, img.url || img.image_url, !!img.is_primary, i]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const updateProduct = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const {
      name,
      description,
      short_description,
      price,
      discount_price,
      category_id,
      stock_quantity,
      sku,
      is_featured,
      is_active,
      images,
    } = req.body;

    const checkRes = await client.query('SELECT * FROM products WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await client.query('BEGIN');

    let slug = checkRes.rows[0].slug;
    if (name && name !== checkRes.rows[0].name) {
      const baseSlug = slugify(name);
      slug = baseSlug;
      let count = 1;
      while (true) {
        const existing = await client.query('SELECT id FROM products WHERE slug = $1 AND id != $2', [slug, id]);
        if (existing.rows.length === 0) break;
        slug = `${baseSlug}-${count++}`;
      }
    }

    const updateSql = `
      UPDATE products
      SET name = COALESCE($1, name),
          slug = $2,
          description = COALESCE($3, description),
          short_description = COALESCE($4, short_description),
          price = COALESCE($5, price),
          discount_price = $6,
          category_id = $7,
          stock_quantity = COALESCE($8, stock_quantity),
          sku = COALESCE($9, sku),
          is_featured = COALESCE($10, is_featured),
          is_active = COALESCE($11, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const productRes = await client.query(updateSql, [
      name ? name.trim() : null,
      slug,
      description,
      short_description,
      price !== undefined ? parseFloat(price) : null,
      discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : checkRes.rows[0].discount_price,
      category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : checkRes.rows[0].category_id,
      stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null,
      sku,
      is_featured !== undefined ? !!is_featured : null,
      is_active !== undefined ? !!is_active : null,
      id,
    ]);

    if (Array.isArray(images)) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      for (let i = 0; i < images.length; i++) {
        const img = typeof images[i] === 'string' ? { url: images[i], is_primary: i === 0 } : images[i];
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
           VALUES ($1, $2, $3, $4)`,
          [id, img.url || img.image_url, !!img.is_primary, i]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: productRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: `Product "${result.rows[0].name}" deleted.` });
  } catch (error) {
    next(error);
  }
};
