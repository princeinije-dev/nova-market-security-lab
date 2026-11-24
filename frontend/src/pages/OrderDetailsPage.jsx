import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Building,
  FileText,
  AlertTriangle,
  ChevronLeft,
  XCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const OrderDetailsPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Update wire reference state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newWireRef, setNewWireRef] = useState('');
  const [newSenderName, setNewSenderName] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
        if (res.data.transaction_reference) {
          setNewWireRef(res.data.transaction_reference);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Could not load order details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const res = await orderService.cancelOrder(order.id, cancelReason);
      if (res.success) {
        showToast('Order cancelled and inventory restored.', 'success');
        setCancelModalOpen(false);
        fetchOrder();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!newWireRef.trim()) {
      showToast('Please provide a wire transaction reference.', 'warning');
      return;
    }

    try {
      setUpdatingPayment(true);
      const res = await orderService.submitPayment(order.id, {
        transactionReference: newWireRef.trim(),
        senderName: newSenderName.trim() || null,
      });

      if (res.success) {
        showToast('Payment details updated. Awaiting admin review.', 'success');
        setShowPaymentForm(false);
        fetchOrder();
      }
    } catch (err) {
      showToast('Could not update payment details.', 'error');
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="empty-state">
          <h2 className="empty-state-title">Order Not Found</h2>
          <p className="empty-state-desc">The requested order cannot be located or is restricted.</p>
          <Link to="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Timeline Progress Calculation
  const isCancelled = order.status === 'cancelled';
  const isPaid = order.payment_status === 'confirmed';
  const steps = [
    { key: 'placed', label: 'Order Placed', completed: true },
    { key: 'payment', label: 'Payment Confirmed', completed: isPaid },
    { key: 'processing', label: 'Processing & Prep', completed: ['processing', 'shipped', 'delivered'].includes(order.status) },
    { key: 'shipped', label: 'Shipped with Tracking', completed: ['shipped', 'delivered'].includes(order.status) },
    { key: 'delivered', label: 'Delivered', completed: order.status === 'delivered' },
  ];

  const shippingAddr = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address || {};

  const canCancel = (order.status === 'pending' || order.status === 'processing') && !isCancelled;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            <ChevronLeft size={16} /> Back to My Orders
          </Link>
          <h1 className="section-title" style={{ fontSize: '1.75rem', margin: 0 }}>
            Order <span style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>{order.order_number}</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Placed on {new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/orders/${order.order_number}/invoice`} target="_blank" className="btn btn-outline btn-sm">
            <FileText size={16} /> Printable Invoice
          </Link>
          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--color-danger)', borderColor: '#fca5a5' }}
            >
              <XCircle size={16} /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={24} color="var(--color-danger)" />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>Order Has Been Cancelled</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-danger-text)' }}>
              Reason: {order.cancel_reason || 'Cancelled upon request'}. Inventory stock has been restored.
            </p>
          </div>
        </div>
      )}

      {/* Visual Tracking Timeline */}
      {!isCancelled && (
        <div className="card" style={{ marginBottom: '2.5rem' }}>
          <div className="card-body">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem' }}>
              Fulfillment & Payment Timeline
            </h3>

            <div className="order-timeline">
              {steps.map((step, idx) => (
                <div
                  key={step.key}
                  className={`timeline-step ${step.completed ? 'completed' : ''}`}
                >
                  <div className="timeline-circle">
                    {step.completed ? <CheckCircle2 size={20} /> : idx + 1}
                  </div>
                  <span className="timeline-label">{step.label}</span>
                </div>
              ))}
            </div>

            {order.tracking_number && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Truck size={20} color="#0284c7" />
                <span style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                  Carrier Tracking Code: <strong>{order.tracking_number}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Ordered Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Ordered Items ({order.items?.length || 0})</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={item.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                              alt=""
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                {item.product_name}
                              </p>
                              {item.product_slug && (
                                <Link to={`/products/${item.product_slug}`} style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                                  View Item &rarr;
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>${parseFloat(item.product_price).toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ${parseFloat(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Price Breakdown */}
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: '#fafbfc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <span>Subtotal</span>
                  <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <span>Shipping Fee</span>
                  <span>{parseFloat(order.shipping_fee) === 0 ? 'FREE' : `$${parseFloat(order.shipping_fee).toFixed(2)}`}</span>
                </div>
                {parseFloat(order.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-success)' }}>
                    <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                    <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span>Total Amount</span>
                  <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Delivery Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Payment Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Payment Status</h3>
              <span className={`badge ${order.payment_status === 'confirmed' ? 'badge-success' : order.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                {order.payment_status || 'Pending'}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Method</span>
                  <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Direct Bank Wire Transfer</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Wire Reference</span>
                  <p style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-accent)' }}>
                    {order.transaction_reference || 'Not submitted yet'}
                  </p>
                </div>
                {order.sender_name && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Sender</span>
                    <p style={{ fontSize: '0.875rem' }}>{order.sender_name}</p>
                  </div>
                )}
                {order.confirmed_at && (
                  <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#065f46', fontSize: '0.8125rem' }}>
                    ✓ Confirmed by administrator on {new Date(order.confirmed_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Action to submit or edit reference if not confirmed */}
              {order.payment_status !== 'confirmed' && !isCancelled && (
                <div>
                  {!showPaymentForm ? (
                    <button
                      className="btn btn-secondary btn-sm btn-block"
                      onClick={() => setShowPaymentForm(true)}
                    >
                      <Send size={14} /> Update Wire Reference Code
                    </button>
                  ) : (
                    <form onSubmit={handleUpdatePayment} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8125rem' }}>Transaction / Wire Reference *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. TRX-CHASE-99201"
                          value={newWireRef}
                          onChange={(e) => setNewWireRef(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8125rem' }}>Sender Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Elena Rostova"
                          value={newSenderName}
                          onChange={(e) => setNewSenderName(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={updatingPayment}
                        >
                          {updatingPayment ? 'Saving...' : 'Submit'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowPaymentForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Delivery Address</h3>
            </div>
            <div className="card-body">
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                {shippingAddr.full_name}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                {shippingAddr.street_address}<br />
                {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}<br />
                {shippingAddr.country}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>
                Phone: {shippingAddr.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Cancel Order</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCancelModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>
                Are you sure you wish to cancel order <strong>{order.order_number}</strong>? Product stock will immediately be restored.
              </p>

              <div className="form-group">
                <label className="form-label">Reason for cancellation (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Need to modify order items or change delivery address"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setCancelModalOpen(false)}
              >
                Keep Order
              </button>
              <button
                className="btn btn-danger"
                disabled={cancelling}
                onClick={handleCancelOrder}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
