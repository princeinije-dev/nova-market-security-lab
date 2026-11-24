import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const statusParam = searchParams.get('status') || '';
  const paymentParam = searchParams.get('paymentStatus') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status: statusParam || undefined,
        paymentStatus: paymentParam || undefined,
        search: searchTerm.trim() || undefined,
      };

      const res = await adminService.getOrders(params);
      if (res.success) {
        setOrders(res.data || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(pageParam);
  }, [statusParam, paymentParam, pageParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div>
      <div className="table-card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '380px' }}>
            <input
              type="text"
              placeholder="Search order #, customer, wire ref..."
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={16} />
            </button>
          </form>

          <div className="table-filters">
            <select
              className="form-select"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
              value={statusParam}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className="form-select"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
              value={paymentParam}
              onChange={(e) => updateFilter('paymentStatus', e.target.value)}
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Payment Pending</option>
              <option value="confirmed">Payment Confirmed</option>
              <option value="failed">Payment Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Wire Reference</th>
                <th>Items</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                    <ShoppingCart size={36} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ fontWeight: 700 }}>No orders found</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      Try selecting different filter options.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  let statusBadge = 'badge-secondary';
                  if (ord.status === 'delivered') statusBadge = 'badge-success';
                  else if (ord.status === 'processing') statusBadge = 'badge-info';
                  else if (ord.status === 'shipped') statusBadge = 'badge-gold';
                  else if (ord.status === 'cancelled') statusBadge = 'badge-danger';
                  else if (ord.status === 'pending') statusBadge = 'badge-warning';

                  let paymentBadge = 'badge-warning';
                  if (ord.payment_status === 'confirmed') paymentBadge = 'badge-success';
                  else if (ord.payment_status === 'failed') paymentBadge = 'badge-danger';
                  else if (ord.payment_status === 'refunded') paymentBadge = 'badge-secondary';

                  return (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        <Link to={`/admin/orders/${ord.id}`} style={{ color: 'var(--color-accent)' }}>
                          {ord.order_number}
                        </Link>
                      </td>

                      <td>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ord.customer_name || 'Guest Checkout'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{ord.customer_email || 'No email'}</p>
                      </td>

                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {new Date(ord.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>
                        {ord.transaction_reference || (
                          <span style={{ color: 'var(--color-warning)' }}>Awaiting</span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8125rem' }}>
                          {ord.items?.length || 0} items
                        </span>
                      </td>

                      <td style={{ fontWeight: 800 }}>
                        ${parseFloat(ord.total_amount).toFixed(2)}
                      </td>

                      <td>
                        <span className={`badge ${statusBadge}`}>
                          {ord.status}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${paymentBadge}`}>
                          {ord.payment_status || 'pending'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/admin/orders/${ord.id}`} className="btn btn-primary btn-sm">
                          Inspect & Manage &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <div className="pagination" style={{ margin: 0 }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === pagination.page ? 'active' : ''}`}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('page', String(p));
                    setSearchParams(next);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
