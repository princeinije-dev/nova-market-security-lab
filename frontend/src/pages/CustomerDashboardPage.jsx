import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  Heart,
  User,
  CreditCard,
  ArrowRight,
  ShoppingBag,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { useWishlist } from '../context/WishlistContext';

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getMyOrders({ limit: 4 });
        if (res.success) {
          setOrders(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardOrders();
  }, []);

  const totalSpent = orders
    .filter((o) => o.payment_status === 'confirmed')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Welcome Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div>
          <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
            Member Account
          </span>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0.25rem 0' }}>
            Welcome back, {user?.name || 'Customer'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem' }}>
            {user?.email} • Member since {new Date(user?.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/shop" className="btn btn-accent">
            <ShoppingBag size={16} /> Explore Catalog
          </Link>
          <Link to="/profile" className="btn btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            <User size={16} /> Profile
          </Link>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="admin-stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{orders.length}</span>
            <span className="stat-subtext">Lifetime purchases</span>
          </div>
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Pending Transfers</span>
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-subtext">Awaiting payment verification</span>
          </div>
          <div className="stat-icon amber">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Wishlist Items</span>
            <span className="stat-value">{wishlistCount}</span>
            <span className="stat-subtext">Saved pieces</span>
          </div>
          <div className="stat-icon purple">
            <Heart size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Verified Spend</span>
            <span className="stat-value">${totalSpent.toFixed(2)}</span>
            <span className="stat-subtext">Confirmed payments</span>
          </div>
          <div className="stat-icon green">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Orders</h2>
          <Link to="/orders" className="btn btn-outline btn-sm">
            View All Orders <ArrowRight size={14} />
          </Link>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loader-container">
              <div className="spinner" />
              <p>Loading recent activity...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state" style={{ border: 'none' }}>
              <div className="empty-state-icon">
                <ShoppingBag size={28} />
              </div>
              <h3 className="empty-state-title">No orders placed yet</h3>
              <p className="empty-state-desc">You have not placed any orders yet. Discover our signature products to get started.</p>
              <Link to="/shop" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    let statusBadgeClass = 'badge-secondary';
                    if (order.status === 'delivered') statusBadgeClass = 'badge-success';
                    else if (order.status === 'processing') statusBadgeClass = 'badge-info';
                    else if (order.status === 'shipped') statusBadgeClass = 'badge-gold';
                    else if (order.status === 'cancelled') statusBadgeClass = 'badge-danger';
                    else if (order.status === 'pending') statusBadgeClass = 'badge-warning';

                    let paymentBadgeClass = 'badge-warning';
                    if (order.payment_status === 'confirmed') paymentBadgeClass = 'badge-success';
                    else if (order.payment_status === 'failed') paymentBadgeClass = 'badge-danger';
                    else if (order.payment_status === 'refunded') paymentBadgeClass = 'badge-secondary';

                    return (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                          <Link to={`/orders/${order.order_number}`} style={{ color: 'var(--color-accent)' }}>
                            {order.order_number}
                          </Link>
                        </td>
                        <td>
                          {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeClass}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${paymentBadgeClass}`}>
                            {order.payment_status || 'pending'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/orders/${order.order_number}`} className="btn btn-secondary btn-sm">
                            Details <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
