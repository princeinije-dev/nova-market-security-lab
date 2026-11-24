import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck, Truck, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import { useToast } from '../context/ToastContext';

export const CartPage = () => {
  const {
    cartItems,
    subtotal,
    shippingFee,
    discountAmount,
    grandTotal,
    appliedCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { showToast } = useToast();
  const navigate = useNavigate();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    try {
      setValidatingCoupon(true);
      const res = await productService.validateCoupon(couponCodeInput.trim(), subtotal);
      if (res.success && res.data) {
        applyCoupon(res.data);
        setCouponCodeInput('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid coupon code.', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShoppingBag size={32} />
          </div>
          <h2 className="empty-state-title">Your shopping bag is empty</h2>
          <p className="empty-state-desc">
            Explore our curated selection of acoustic masterworks, precision watches, and workstations.
          </p>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">Shopping Bag</h1>
        <p className="section-subtitle">
          Review your selected items before proceeding to secure bank transfer checkout.
        </p>
      </div>

      <div className="cart-layout">
        {/* Items Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Line Total</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => {
                  const pId = item.product_id || item.productId;
                  const unitPrice = parseFloat(item.unit_price || item.discount_price || item.price);
                  const lineTotal = parseFloat((unitPrice * item.quantity).toFixed(2));
                  const stockMax = item.stock_quantity;

                  return (
                    <tr key={item.id || pId}>
                      <td>
                        <div className="cart-item-product">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80'}
                            alt={item.name}
                            className="cart-item-img"
                          />
                          <div>
                            <Link
                              to={`/products/${item.slug || pId}`}
                              style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}
                            >
                              {item.name}
                            </Link>
                            {stockMax !== undefined && (
                              <p style={{ fontSize: '0.75rem', color: item.quantity >= stockMax ? 'var(--color-warning)' : 'var(--color-text-light)' }}>
                                Available in stock: {stockMax}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ fontWeight: 600 }}>
                        ${unitPrice.toFixed(2)}
                      </td>

                      <td>
                        <div className="qty-control" style={{ transform: 'scale(0.9)', transformOrigin: 'left center' }}>
                          <button
                            className="qty-btn"
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(pId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <input
                            type="text"
                            className="qty-input"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            className="qty-btn"
                            disabled={stockMax !== undefined && item.quantity >= stockMax}
                            onClick={() => updateQuantity(pId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                        ${lineTotal.toFixed(2)}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '0.4rem' }}
                          title="Remove item"
                          onClick={() => removeItem(pId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', backgroundColor: '#fafbfc' }}>
            <Link to="/shop" className="btn btn-outline btn-sm">
              &larr; Continue Shopping
            </Link>
            <button
              onClick={clearCart}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--color-danger)' }}
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="cart-summary-box">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
            Order Summary
          </h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Estimated Shipping</span>
            <span>
              {shippingFee === 0 ? (
                <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>FREE</span>
              ) : (
                `$${shippingFee.toFixed(2)}`
              )}
            </span>
          </div>

          {appliedCoupon && (
            <div className="summary-row" style={{ color: 'var(--color-success)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Tag size={14} /> Coupon ({appliedCoupon.code})
                <X
                  size={14}
                  style={{ cursor: 'pointer', marginLeft: '4px' }}
                  onClick={removeCoupon}
                  title="Remove coupon"
                />
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Coupon Input Form */}
          {!appliedCoupon ? (
            <form onSubmit={handleApplyCoupon} className="coupon-box">
              <input
                type="text"
                placeholder="Discount code (e.g. WELCOME10)"
                className="form-input"
                style={{ fontSize: '0.875rem', textTransform: 'uppercase' }}
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={validatingCoupon}
              >
                {validatingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </form>
          ) : (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '0.75rem', margin: '1rem 0', fontSize: '0.8125rem', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Code <strong>{appliedCoupon.code}</strong> applied!</span>
              <button
                onClick={removeCoupon}
                style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }}
              >
                Remove
              </button>
            </div>
          )}

          <div className="summary-row total">
            <span>Estimated Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '1.5rem' }}
          >
            Proceed to Checkout
            <ArrowRight size={18} />
          </button>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={14} color="var(--color-accent)" />
              <span>Complimentary insured shipping on orders $150+</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={14} color="var(--color-accent)" />
              <span>Direct Bank Transfer with instant verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
