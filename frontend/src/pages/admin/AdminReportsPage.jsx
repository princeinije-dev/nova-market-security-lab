import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  Edit2,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    adminService.getReports()
      .then((res) => {
        if (res.success && res.data) {
          setReportData(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load reports.', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Generating business and inventory reports...</p>
      </div>
    );
  }

  const { topSellingProducts = [], inventorySummary = {}, lowStockItems = [] } = reportData || {};

  return (
    <div>
      {/* Inventory Valuation & Health Stat Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Inventory Valuation</span>
            <span className="stat-value">
              ${parseFloat(inventorySummary.total_inventory_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="stat-subtext">Cumulative stock asset value</span>
          </div>
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Tracked SKUs</span>
            <span className="stat-value">{inventorySummary.total_skus || 0}</span>
            <span className="stat-subtext">Distinct catalog items</span>
          </div>
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Low Stock Warnings</span>
            <span className="stat-value" style={{ color: 'var(--color-warning)' }}>
              {inventorySummary.low_stock_count || 0}
            </span>
            <span className="stat-subtext">&le; 10 units in stock</span>
          </div>
          <div className="stat-icon amber">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Out of Stock</span>
            <span className="stat-value" style={{ color: parseInt(inventorySummary.out_of_stock_count, 10) > 0 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
              {inventorySummary.out_of_stock_count || 0}
            </span>
            <span className="stat-subtext">Needs immediate restocking</span>
          </div>
          <div className="stat-icon red" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {/* Top Selling Products Report */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--color-accent)" /> Top Selling Products
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {topSellingProducts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No confirmed sales records available yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingProducts.map((p) => (
                      <tr key={p.product_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={p.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'}
                              alt=""
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                              {p.product_name}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {p.units_sold} units
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-success-text)' }}>
                          ${parseFloat(p.gross_revenue).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Stock Replenishment Warnings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--color-warning)" /> Inventory Replenishment Alert
            </h3>
            <span className="badge badge-warning">
              {lowStockItems.length} Products
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock Left</th>
                    <th style={{ textAlign: 'right' }}>Restock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        All products are sufficiently stocked.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {item.name}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {item.sku || 'N/A'}
                        </td>
                        <td>
                          <span
                            className={`badge ${item.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}
                            style={{ fontWeight: 700 }}
                          >
                            {item.stock_quantity} left
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/admin/products/edit/${item.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                          >
                            <Edit2 size={13} /> Restock
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
