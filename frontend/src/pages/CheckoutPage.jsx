import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';

export const CheckoutPage = () => {
  const { cartItems, subtotal, shippingFee, discountAmount, grandTotal, appliedCoupon, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [storeBank, setStoreBank] = useState(null);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState(null);

  // Shipping Form State
  const [shippingAddress, setShippingAddress] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  });

  // Billing address state
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  });

  const [customerNotes, setCustomerNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch store settings for bank details preview
  useEffect(() => {
    productService.getPublicSettings()
      .then((res) => {
        if (res.success && res.data) {
          setStoreBank(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Set default address if user has saved addresses
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find((a) => a.is_default) || user.addresses[0];
      setSelectedSavedAddress(defaultAddr.id);
      setShippingAddress({
        full_name: defaultAddr.full_name,
        email: user.email || '',
        phone: defaultAddr.phone,
        street_address: defaultAddr.street_address,
        city: defaultAddr.city,
        state: defaultAddr.state,
        postal_code: defaultAddr.postal_code,
        country: defaultAddr.country || 'United States',
      });
    } else if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        full_name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="empty-state">
          <h2 className="empty-state-title">Your shopping bag is empty</h2>
          <p className="empty-state-desc">Please add items to your cart before proceeding to checkout.</p>
          <Link to="/shop" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const handleSelectSavedAddress = (addr) => {
    setSelectedSavedAddress(addr.id);
    setShippingAddress({
      full_name: addr.full_name,
      email: user?.email || '',
      phone: addr.phone,
      street_address: addr.street_address,
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country || 'United States',
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      !shippingAddress.full_name ||
      !shippingAddress.street_address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postal_code ||
      !shippingAddress.phone
    ) {
      setErrorMsg('Please complete all shipping address fields.');
      showToast('Please complete all shipping address fields.', 'warning');
      return;
    }

    try {
      setSubmittingOrder(true);

      const payload = {
        items: cartItems.map((item) => ({
          productId: item.product_id || item.productId,
          quantity: item.quantity,
          name: item.name,
        })),
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        couponCode: appliedCoupon?.code || null,
        customerNotes: customerNotes.trim() || null,
      };

      const res = await orderService.checkout(payload);

      if (res.success && res.data) {
        showToast('Order created successfully!', 'success');
        clearCart();
        navigate(`/order-confirmation/${res.data.order.order_number}`, {
          state: { orderData: res.data },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please check item availability.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">Direct Wire Checkout</h1>
        <p className="section-subtitle">
          Complete your delivery details to place your order. You will receive transfer instructions and reference codes upon submission.
        </p>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '2rem', color: 'var(--color-danger-text)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="cart-layout">
          {/* Left Form: Shipping, Billing, Payment Method */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 1. Shipping Address Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">1. Shipping Information</h3>
              </div>
              <div className="card-body">
                {/* Saved addresses selector for logged-in user */}
                {user?.addresses && user.addresses.length > 0 && (
                  <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      Choose from your saved addresses:
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {user.addresses.map((addr) => (
                        <button
                          type="button"
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`btn btn-sm ${selectedSavedAddress === addr.id ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {addr.full_name} ({addr.city})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Recipient Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Elena Rostova"
                      value={shippingAddress.full_name}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 234-5678"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Street Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="742 Evergreen Terrace, Apt 4B"
                    value={shippingAddress.street_address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street_address: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Springfield"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State / Province *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="OR"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Postal / Zip Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="97477"
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Billing Address Options */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">2. Billing Address</h3>
              </div>
              <div className="card-body">
                <label className="form-check" style={{ marginBottom: sameAsShipping ? 0 : '1.25rem' }}>
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600 }}>Billing address matches shipping address</span>
                </label>

                {!sameAsShipping && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Billing Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={billingAddress.full_name}
                          onChange={(e) => setBillingAddress({ ...billingAddress, full_name: e.target.value })}
                          required={!sameAsShipping}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Billing Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          value={billingAddress.phone}
                          onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                          required={!sameAsShipping}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Billing Street Address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={billingAddress.street_address}
                        onChange={(e) => setBillingAddress({ ...billingAddress, street_address: e.target.value })}
                        required={!sameAsShipping}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Payment Method: Official Bank Transfer */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">3. Payment Protocol</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-accent-subtle)' }}>
                  <Building size={24} color="var(--color-accent)" style={{ marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Direct Commercial Bank Wire / ACH Transfer
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Transfer the order sum directly to our commercial account. Once submitted, your order status updates automatically upon administrator receipt confirmation.
                    </p>
                  </div>
                </div>

                {storeBank && (
                  <div className="bank-transfer-card" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
                      Bank Account Details for Wire:
                    </h4>
                    <div className="bank-detail-grid">
                      <div className="bank-detail-item">
                        <span className="bank-detail-label">Beneficiary Bank</span>
                        <span className="bank-detail-val" style={{ fontSize: '0.9375rem' }}>{storeBank.bank_name}</span>
                      </div>
                      <div className="bank-detail-item">
                        <span className="bank-detail-label">Account Name</span>
                        <span className="bank-detail-val" style={{ fontSize: '0.9375rem' }}>{storeBank.bank_account_name}</span>
                      </div>
                      <div className="bank-detail-item">
                        <span className="bank-detail-label">Account Number</span>
                        <span className="bank-detail-val">{storeBank.bank_account_number}</span>
                      </div>
                      <div className="bank-detail-item">
                        <span className="bank-detail-label">Routing / ABA</span>
                        <span className="bank-detail-val">{storeBank.bank_routing_code}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                  <label className="form-label">Order Notes / Instructions (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Special delivery notes, gate codes, etc."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Pane */}
          <div className="cart-summary-box">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
              Order Review ({cartItems.length} items)
            </h3>

            {/* Items mini list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.5rem' }}>
              {cartItems.map((item) => (
                <div key={item.id || item.product_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                    alt=""
                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Qty: {item.quantity} × ${parseFloat(item.unit_price || item.price).toFixed(2)}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                    ${(parseFloat(item.unit_price || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Insured Shipping</span>
              <span>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
            </div>

            {appliedCoupon && (
              <div className="summary-row" style={{ color: 'var(--color-success)' }}>
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total">
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={submittingOrder}
              style={{ marginTop: '1.5rem' }}
            >
              {submittingOrder ? 'Processing Order...' : `Place Order • $${grandTotal.toFixed(2)}`}
              {!submittingOrder && <ArrowRight size={18} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              <Lock size={12} />
              <span>Direct Bank Payment • 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
