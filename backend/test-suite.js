// Comprehensive End-to-End API and Database Test Suite
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const client = axios.create({ baseURL: BASE_URL });

const assert = (condition, msg) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
};

const runTests = async () => {
  console.log('🧪 Starting Full-Stack E-Commerce Verification Test Suite...\n');

  try {
    // 1. Health check
    console.log('1. Health Check');
    const health = await client.get('/health');
    assert(health.data.status === 'healthy', 'API health status is healthy');

    // 2. Customer Registration
    console.log('\n2. Customer Registration');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await client.post('/auth/register', {
      name: 'Samantha Wright',
      email: testEmail,
      password: 'Password123!',
      phone: '+1 (555) 444-9988',
    });
    assert(regRes.data.success === true, 'Customer registered successfully');
    assert(regRes.data.token, 'Registration returns JWT token');
    const customerToken = regRes.data.token;
    const customerClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    // 3. Customer Login with Seeded Account
    console.log('\n3. Customer Login');
    const loginRes = await client.post('/auth/login', {
      email: 'customer@ecommerce.com',
      password: 'Customer123!',
    });
    assert(loginRes.data.success === true, 'Seeded customer login works');
    assert(loginRes.data.user.email === 'customer@ecommerce.com', 'Returns user record');

    // 4. Customer Profile & Addresses
    console.log('\n4. Customer Profile & Addresses');
    const meRes = await customerClient.get('/auth/me');
    assert(meRes.data.user.name === 'Samantha Wright', 'Profile fetch works');

    const addrRes = await customerClient.post('/auth/addresses', {
      address_type: 'shipping',
      full_name: 'Samantha Wright',
      phone: '+1 (555) 444-9988',
      street_address: '101 Ocean Boulevard, Penthouse 4',
      city: 'Miami',
      state: 'FL',
      postal_code: '33139',
      country: 'United States',
      is_default: true,
    });
    assert(addrRes.data.success === true, 'Address successfully created in DB');

    // 5. Admin Authentication
    console.log('\n5. Administrator Authentication');
    const adminLoginRes = await client.post('/auth/admin/login', {
      email: 'admin@ecommerce.com',
      password: 'Admin123!',
    });
    assert(adminLoginRes.data.success === true, 'Admin login succeeded');
    assert(adminLoginRes.data.user.role === 'admin', 'User has admin role');
    const adminToken = adminLoginRes.data.token;
    const adminClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // 6. Access Control Test: Ensure customer cannot access admin routes
    console.log('\n6. Access Control & Permission Boundary');
    try {
      await customerClient.get('/admin/dashboard');
      throw new Error('Customer should NOT have access to /admin/dashboard!');
    } catch (err) {
      assert(err.response?.status === 403, 'Customer correctly blocked from admin route (403 Forbidden)');
    }

    // 7. Admin Dashboard KPIs & Charts
    console.log('\n7. Admin Dashboard Metrics & SVG Chart');
    const dashRes = await adminClient.get('/admin/dashboard');
    assert(dashRes.data.success === true, 'Dashboard data returned');
    assert(dashRes.data.data.metrics.total_products > 0, 'Catalog products counted');
    assert(Array.isArray(dashRes.data.data.salesChart), '7-day sales chart data present');

    // 8. Categories List
    console.log('\n8. Categories & Public Store Data');
    const catRes = await client.get('/categories');
    assert(catRes.data.data.length >= 5, 'Found seeded product categories');

    // 9. Admin Product Creation
    console.log('\n9. Admin Product Creation');
    const newProdRes = await adminClient.post('/products', {
      name: 'Vortex Carbon Fiber ANC Earbuds',
      description: 'Ultra-low distortion planar magnetic drivers enclosed in woven carbon fiber.',
      short_description: 'Precision wireless planar magnetic audio.',
      price: 249.00,
      discount_price: 199.00,
      category_id: catRes.data.data[0].id,
      stock_quantity: 25,
      sku: `TST-${Date.now().toString(36).toUpperCase()}`,
      is_featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80', is_primary: true },
      ],
    });
    assert(newProdRes.data.success === true, 'Product created by admin');
    const createdProductId = newProdRes.data.data.id;
    const createdProductSlug = newProdRes.data.data.slug;

    // 10. Product Search & Filter
    console.log('\n10. Product Search and Filtering');
    const searchRes = await client.get('/products', { params: { search: 'Vortex' } });
    assert(searchRes.data.data.length > 0, 'Search by keyword finds product');

    // 11. Product Details
    console.log('\n11. Product Details Lookup');
    const prodDetailRes = await client.get(`/products/${createdProductSlug}`);
    assert(prodDetailRes.data.data.id === createdProductId, 'Product details fetched by slug');
    assert(prodDetailRes.data.data.images.length > 0, 'Product images included');

    // 12. Cart Functionality & Stock Enforcement
    console.log('\n12. Cart Functionality & Stock Validation');
    const addToCartRes = await customerClient.post('/cart/add', {
      productId: createdProductId,
      quantity: 2,
    });
    assert(addToCartRes.data.success === true, 'Item added to customer cart');

    // Test stock violation: product only has 25 stock, trying to add 30 more should fail
    try {
      await customerClient.post('/cart/add', {
        productId: createdProductId,
        quantity: 30,
      });
      throw new Error('Cart should NOT allow adding quantity exceeding stock!');
    } catch (err) {
      assert(err.response?.status === 400, 'Exceeding stock correctly rejected with 400 error');
    }

    const cartRes = await customerClient.get('/cart');
    assert(cartRes.data.data.items.length > 0, 'Cart items retrieved');
    assert(cartRes.data.data.subtotal > 0, 'Subtotal correctly computed');

    // 13. Coupon Validation
    console.log('\n13. Coupon Validation');
    const couponRes = await client.post('/coupons/validate', {
      code: 'WELCOME10',
      subtotal: cartRes.data.data.subtotal,
    });
    assert(couponRes.data.success === true, 'WELCOME10 coupon validated');
    assert(couponRes.data.data.discountAmount > 0, 'Coupon discount amount calculated');

    // 14. Checkout & Order Creation
    console.log('\n14. Direct Wire Checkout & Inventory Stock Deduction');
    const initialStock = prodDetailRes.data.data.stock_quantity; // 25
    const checkoutRes = await customerClient.post('/orders/checkout', {
      items: [{ productId: createdProductId, quantity: 2 }],
      shippingAddress: {
        full_name: 'Samantha Wright',
        phone: '+1 (555) 444-9988',
        street_address: '101 Ocean Boulevard, Penthouse 4',
        city: 'Miami',
        state: 'FL',
        postal_code: '33139',
        country: 'United States',
      },
      couponCode: 'WELCOME10',
      customerNotes: 'Please ring bell upon arrival',
    });
    assert(checkoutRes.data.success === true, 'Order created successfully');
    const orderData = checkoutRes.data.data.order;
    assert(orderData.order_number.startsWith('ORD-'), 'Unique order number generated');
    assert(orderData.status === 'pending', 'Initial order status is pending');

    // Verify stock was deducted in database: 25 - 2 = 23
    const checkStockRes = await client.get(`/products/${createdProductId}`);
    assert(checkStockRes.data.data.stock_quantity === initialStock - 2, `Stock deducted in DB: ${initialStock} -> ${initialStock - 2}`);

    // Verify user cart was cleared
    const checkCartRes = await customerClient.get('/cart');
    assert(checkCartRes.data.data.items.length === 0, 'Customer cart cleared after checkout');

    // 15. Customer Wire Reference Submission
    console.log('\n15. Payment Wire Reference Submission');
    const submitPayRes = await customerClient.post(`/payments/orders/${orderData.id}/submit`, {
      transactionReference: 'TRX-CHASE-WIRE-55921',
      senderName: 'Samantha Wright',
      bankName: 'JPMorgan Chase',
      paymentNotes: 'Wire initiated via mobile banking app',
    });
    assert(submitPayRes.data.success === true, 'Payment details submitted by customer');

    // 16. Admin Payment Confirmation
    console.log('\n16. Admin Payment Confirmation & Auto Order Status Update');
    const confirmPayRes = await adminClient.post(`/payments/orders/${orderData.id}/confirm`);
    assert(confirmPayRes.data.success === true, 'Admin confirmed payment receipt');
    assert(confirmPayRes.data.data.payment_status === 'confirmed', 'Payment status is confirmed');

    // Verify order status automatically changed to processing
    const verifyOrderRes = await adminClient.get(`/orders/${orderData.id}`);
    assert(verifyOrderRes.data.data.status === 'processing', 'Order status automatically updated to processing');

    // 17. Admin Dispatch & Tracking Update
    console.log('\n17. Admin Order Dispatch & Tracking Code Update');
    const updateDispatchRes = await adminClient.put(`/admin/orders/${orderData.id}/status`, {
      status: 'shipped',
      tracking_number: 'TRK-UPS-EXPRESS-77892',
      admin_notes: 'Packed in reinforced wooden crate',
    });
    assert(updateDispatchRes.data.data.status === 'shipped', 'Order status updated to shipped');
    assert(updateDispatchRes.data.data.tracking_number === 'TRK-UPS-EXPRESS-77892', 'Tracking code set');

    // 18. Invoice Data
    console.log('\n18. Commercial Invoice Data');
    const invoiceRes = await customerClient.get(`/orders/${orderData.order_number}/invoice`);
    assert(invoiceRes.data.success === true, 'Invoice retrieved');
    assert(invoiceRes.data.data.order.order_number === orderData.order_number, 'Invoice matches order');
    assert(invoiceRes.data.data.items.length > 0, 'Itemized billing present');

    // 19. Customer Review & Product Rating Recalculation
    console.log('\n19. Customer Review & Dynamic Rating Recalculation');
    const reviewRes = await customerClient.post('/reviews', {
      productId: createdProductId,
      rating: 5,
      title: 'Remarkable Clarity',
      comment: 'Planar drivers provide an unprecedented level of instrument separation. Exceeded all expectations!',
    });
    assert(reviewRes.data.success === true, 'Review posted');

    const ratedProdRes = await client.get(`/products/${createdProductId}`);
    assert(parseFloat(ratedProdRes.data.data.rating_avg) === 5.0, 'Product rating average dynamically updated in database');

    // 20. Customer Management
    console.log('\n20. Customer Directory Management');
    const customersRes = await adminClient.get('/admin/customers');
    assert(customersRes.data.data.length > 0, 'Customer directory retrieved');

    // 21. Order Cancellation & Stock Restoration Test
    console.log('\n21. Order Cancellation & Inventory Stock Restoration Test');
    // Place second test order to test cancellation & stock restore
    const stockBefore = ratedProdRes.data.data.stock_quantity;
    const testCancelOrder = await customerClient.post('/orders/checkout', {
      items: [{ productId: createdProductId, quantity: 1 }],
      shippingAddress: { full_name: 'Test', street_address: '123 Test St', city: 'Test', state: 'TS', postal_code: '12345', phone: '555-0100' },
    });
    const cancelOrderId = testCancelOrder.data.data.order.id;

    // Verify stock decreased by 1
    const stockDuring = (await client.get(`/products/${createdProductId}`)).data.data.stock_quantity;
    assert(stockDuring === stockBefore - 1, `Stock dropped by 1: ${stockBefore} -> ${stockDuring}`);

    // Cancel order
    const cancelActionRes = await customerClient.post(`/orders/${cancelOrderId}/cancel`, {
      reason: 'Testing cancellation flow',
    });
    assert(cancelActionRes.data.success === true, 'Order cancelled');

    // Verify stock restored
    const stockAfter = (await client.get(`/products/${createdProductId}`)).data.data.stock_quantity;
    assert(stockAfter === stockBefore, `Stock restored in database: ${stockDuring} -> ${stockAfter}`);

    // 22. Cleanup Test Product
    console.log('\n22. Product Deletion by Admin');
    const deleteRes = await adminClient.delete(`/products/${createdProductId}`);
    assert(deleteRes.data.success === true, 'Test product deleted cleanly');

    console.log('\n🎉 ALL 22 FULL-STACK E-COMMERCE END-TO-END TESTS PASSED PERFECTLY!\n');
  } catch (error) {
    console.error('\n❌ Test failure:', error.response?.data || error.message);
    process.exit(1);
  }
};

runTests();
