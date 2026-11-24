import { getClient, query } from '../config/db.js';
import { generateOrderNumber, generatePaymentReference } from '../utils/helpers.js';

export const processOrderCreation = async ({
  userId,
  items,
  shippingAddress,
  billingAddress,
  couponCode,
  customerNotes,
}) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Cannot checkout with an empty list of items.');
    }

    if (!shippingAddress || !shippingAddress.full_name || !shippingAddress.street_address) {
      throw new Error('Valid shipping address details are required.');
    }

    // 1. Fetch store settings for shipping configuration
    const settingsRes = await client.query('SELECT * FROM store_settings LIMIT 1');
    const settings = settingsRes.rows[0] || {
      standard_shipping_fee: 15.0,
      free_shipping_threshold: 150.0,
    };

    let calculatedSubtotal = 0;
    const validatedItems = [];

    // 2. Validate every item against live database prices and stock, with FOR UPDATE lock
    for (const item of items) {
      const prodRes = await client.query(
        `SELECT id, name, price, discount_price, stock_quantity, is_active,
                COALESCE(
                  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
                  (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1)
                ) as image_url
         FROM products p
         WHERE p.id = $1 FOR UPDATE`,
        [item.productId || item.product_id]
      );

      if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active) {
        throw new Error(`Product "${item.name || 'item'}" is currently unavailable.`);
      }

      const product = prodRes.rows[0];
      const quantity = parseInt(item.quantity, 10);

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for product ${product.name}.`);
      }

      if (product.stock_quantity < quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${quantity}.`
        );
      }

      const unitPrice = parseFloat(product.discount_price !== null && product.discount_price !== undefined
        ? product.discount_price
        : product.price);
      const lineTotal = parseFloat((unitPrice * quantity).toFixed(2));

      calculatedSubtotal += lineTotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productPrice: unitPrice,
        productImage: product.image_url,
        quantity,
        totalPrice: lineTotal,
        currentStock: product.stock_quantity,
      });
    }

    calculatedSubtotal = parseFloat(calculatedSubtotal.toFixed(2));

    // 3. Calculate Shipping Fee
    let shippingFee = parseFloat(settings.standard_shipping_fee || 15.0);
    const freeThreshold = parseFloat(settings.free_shipping_threshold || 150.0);
    if (calculatedSubtotal >= freeThreshold) {
      shippingFee = 0.0;
    }

    // 4. Validate Coupon if provided
    let discountAmount = 0.0;
    let couponId = null;
    let appliedCouponCode = null;

    if (couponCode && couponCode.trim()) {
      const couponRes = await client.query(
        `SELECT * FROM coupons
         WHERE UPPER(code) = UPPER($1) AND is_active = true
         FOR UPDATE`,
        [couponCode.trim()]
      );

      if (couponRes.rows.length > 0) {
        const coupon = couponRes.rows[0];
        const minSpend = parseFloat(coupon.min_spend || 0);

        const isNotExpired = !coupon.expires_at || new Date(coupon.expires_at) >= new Date();
        const hasLimit = !coupon.usage_limit || coupon.usage_count < coupon.usage_limit;

        if (isNotExpired && hasLimit && calculatedSubtotal >= minSpend) {
          couponId = coupon.id;
          appliedCouponCode = coupon.code;

          if (coupon.discount_type === 'percentage') {
            discountAmount = (calculatedSubtotal * parseFloat(coupon.discount_value)) / 100;
            if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
              discountAmount = parseFloat(coupon.max_discount);
            }
          } else {
            discountAmount = parseFloat(coupon.discount_value);
          }

          discountAmount = Math.min(discountAmount, calculatedSubtotal);
          discountAmount = parseFloat(discountAmount.toFixed(2));

          // Increment coupon usage
          await client.query(
            'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1',
            [coupon.id]
          );
        }
      }
    }

    // 5. Total calculation
    const totalAmount = parseFloat(
      Math.max(0, calculatedSubtotal + shippingFee - discountAmount).toFixed(2)
    );

    // 6. Generate unique order number
    let orderNumber = generateOrderNumber();
    while (true) {
      const existing = await client.query('SELECT id FROM orders WHERE order_number = $1', [orderNumber]);
      if (existing.rows.length === 0) break;
      orderNumber = generateOrderNumber();
    }

    // 7. Insert Order
    const orderInsertSql = `
      INSERT INTO orders (
        order_number, user_id, status, subtotal, shipping_fee, discount_amount,
        total_amount, coupon_id, coupon_code, shipping_address, billing_address,
        customer_notes
      ) VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const orderRes = await client.query(orderInsertSql, [
      orderNumber,
      userId || null,
      calculatedSubtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      couponId,
      appliedCouponCode,
      JSON.stringify(shippingAddress),
      JSON.stringify(billingAddress || shippingAddress),
      customerNotes || null,
    ]);

    const order = orderRes.rows[0];

    // 8. Insert Order Items & Deduct Inventory Stock
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_price, product_image, quantity, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          item.productId,
          item.productName,
          item.productPrice,
          item.productImage,
          item.quantity,
          item.totalPrice,
        ]
      );

      // Deduct stock in DB
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }

    // 9. Create Bank Transfer Payment Record (Status: 'pending')
    const initialReference = generatePaymentReference();
    const paymentRes = await client.query(
      `INSERT INTO payments (
        order_id, payment_method, payment_status, amount, transaction_reference,
        payment_notes
      ) VALUES ($1, 'bank_transfer', 'pending', $2, $3, 'Awaiting bank transfer confirmation')
      RETURNING *`,
      [order.id, totalAmount, initialReference]
    );

    // 10. Clear user's shopping cart in database
    if (userId) {
      const userCart = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
      if (userCart.rows.length > 0) {
        await client.query('DELETE FROM cart_items WHERE cart_id = $1', [userCart.rows[0].id]);
      }
    }

    await client.query('COMMIT');

    return {
      order,
      payment: paymentRes.rows[0],
      items: validatedItems,
      storeBankDetails: {
        bankName: settings.bank_name,
        accountName: settings.bank_account_name,
        accountNumber: settings.bank_account_number,
        routingCode: settings.bank_routing_code,
        swiftCode: settings.bank_swift_code,
        instructions: settings.payment_instructions,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
