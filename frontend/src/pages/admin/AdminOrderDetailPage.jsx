import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Truck,
  Building,
  Save,
  FileText,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status and Tracking Controls
  const [selectedStatus, setSelectedStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Payment confirmation action states
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState(false);
  const [refundingPayment, setRefundingPayment] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
        setSelectedStatus(res.data.status);
        setTrackingNumber(res.data.tracking_number || '');
        setAdminNotes(res.data.admin_notes || '');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load order details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleConfirmPayment = async () => {
    if (!window.confirm('Confirm receipt of bank transfer for this order? Order status will automatically update to Processing.')) {
      return;
    }

    try {
      setConfirmingPayment(true);
      const res = await adminService.confirmPayment(order.id);
      if (res.success) {
        showToast('Payment confirmed! Order status updated to Processing.', 'success');
        fetchOrderDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm payment.', 'error');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleRejectPayment = async () => {
    const reason = window.prompt('Enter reason for payment verification rejection:', 'Invalid wire reference or non-receipt of funds');
    if (!reason) return;

    try {
      setRejectingPayment(true);
      const res = await adminService.rejectPayment(order.id, reason);
      if (res.success) {
        showToast('Payment rejected.', 'info');
        fetchOrderDetails();
      }
    } catch (err) {
      showToast('Failed to reject payment.', 'error');
    } finally {
      setRejectingPayment(false);
    }
  };

  const handleRefundPayment = async () => {
    if (!window.confirm('Process refund for this payment? This will mark the order as cancelled and RESTORE product stock in the database.')) {
      return;
    }

    try {
      setRefundingPayment(true);
      const res = await adminService.refundPayment(order.id, 'Wire refund authorized by admin');
      if (res.success) {
        showToast('Payment marked as refunded, order cancelled, and inventory restored.', 'success');
        fetchOrderDetails();
      }
    } catch (err) {
      showToast('Failed to process refund.', 'error');
    } finally {
      setRefundingPayment(false);
    }
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    try {
      setSavingStatus(true);
      const res = await adminService.updateOrderStatus(order.id, {
        status: selectedStatus,
        tracking_number: trackingNumber.trim() || null,
        admin_notes: adminNotes.trim() || null,
      });

      if (res.success) {
        showToast('Order status and dispatch details saved.', 'success');
        fetchOrderDetails();
      }
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Retrieving order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <Link to="/admin/orders" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
          &larr; Back to Orders
        </Link>
        <p>Order record not found.</p>
      </div>
    );
  }

  const shippingAddr = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address || {};

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
              Order <span style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>{order.order_number}</span>
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Placed: {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/orders/${order.order_number}/invoice`} target="_blank" className="btn btn-outline btn-sm">
            <FileText size={16} /> Commercial Invoice
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Payment Verification Card & Order Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Bank Payment Verification Box */}
          <div className="card" style={{ border: order.payment_status === 'pending' ? '2px solid var(--color-warning)' : undefined }}>
            <div className="card-header" style={{ backgroundColor: order.payment_status === 'pending' ? 'var(--color-warning-bg)' : '#fafbfc' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} /> Bank Wire Payment Verification
              </h3>
              <span className={`badge ${order.payment_status === 'confirmed' ? 'badge-success' : order.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                {order.payment_status || 'Pending'}
              </span>
            </div>

            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Wire Reference</span>
                  <p style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.125rem', color: 'var(--color-accent)' }}>
                    {order.transaction_reference || 'Not submitted yet'}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Required Amount</span>
                  <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Sender Account / Name</span>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                    {order.sender_name || 'N/A'} {order.sender_account ? `(${order.sender_account})` : ''}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Originating Bank</span>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                    {order.bank_name || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Uploaded receipt proof */}
              {order.proof_image_url && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                    Customer Wire Proof Receipt:
                  </span>
                  <a href={order.proof_image_url} target="_blank" rel="noreferrer">
                    <img
                      src={order.proof_image_url}
                      alt="Transfer Receipt Proof"
                      style={{ maxHeight: '180px', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
                    />
                  </a>
                </div>
              )}

              {/* Confirmation Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                {order.payment_status !== 'confirmed' ? (
                  <>
                    <button
                      className="btn btn-success"
                      disabled={confirmingPayment}
                      onClick={handleConfirmPayment}
                    >
                      <CheckCircle2 size={16} />
                      {confirmingPayment ? 'Confirming...' : 'Confirm Payment (Approve)'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ color: 'var(--color-danger)' }}
                      disabled={rejectingPayment}
                      onClick={handleRejectPayment}
                    >
                      <XCircle size={16} /> Reject Payment
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={16} /> Payment verified & confirmed
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--color-danger)', borderColor: '#fca5a5' }}
                      disabled={refundingPayment}
                      onClick={handleRefundPayment}
                    >
                      <RotateCcw size={14} /> Process Wire Refund
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Items Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Order Items ({order.items?.length || 0})</h3>
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
                              style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product_name}</span>
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

              <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#fafbfc', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <span>Subtotal</span>
                  <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <span>Shipping Fee</span>
                  <span>${parseFloat(order.shipping_fee).toFixed(2)}</span>
                </div>
                {parseFloat(order.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-success)' }}>
                    <span>Discount ({order.coupon_code || 'Promo'})</span>
                    <span>-${parseFloat(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                  <span>Grand Total</span>
                  <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Status Controls & Customer Shipping Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status & Dispatch Update Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Fulfillment & Status Controls</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveStatus}>
                <div className="form-group">
                  <label className="form-label">Order Fulfillment Status</label>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="pending">Pending (Awaiting Verification)</option>
                    <option value="processing">Processing (Funds Confirmed / Packing)</option>
                    <option value="shipped">Shipped (En Route)</option>
                    <option value="delivered">Delivered (Completed)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Carrier Tracking Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TRK-FEDEX-90184"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                  <span className="form-helper">Visible immediately on the customer tracking timeline.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Administrative Notes</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Internal packaging notes, wire confirmation log..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={savingStatus}
                >
                  <Save size={16} />
                  {savingStatus ? 'Saving Status...' : 'Save Order Dispatch Updates'}
                </button>
              </form>
            </div>
          </div>

          {/* Customer & Shipping Destination Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Customer Destination</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Customer Name</span>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                  {order.customer_name || shippingAddr.full_name || 'Guest Customer'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {order.customer_email || 'No email provided'}
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Shipping Address</span>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: 1.5, marginTop: '0.25rem' }}>
                  {shippingAddr.street_address}<br />
                  {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}<br />
                  {shippingAddr.country}<br />
                  Phone: {shippingAddr.phone}
                </p>
              </div>

              {order.customer_notes && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8125rem', color: '#92400e' }}>
                  <strong>Customer Delivery Note:</strong> {order.customer_notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
