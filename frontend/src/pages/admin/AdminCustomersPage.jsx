import React, { useState, useEffect } from 'react';
import { Search, Users, CheckCircle, XCircle, ShoppingBag, ShieldAlert } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const { showToast } = useToast();

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      };
      const res = await adminService.getCustomers(params);
      if (res.success) {
        setCustomers(res.data || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load customer list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const handleToggleStatus = async (customer) => {
    try {
      const res = await adminService.toggleCustomerStatus(customer.id);
      if (res.success) {
        showToast(res.message, 'success');
        fetchCustomers(pagination.page);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle customer status.', 'error');
    }
  };

  return (
    <div>
      <div className="table-card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '380px' }}>
            <input
              type="text"
              placeholder="Search customer name, email, phone..."
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={16} />
            </button>
          </form>

          <div className="table-filters">
            <select
              className="form-select"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Registered Date</th>
                <th>Orders Placed</th>
                <th>Total Confirmed Spend</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Users size={36} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ fontWeight: 700 }}>No customers found</h4>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                            {c.name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>{c.phone || '—'}</td>

                    <td style={{ fontSize: '0.8125rem' }}>
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td>
                      <span style={{ fontWeight: 600 }}>{c.order_count || 0}</span> orders
                    </td>

                    <td style={{ fontWeight: 800 }}>
                      ${parseFloat(c.total_spent || 0).toFixed(2)}
                    </td>

                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`btn btn-sm ${c.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ color: c.status === 'active' ? 'var(--color-danger)' : undefined }}
                      >
                        {c.status === 'active' ? 'Deactivate' : 'Activate Account'}
                      </button>
                    </td>
                  </tr>
                ))
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
                  onClick={() => fetchCustomers(p)}
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
