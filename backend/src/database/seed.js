import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedDatabase = async () => {
  console.log('🔄 Initializing database schema and seeding initial data...');

  try {
    // 1. Run schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await query(schemaSql);
    console.log('✓ Database tables created/verified successfully.');

    // 2. Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin123!', salt);
    const customerPasswordHash = await bcrypt.hash('Customer123!', salt);

    // 3. Insert Admin User
    const adminUserRes = await query(
      `INSERT INTO users (name, email, password, role, phone, status)
       VALUES ($1, $2, $3, 'admin', $4, 'active')
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, role = 'admin', status = 'active'
       RETURNING id, name, email`,
      ['Alexander Vance', 'admin@ecommerce.com', adminPasswordHash, '+1 (555) 010-9999']
    );
    const adminId = adminUserRes.rows[0].id;

    await query(
      `INSERT INTO admins (user_id, department, permissions)
       VALUES ($1, 'Executive Operations', ARRAY['all'])
       ON CONFLICT (user_id) DO UPDATE SET department = EXCLUDED.department`,
      [adminId]
    );

    // 4. Insert Customers
    const customer1Res = await query(
      `INSERT INTO users (name, email, password, role, phone, status)
       VALUES ($1, $2, $3, 'customer', $4, 'active')
       ON CONFLICT (email) DO UPDATE SET status = 'active'
       RETURNING id, name, email`,
      ['Elena Rostova', 'customer@ecommerce.com', customerPasswordHash, '+1 (555) 234-5678']
    );
    const customer1Id = customer1Res.rows[0].id;

    const customer2Res = await query(
      `INSERT INTO users (name, email, password, role, phone, status)
       VALUES ($1, $2, $3, 'customer', $4, 'active')
       ON CONFLICT (email) DO UPDATE SET status = 'active'
       RETURNING id, name, email`,
      ['Marcus Thorne', 'marcus.t@example.com', customerPasswordHash, '+1 (555) 789-0123']
    );
    const customer2Id = customer2Res.rows[0].id;

    // 5. Insert Customer Address
    await query(
      `INSERT INTO addresses (user_id, address_type, full_name, phone, street_address, city, state, postal_code, country, is_default)
       VALUES ($1, 'shipping', 'Elena Rostova', '+1 (555) 234-5678', '742 Evergreen Terrace', 'Springfield', 'OR', '97477', 'United States', true)
       ON CONFLICT DO NOTHING`,
      [customer1Id]
    );

    // 6. Insert Store Settings
    await query(
      `INSERT INTO store_settings (
        id, store_name, store_email, store_phone, store_address,
        bank_name, bank_account_name, bank_account_number, bank_routing_code, bank_swift_code,
        payment_instructions, standard_shipping_fee, free_shipping_threshold, currency, currency_symbol
       ) VALUES (
        1, 'NovaMarket Luxury & Tech', 'orders@novamarket.com', '+1 (800) 555-0199',
        '100 Commerce Way, Suite 400, New York, NY 10001',
        'Chase Manhattan Commercial Bank', 'NovaMarket Global Direct LLC', '9876-5432-1001', '021000021', 'CHASUS33',
        'Please transfer the exact order amount to the bank account above and enter your Order Number as the payment reference. Once completed, submit your transaction reference in your order details for swift confirmation.',
        15.00, 150.00, 'USD', '$'
       ) ON CONFLICT (id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        bank_account_number = EXCLUDED.bank_account_number,
        standard_shipping_fee = EXCLUDED.standard_shipping_fee`
    );

    // 7. Insert Banners
    await query(`DELETE FROM banners`);
    await query(
      `INSERT INTO banners (title, subtitle, image_url, link_url, button_text, badge_text, display_order, is_active)
       VALUES
       (
         'Elevate Your Everyday Essentials',
         'Discover artisan craftsmanship, precision acoustics, and modern tech engineered for perfection.',
         'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
         '/shop', 'Shop New Arrivals', 'Autumn/Winter 2026', 1, true
       ),
       (
         'Precision Chronographs & Wearables',
         'Timeless luxury built with aerospace titanium and sapphire crystal glass.',
         'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80',
         '/shop?category=watches-wearables', 'Explore Watches', 'Curated Collection', 2, true
       ),
       (
         'Studio Audio & Workstations',
         'Transform your creative sanctuary with high-fidelity sound and ergonomic masterworks.',
         'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1600&q=80',
         '/shop?category=electronics-audio', 'Listen Now', 'Audiophile Grade', 3, true
       )`
    );

    // 8. Insert Categories
    const categoriesData = [
      {
        name: 'Electronics & Audio',
        slug: 'electronics-audio',
        description: 'Immersive sound, noise-canceling headphones, and audiophile desktop audio.',
        image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Watches & Wearables',
        slug: 'watches-wearables',
        description: 'Mechanical luxury chronographs and smart titanium fitness trackers.',
        image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Computers & Accessories',
        slug: 'computers-accessories',
        description: 'Custom mechanical keyboards, high-DPI ergonomic mice, and 4K OLED displays.',
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Home & Lifestyle',
        slug: 'home-lifestyle',
        description: 'Artisan pour-over coffee systems, ambient ultrasonic diffusers, and luxury scents.',
        image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Luxury Leather & Bags',
        slug: 'luxury-leather',
        description: 'Handcrafted full-grain leather weekenders, laptop sleeves, and durable backpacks.',
        image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
      },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const catRes = await query(
        `INSERT INTO categories (name, slug, description, image_url, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url
         RETURNING id, slug`,
        [cat.name, cat.slug, cat.description, cat.image_url]
      );
      categoryMap[cat.slug] = catRes.rows[0].id;
    }

    // 9. Insert Coupons
    const couponsData = [
      { code: 'WELCOME10', type: 'percentage', value: 10.0, min_spend: 50.0, max_discount: 50.0, limit: 500 },
      { code: 'NOVA20', type: 'percentage', value: 20.0, min_spend: 150.0, max_discount: 100.0, limit: 200 },
      { code: 'VIP50', type: 'fixed', value: 50.0, min_spend: 250.0, max_discount: null, limit: 100 },
      { code: 'FREESHIP', type: 'fixed', value: 15.0, min_spend: 75.0, max_discount: null, limit: 300 },
    ];

    for (const c of couponsData) {
      await query(
        `INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_discount, usage_limit, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (code) DO UPDATE
         SET discount_value = EXCLUDED.discount_value, min_spend = EXCLUDED.min_spend, is_active = true`,
        [c.code, c.type, c.value, c.min_spend, c.max_discount, c.limit]
      );
    }

    // 10. Insert Products & Images
    const productsData = [
      {
        name: 'Aura Pro Wireless Noise-Cancelling Headphones',
        slug: 'aura-pro-wireless-headphones',
        category_slug: 'electronics-audio',
        short_description: 'Custom 40mm beryllium drivers with hybrid active noise cancellation.',
        description: 'Immerse yourself in concert-hall acoustic precision. The Aura Pro combines custom 40mm beryllium dynamic drivers with advanced hybrid active noise cancellation (ANC). Featuring 38-hour battery longevity, memory foam lambskin earcups, and dual beamforming microphones with AI wind reduction for pristine conference calls.',
        price: 349.99,
        discount_price: 299.99,
        stock_quantity: 45,
        sku: 'AUD-AUR-001',
        is_featured: true,
        rating_avg: 4.85,
        rating_count: 24,
        images: [
          { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80', is_primary: false },
          { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Chronos Titanium Mechanical Chronograph',
        slug: 'chronos-titanium-chronograph',
        category_slug: 'watches-wearables',
        short_description: 'Grade 5 aerospace titanium with sapphire crystal and 100m water resistance.',
        description: 'Forged from ultralight Grade 5 aerospace titanium, the Chronos Mechanical Chronograph houses a certified 28,800 vph automatic Swiss movement with a 65-hour power reserve. Anti-reflective sapphire crystal glass, Super-LumiNova dial markers, and an integrated quick-release titanium bracelet.',
        price: 890.00,
        discount_price: 799.00,
        stock_quantity: 18,
        sku: 'WAT-CHR-002',
        is_featured: true,
        rating_avg: 4.95,
        rating_count: 19,
        images: [
          { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80', is_primary: false },
          { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Apex Minimalist Wireless Mechanical Keyboard',
        slug: 'apex-minimalist-mechanical-keyboard',
        category_slug: 'computers-accessories',
        short_description: 'Hot-swappable tactile switches, CNC anodized aluminum frame, and PBT keycaps.',
        description: 'Engineered for coders and writers who demand tactile perfection. The Apex features a solid CNC milled aluminum casing, factory-lubed linear switches, sound-dampening silicone gaskets, tri-mode connectivity (2.4GHz wireless, Bluetooth 5.2, USB-C), and double-shot PBT dye-sub keycaps that never fade.',
        price: 189.99,
        discount_price: 169.99,
        stock_quantity: 36,
        sku: 'CMP-KB-003',
        is_featured: true,
        rating_avg: 4.78,
        rating_count: 31,
        images: [
          { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=900&q=80', is_primary: false },
          { url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Lumina OLED 4K Ultra-Thin Monitor 27-inch',
        slug: 'lumina-oled-4k-monitor',
        category_slug: 'computers-accessories',
        short_description: 'True black 0.1ms OLED panel with 99% DCI-P3 color reproduction.',
        description: 'Experience jaw-dropping contrast and vibrant lifelike colors. Lumina 27 boasts a razor-thin 4K QD-OLED panel with infinite contrast ratio, 144Hz refresh rate, 99.5% DCI-P3 color gamut accuracy, and single-cable 90W USB-C Power Delivery to charge your laptop while driving the display.',
        price: 649.00,
        discount_price: 599.00,
        stock_quantity: 22,
        sku: 'CMP-MON-004',
        is_featured: true,
        rating_avg: 4.90,
        rating_count: 15,
        images: [
          { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Vanguard Full-Grain Leather Weekender Bag',
        slug: 'vanguard-leather-weekender-bag',
        category_slug: 'luxury-leather',
        short_description: 'Vegetable-tanned full-grain Italian leather with solid brass hardware.',
        description: 'Handcrafted by master artisans in Tuscany using vegetable-tanned full-grain cowhide that develops a rich, personal patina over time. Features YKK Excella antique brass zippers, dedicated padded 16-inch laptop compartment, waterproof shoe sleeve, and reinforced luggage handle pass-through.',
        price: 285.00,
        discount_price: 245.00,
        stock_quantity: 15,
        sku: 'BAG-VAN-005',
        is_featured: true,
        rating_avg: 4.92,
        rating_count: 28,
        images: [
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'AcousticStudio Hi-Fi Desktop Speakers (Walnut)',
        slug: 'acoustic-studio-desktop-speakers',
        category_slug: 'electronics-audio',
        short_description: 'Natural solid American walnut acoustic enclosure with silk dome tweeters.',
        description: 'Pairing acoustic warmth with modern power. Each cabinet is carved from hand-finished solid American walnut wood, eliminating internal resonance. Outfitted with 1-inch silk dome tweeters, 4-inch Kevlar woofers, and integrated aptX HD Bluetooth for wireless studio-grade streaming.',
        price: 420.00,
        discount_price: null,
        stock_quantity: 14,
        sku: 'AUD-SPK-006',
        is_featured: true,
        rating_avg: 4.88,
        rating_count: 17,
        images: [
          { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Horizon Smart Fitness Titanium Ring',
        slug: 'horizon-smart-fitness-ring',
        category_slug: 'watches-wearables',
        short_description: 'Continuous biometric sleep, HRV, temperature, and recovery tracking.',
        description: 'Invisible technology that tracks what matters most. Crafted from durable polished titanium with a non-allergenic medical inner shell. Delivers medical-grade sleep analysis, readiness scoring, body temperature delta, and 7 days of continuous battery life without requiring bulky wristbands.',
        price: 279.00,
        discount_price: 249.00,
        stock_quantity: 50,
        sku: 'WAT-RNG-007',
        is_featured: false,
        rating_avg: 4.65,
        rating_count: 19,
        images: [
          { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Elysian Pour-Over Precision Coffee System',
        slug: 'elysian-pour-over-coffee-system',
        category_slug: 'home-lifestyle',
        short_description: 'Laboratory-grade borosilicate glass dripper with integrated digital scale.',
        description: 'Elevate your morning brew ritual into an art form. The Elysian pour-over features thermal-shock resistant borosilicate glass, stainless steel micro-mesh filter basket, and a magnetic walnut base with embedded gram-accurate timer and flow-rate sensor for repeatable barista extractions.',
        price: 165.00,
        discount_price: 139.00,
        stock_quantity: 32,
        sku: 'HOM-COF-008',
        is_featured: true,
        rating_avg: 4.79,
        rating_count: 22,
        images: [
          { url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Zenith Ultra-Compact Ergonomic Wireless Mouse',
        slug: 'zenith-ergonomic-wireless-mouse',
        category_slug: 'computers-accessories',
        short_description: 'Precision 26K DPI optical sensor with silent tactile switches.',
        description: 'Engineered in collaboration with ergonomic physical therapists. Designed with a 57-degree natural handshake angle that relieves wrist tension during 10+ hour creative sprints. Dual connection modes, hyper-fast magnetic scroll wheel, and 70 days of battery life per USB-C charge.',
        price: 89.00,
        discount_price: null,
        stock_quantity: 65,
        sku: 'CMP-MSE-009',
        is_featured: false,
        rating_avg: 4.74,
        rating_count: 40,
        images: [
          { url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Nomad Canvas & Leather Everyday Backpack 20L',
        slug: 'nomad-canvas-leather-backpack',
        category_slug: 'luxury-leather',
        short_description: 'Waxed water-resistant cotton canvas with bridle leather trim.',
        description: 'Built for daily city commutes and weekend wanderlust. Features rugged 18oz Scottish waxed cotton canvas that repels heavy rain, vegetable-tanned bridle leather straps, dedicated 15-inch laptop compartment with quick side access, and hidden passport security pocket.',
        price: 145.00,
        discount_price: 125.00,
        stock_quantity: 28,
        sku: 'BAG-NOM-010',
        is_featured: false,
        rating_avg: 4.81,
        rating_count: 35,
        images: [
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Prism Pure Aroma Ultrasonic Diffuser',
        slug: 'prism-pure-aroma-ultrasonic-diffuser',
        category_slug: 'home-lifestyle',
        short_description: 'Whisper-quiet ceramic ultrasonic misting with warm ambient lighting.',
        description: 'Transform your home atmosphere into a serene sanctuary. Hand-glazed matte stoneware ceramic shell encases a 2.4MHz ultrasonic transducer that vaporizes essential oils without heating or degrading their natural therapeutic botanical properties. Automatic safety shut-off included.',
        price: 79.00,
        discount_price: 65.00,
        stock_quantity: 40,
        sku: 'HOM-DIF-011',
        is_featured: false,
        rating_avg: 4.67,
        rating_count: 14,
        images: [
          { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
      {
        name: 'Artisan Amber & Smoked Cedar Soy Candle Trio',
        slug: 'artisan-amber-cedar-candle-trio',
        category_slug: 'home-lifestyle',
        short_description: '100% natural soy wax with crackling organic wooden wicks.',
        description: 'Hand-poured in small batches using clean-burning American grown soy wax and phthalate-free botanical perfume oils. Features natural crackling FSC-certified cherry wood wicks in heavy amber glass vessels. Scent notes of aged teakwood, smoked cedar, and warm golden amber.',
        price: 48.00,
        discount_price: null,
        stock_quantity: 85,
        sku: 'HOM-CND-012',
        is_featured: false,
        rating_avg: 4.90,
        rating_count: 52,
        images: [
          { url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80', is_primary: false },
        ],
      },
    ];

    const productMap = {};
    for (const p of productsData) {
      const catId = categoryMap[p.category_slug] || null;
      const prodRes = await query(
        `INSERT INTO products (
          name, slug, description, short_description, price, discount_price,
          category_id, stock_quantity, sku, is_featured, is_active, rating_avg, rating_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          discount_price = EXCLUDED.discount_price,
          stock_quantity = EXCLUDED.stock_quantity,
          is_featured = EXCLUDED.is_featured,
          category_id = EXCLUDED.category_id
        RETURNING id, slug, name, price, discount_price`,
        [
          p.name, p.slug, p.description, p.short_description, p.price, p.discount_price,
          catId, p.stock_quantity, p.sku, p.is_featured, p.rating_avg, p.rating_count
        ]
      );
      const insertedProduct = prodRes.rows[0];
      productMap[p.slug] = insertedProduct;

      // Insert images
      await query(`DELETE FROM product_images WHERE product_id = $1`, [insertedProduct.id]);
      for (let idx = 0; idx < p.images.length; idx++) {
        const img = p.images[idx];
        await query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
           VALUES ($1, $2, $3, $4)`,
          [insertedProduct.id, img.url, img.is_primary, idx]
        );
      }
    }

    // 11. Insert Sample Reviews
    const auraProd = productMap['aura-pro-wireless-headphones'];
    const chronosProd = productMap['chronos-titanium-chronograph'];
    if (auraProd) {
      await query(
        `INSERT INTO reviews (product_id, user_id, rating, title, comment, status)
         VALUES ($1, $2, 5, 'Unbelievable Soundstage and Comfort', 'The sound profile is extraordinarily detailed. ANC cancels out airplane cabin rumble seamlessly. Battery lasted through an entire week of work!', 'approved')
         ON CONFLICT (product_id, user_id) DO NOTHING`,
        [auraProd.id, customer1Id]
      );
    }
    if (chronosProd) {
      await query(
        `INSERT INTO reviews (product_id, user_id, rating, title, comment, status)
         VALUES ($1, $2, 5, 'Exquisite Craftsmanship', 'The titanium case feels impossibly light yet indestructible. Mechanical rotor winds smoothly and keeps exact time. Well worth the price.', 'approved')
         ON CONFLICT (product_id, user_id) DO NOTHING`,
        [chronosProd.id, customer2Id]
      );
    }

    // 12. Insert Demo Orders & Payments
    // Check if orders already exist
    const ordersCountRes = await query('SELECT COUNT(*) FROM orders');
    if (parseInt(ordersCountRes.rows[0].count, 10) === 0 && auraProd && chronosProd) {
      const order1Number = 'ORD-2026-894102';
      const order1Subtotal = 299.99;
      const order1Shipping = 0.00;
      const order1Total = 299.99;

      const order1Res = await query(
        `INSERT INTO orders (
          order_number, user_id, status, subtotal, shipping_fee, discount_amount,
          total_amount, shipping_address, billing_address, customer_notes, tracking_number
        ) VALUES ($1, $2, 'processing', $3, $4, 0, $5, $6, $6, $7, $8)
        RETURNING id`,
        [
          order1Number, customer1Id, order1Subtotal, order1Shipping, order1Total,
          JSON.stringify({
            full_name: 'Elena Rostova',
            phone: '+1 (555) 234-5678',
            street_address: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'OR',
            postal_code: '97477',
            country: 'United States'
          }),
          'Please handle audio gear with care.',
          'TRK-FEDEX-90184'
        ]
      );
      const order1Id = order1Res.rows[0].id;

      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, 1, $4)`,
        [order1Id, auraProd.id, 'Aura Pro Wireless Noise-Cancelling Headphones', 299.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80']
      );

      await query(
        `INSERT INTO payments (
          order_id, payment_method, payment_status, amount, transaction_reference,
          sender_name, sender_account, bank_name, payment_notes, confirmed_by, confirmed_at
        ) VALUES ($1, 'bank_transfer', 'confirmed', $2, 'TRX-CHASE-77391', 'Elena Rostova', '**** 4482', 'JPMorgan Chase', 'Direct wire transfer verified.', $3, CURRENT_TIMESTAMP)`,
        [order1Id, order1Total, adminId]
      );

      // Order 2: Pending Payment Order for testing
      const order2Number = 'ORD-2026-912440';
      const order2Subtotal = 799.00;
      const order2Total = 799.00;

      const order2Res = await query(
        `INSERT INTO orders (
          order_number, user_id, status, subtotal, shipping_fee, discount_amount,
          total_amount, shipping_address, billing_address, customer_notes
        ) VALUES ($1, $2, 'pending', $3, 0.00, 0, $4, $5, $5, 'Order placed via bank transfer')
        RETURNING id`,
        [
          order2Number, customer2Id, order2Subtotal, order2Total,
          JSON.stringify({
            full_name: 'Marcus Thorne',
            phone: '+1 (555) 789-0123',
            street_address: '1204 Pine Street, Apt 5B',
            city: 'Seattle',
            state: 'WA',
            postal_code: '98101',
            country: 'United States'
          })
        ]
      );
      const order2Id = order2Res.rows[0].id;

      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, 1, $4)`,
        [order2Id, chronosProd.id, 'Chronos Titanium Mechanical Chronograph', 799.00, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80']
      );

      await query(
        `INSERT INTO payments (
          order_id, payment_method, payment_status, amount, transaction_reference,
          sender_name, sender_account, bank_name, payment_notes
        ) VALUES ($1, 'bank_transfer', 'pending', $2, 'TRX-WIRE-48190', 'Marcus Thorne', '**** 9012', 'Bank of America', 'Awaiting administrative verification')`,
        [order2Id, order2Total]
      );
    }

    console.log('✅ Database initialization and seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('👤 Admin account:    admin@ecommerce.com / Admin123!');
    console.log('👤 Customer account: customer@ecommerce.com / Customer123!');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};


