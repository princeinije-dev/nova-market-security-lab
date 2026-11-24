import React, { useState, useEffect } from 'react';
import { Save, Building, Store, Truck, Image, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AdminSettingsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    store_name: '',
    store_email: '',
    store_phone: '',
    store_address: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_routing_code: '',
    bank_swift_code: '',
    payment_instructions: '',
    standard_shipping_fee: 15.0,
    free_shipping_threshold: 150.0,
    currency: 'USD',
    currency_symbol: '$',
  });

  // Banners State
  const [banners, setBanners] = useState([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '/shop',
    button_text: 'Explore Collection',
    badge_text: 'New Season',
    display_order: 1,
    is_active: true,
  });
  const [savingBanner, setSavingBanner] = useState(false);

  const fetchSettingsAndBanners = async () => {
    try {
      setLoading(true);
      const [settingsRes, bannersRes] = await Promise.all([
        adminService.getSettings(),
        adminService.getBanners(),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (bannersRes.success && bannersRes.data) {
        setBanners(bannersRes.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load store settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndBanners();
  }, []);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await adminService.updateSettings(settings);
      if (res.success) {
        showToast('Store & Bank transfer settings saved successfully!', 'success');
        setSettings(res.data);
      }
    } catch (err) {
      showToast('Failed to update store settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '/shop',
      button_text: 'Explore Collection',
      badge_text: 'Featured',
      display_order: banners.length + 1,
      is_active: true,
    });
    setBannerModalOpen(true);
  };

  const openEditBanner = (b) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image_url: b.image_url,
      link_url: b.link_url || '/shop',
      button_text: b.button_text || 'Explore Collection',
      badge_text: b.badge_text || '',
      display_order: b.display_order || 1,
      is_active: b.is_active,
    });
    setBannerModalOpen(true);
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.image_url) return;

    try {
      setSavingBanner(true);
      if (editingBanner) {
        const res = await adminService.updateBanner(editingBanner.id, bannerForm);
        if (res.success) {
          showToast('Banner updated successfully.', 'success');
          setBannerModalOpen(false);
          fetchSettingsAndBanners();
        }
      } else {
        const res = await adminService.createBanner(bannerForm);
        if (res.success) {
          showToast('Banner created.', 'success');
          setBannerModalOpen(false);
          fetchSettingsAndBanners();
        }
      }
    } catch (err) {
      showToast('Failed to save banner.', 'error');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this homepage banner?')) return;
    try {
      const res = await adminService.deleteBanner(id);
      if (res.success) {
        showToast('Banner deleted.', 'info');
        fetchSettingsAndBanners();
      }
    } catch (err) {
      showToast('Failed to delete banner.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Loading store configurations...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <form onSubmit={handleSettingsSubmit}>
        {/* 1. Official Bank Wire Transfer Settings */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header" style={{ backgroundColor: '#f0fdf4' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
              <Building size={20} /> Bank Transfer Payment System Settings
            </h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              These official banking credentials are automatically shown to customers during checkout and on invoice receipts for direct bank transfer settlement.
            </p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Beneficiary Commercial Bank *</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.bank_name}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Beneficiary Account Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.bank_account_name}
                  onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Account Number *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  value={settings.bank_account_number}
                  onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ABA / Routing Transit Code *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  value={settings.bank_routing_code}
                  onChange={(e) => setSettings({ ...settings, bank_routing_code: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SWIFT / BIC Code</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  value={settings.bank_swift_code}
                  onChange={(e) => setSettings({ ...settings, bank_swift_code: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Customer Wire Transfer Instructions</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={settings.payment_instructions}
                onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 2. Store Profile & Shipping Fees */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={20} /> Store Identity & Logistics Configuration
            </h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Store Public Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Contact Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={settings.store_email}
                  onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Support Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.store_phone}
                  onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Registered Address</label>
              <input
                type="text"
                className="form-input"
                value={settings.store_address}
                onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
              />
            </div>

            <div className="form-row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Standard Shipping Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={settings.standard_shipping_fee}
                  onChange={(e) => setSettings({ ...settings, standard_shipping_fee: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Free Shipping Minimum Threshold ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={settings.free_shipping_threshold}
                  onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.currency_symbol}
                  onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={savingSettings}
              style={{ marginTop: '1rem' }}
            >
              <Save size={18} />
              {savingSettings ? 'Saving Settings...' : 'Save Settings & Bank Details'}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Homepage Banners Management */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image size={20} /> Homepage Hero Banners ({banners.length})
          </h3>
          <button onClick={openAddBanner} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Banner
          </button>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {banners.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={b.image_url}
                    alt=""
                    style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{b.title}</h4>
                      {b.badge_text && <span className="badge badge-gold">{b.badge_text}</span>}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{b.subtitle}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${b.is_active ? 'badge-success' : 'badge-secondary'}`}>
                    {b.is_active ? 'Live' : 'Hidden'}
                  </span>
                  <button
                    onClick={() => openEditBanner(b)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.4rem' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.4rem', color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner Modal */}
      {bannerModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingBanner ? 'Edit Homepage Banner' : 'Create Homepage Banner'}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setBannerModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleBannerSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Banner Headline *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subtitle / Description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Background Image URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Badge Text</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. New Season"
                      value={bannerForm.badge_text}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge_text: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Button Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bannerForm.button_text}
                      onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Link URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                    />
                  </div>
                </div>

                <label className="form-check" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={bannerForm.is_active}
                    onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                  />
                  <span>Active Banner (Shown on homepage)</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBannerModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingBanner}
                >
                  {savingBanner ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
