import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Loading administrative dashboard...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];
  const salesChart = data?.salesChart || [];

  // Calculate highest revenue day for relative chart scaling
  const maxRevenue = Math.max(...salesChart.map((c) => parseFloat(c.daily_revenue || 0)), 500);

  return (
    <div>
      {/* Quick Action Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            Operations & Payment Control Center
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {parseInt(metrics.pending_orders || 0, 10)} pending wire transfers awaiting confirmation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/orders?status=pending" className="btn btn-primary btn-sm">
            <Clock size={16} /> Review Pending Orders
          </Link>
          <Link to="/admin/products/new" className="btn btn-outline btn-sm">
            <PlusCircle size={16} /> Add Product
          </Link>
          <Link to="/admin/settings" className="btn btn-secondary btn-sm">
            <Building size={16} /> Bank Info
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">
              ${parseFloat(metrics.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="stat-subtext">Confirmed bank payments</span>
          </div>
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{metrics.total_orders || 0}</span>
            <span className="stat-subtext">{metrics.completed_orders || 0} delivered</span>
          </div>
          <div className="stat-icon blue">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Pending Verification</span>
            <span className="stat-value" style={{ color: 'var(--color-warning)' }}>
              {metrics.pending_orders || 0}
            </span>
            <span className="stat-subtext">Action required</span>
          </div>
          <div className="stat-icon amber">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Registered Customers</span>
            <span className="stat-value">{metrics.total_customers || 0}</span>
            <span className="stat-subtext">Verified accounts</span>
          </div>
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Catalog SKUs</span>
            <span className="stat-value">{metrics.total_products || 0}</span>
            <span className="stat-subtext">Active items</span>
          </div>
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value" style={{ color: parseInt(metrics.low_stock_products, 10) > 0 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
              {metrics.low_stock_products || 0}
            </span>
            <span className="stat-subtext">&le; 5 units remaining</span>
          </div>
          <div className="stat-icon amber">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              Revenue Performance (Past 7 Days)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Daily confirmed settlement totals via bank wire and ACH.
            </p>
          </div>
          <span className="badge badge-success">
            <TrendingUp size={14} /> Live Sync
          </span>
        </div>

        <div className="chart-bars-wrap">
          {salesChart.map((col, idx) => {
            const revenueVal = parseFloat(col.daily_revenue || 0);
            const heightPercent = Math.max(4, Math.round((revenueVal / maxRevenue) * 100));

            return (
              <div key={idx} className="chart-bar-col">
                <div
                  className="chart-bar"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="chart-bar-tooltip">
                    ${revenueVal.toFixed(2)} ({col.order_count} orders)
                  </div>
                </div>
                <span className="chart-bar-label">{col.date_label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="table-card">
        <div className="card-header">
          <h3 className="card-title">Recent Customer Orders</h3>
          <Link to="/admin/orders" className="btn btn-outline btn-sm">
            View All Orders &rarr;
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => {
                  let orderBadge = 'badge-secondary';
                  if (ord.status === 'delivered') orderBadge = 'badge-success';
                  else if (ord.status === 'processing') orderBadge = 'badge-info';
                  else if (ord.status === 'shipped') orderBadge = 'badge-gold';
                  else if (ord.status === 'cancelled') orderBadge = 'badge-danger';
                  else if (ord.status === 'pending') orderBadge = 'badge-warning';

                  let paymentBadge = 'badge-warning';
                  if (ord.payment_status === 'confirmed') paymentBadge = 'badge-success';
                  else if (ord.payment_status === 'failed') paymentBadge = 'badge-danger';

                  return (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        <Link to={`/admin/orders/${ord.id}`} style={{ color: 'var(--color-accent)' }}>
                          {ord.order_number}
                        </Link>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ord.customer_name || 'Guest'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{ord.customer_email}</p>
                      </td>
                      <td>
                        {new Date(ord.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        ${parseFloat(ord.total_amount).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${orderBadge}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${paymentBadge}`}>
                          {ord.payment_status || 'pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/admin/orders/${ord.id}`} className="btn btn-secondary btn-sm">
                          Review & Confirm
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
