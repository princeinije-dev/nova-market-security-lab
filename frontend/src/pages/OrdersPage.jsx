import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ShoppingBag, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await orderService.getMyOrders({ page, limit: 10 });
      if (res.success) {
        setOrders(res.data || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch order history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="section-header">
        <h1 className="section-title">My Orders</h1>
        <p className="section-subtitle">
          Track fulfillment status, review items, inspect payment confirmations, and download invoices.
        </p>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner" />
          <p>Retrieving your order records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <h2 className="empty-state-title">No orders found</h2>
          <p className="empty-state-desc">You have not placed any orders yet. Explore our latest pieces.</p>
          <Link to="/shop" className="btn btn-primary">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => {
            let statusBadge = 'badge-secondary';
            if (order.status === 'delivered') statusBadge = 'badge-success';
            else if (order.status === 'processing') statusBadge = 'badge-info';
            else if (order.status === 'shipped') statusBadge = 'badge-gold';
            else if (order.status === 'cancelled') statusBadge = 'badge-danger';
            else if (order.status === 'pending') statusBadge = 'badge-warning';

            let paymentBadge = 'badge-warning';
            if (order.payment_status === 'confirmed') paymentBadge = 'badge-success';
            else if (order.payment_status === 'failed') paymentBadge = 'badge-danger';
            else if (order.payment_status === 'refunded') paymentBadge = 'badge-secondary';

            return (
              <div key={order.id} className="card">
                {/* Header Row */}
                <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem', backgroundColor: '#fafbfc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Order Number</span>
                      <p style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                        {order.order_number}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Date Placed</span>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total</span>
                      <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${statusBadge}`}>
                      Order: {order.status}
                    </span>
                    <span className={`badge ${paymentBadge}`}>
                      Payment: {order.payment_status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {order.items && order.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img
                            src={item.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                            alt={item.product_name}
                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                          />
                          <div>
                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                              {item.product_name}
                            </h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                              Qty: {item.quantity} × ${parseFloat(item.product_price).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          ${parseFloat(item.total_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>
                    Payment method: Bank Transfer • Reference: <strong>{order.transaction_reference || 'Pending'}</strong>
                  </span>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link to={`/orders/${order.order_number}/invoice`} target="_blank" className="btn btn-outline btn-sm">
                      <FileText size={14} /> Receipt
                    </Link>
                    <Link to={`/orders/${order.order_number}`} className="btn btn-primary btn-sm">
                      View Order & Timeline <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === pagination.page ? 'active' : ''}`}
                  onClick={() => fetchOrders(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
