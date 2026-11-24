import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_spend: 0,
    max_discount: '',
    usage_limit: 100,
    expires_at: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCoupons();
      if (res.success) {
        setCoupons(res.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load coupons.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_spend: 0,
      max_discount: '',
      usage_limit: 100,
      expires_at: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_spend: c.min_spend || 0,
      max_discount: c.max_discount || '',
      usage_limit: c.usage_limit || 100,
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
      is_active: c.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.discount_value) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        min_spend: parseFloat(formData.min_spend || 0),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: parseInt(formData.usage_limit || 100, 10),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      if (editingCoupon) {
        const res = await adminService.updateCoupon(editingCoupon.id, payload);
        if (res.success) {
          showToast('Coupon updated.', 'success');
          setModalOpen(false);
          fetchCoupons();
        }
      } else {
        const res = await adminService.createCoupon(payload);
        if (res.success) {
          showToast('Coupon created.', 'success');
          setModalOpen(false);
          fetchCoupons();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save coupon.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const res = await adminService.deleteCoupon(id);
      if (res.success) {
        showToast('Coupon deleted.', 'success');
        fetchCoupons();
      }
    } catch (err) {
      showToast('Failed to delete coupon.', 'error');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <h3 className="card-title" style={{ margin: 0 }}>Discount Coupons ({coupons.length})</h3>
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Coupon
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Spend</th>
                <th>Max Cap</th>
                <th>Redemptions</th>
                <th>Expires</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading coupons...</p>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Tag size={36} color="var(--color-text-light)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ fontWeight: 700 }}>No coupons created</h4>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-accent)', fontSize: '0.9375rem' }}>
                      {c.code}
                    </td>

                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {c.discount_type === 'percentage'
                          ? `${parseFloat(c.discount_value)}% OFF`
                          : `$${parseFloat(c.discount_value).toFixed(2)} OFF`}
                      </span>
                    </td>

                    <td>
                      ${parseFloat(c.min_spend || 0).toFixed(2)}
                    </td>

                    <td>
                      {c.max_discount ? `$${parseFloat(c.max_discount).toFixed(2)}` : 'No Cap'}
                    </td>

                    <td>
                      <span style={{ fontWeight: 700 }}>{c.usage_count}</span> / {c.usage_limit || '∞'}
                    </td>

                    <td style={{ fontSize: '0.8125rem' }}>
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                    </td>

                    <td>
                      <span className={`badge ${c.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(c)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem', color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Discount Coupon'}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Coupon Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SUMMER25"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Discount Type</label>
                    <select
                      className="form-select"
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Dollar ($)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder={formData.discount_type === 'percentage' ? 'e.g. 15 for 15%' : 'e.g. 25.00'}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Minimum Spend ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.min_spend}
                      onChange={(e) => setFormData({ ...formData, min_spend: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Maximum Discount Cap ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="Optional cap"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Uses Limit</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>

                <label className="form-check" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active Coupon</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
