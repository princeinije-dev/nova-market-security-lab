import React, { useState, useEffect } from 'react';
import { User, Lock, MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';

export const ProfilePage = () => {
  const { user, updateUserProfile, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Address Management State
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    is_default: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      if (user.addresses) setAddresses(user.addresses);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name is required.', 'warning');
      return;
    }

    try {
      setUpdatingProfile(true);
      const res = await authService.updateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim() || null,
      });

      if (res.success) {
        showToast('Profile updated successfully.', 'success');
        updateUserProfile(res.user);
      }
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      showToast('Please fill all password fields.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.success) {
        showToast('Password changed successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      setSavingAddress(true);
      const res = await authService.addAddress(newAddress);
      if (res.success) {
        showToast('Delivery address saved.', 'success');
        setShowAddressModal(false);
        setNewAddress({
          full_name: user?.name || '',
          phone: user?.phone || '',
          street_address: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'United States',
          is_default: false,
        });
        await refreshUser();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save address.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await authService.deleteAddress(id);
      if (res.success) {
        showToast('Address removed.', 'info');
        await refreshUser();
      }
    } catch (err) {
      showToast('Failed to remove address.', 'error');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="section-header">
        <h1 className="section-title">Account Settings</h1>
        <p className="section-subtitle">Manage your profile, password, and registered delivery locations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem', alignItems: 'flex-start' }}>
        {/* Navigation Tabs */}
        <div className="card">
          <div className="card-body" style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                className={`user-dropdown-item ${activeTab === 'profile' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'profile' ? 'var(--color-accent-subtle)' : undefined, color: activeTab === 'profile' ? 'var(--color-accent)' : undefined, fontWeight: activeTab === 'profile' ? 700 : 500 }}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} /> Personal Profile
              </button>
              <button
                className={`user-dropdown-item ${activeTab === 'password' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'password' ? 'var(--color-accent-subtle)' : undefined, color: activeTab === 'password' ? 'var(--color-accent)' : undefined, fontWeight: activeTab === 'password' ? 700 : 500 }}
                onClick={() => setActiveTab('password')}
              >
                <Lock size={18} /> Change Password
              </button>
              <button
                className={`user-dropdown-item ${activeTab === 'addresses' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'addresses' ? 'var(--color-accent-subtle)' : undefined, color: activeTab === 'addresses' ? 'var(--color-accent)' : undefined, fontWeight: activeTab === 'addresses' ? 700 : 500 }}
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin size={18} /> Delivery Addresses
              </button>
            </div>
          </div>
        </div>

        {/* Content Pane */}
        <div>
          {/* 1. Personal Profile */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Personal Details</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address (Read-only)</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      disabled
                      style={{ backgroundColor: '#f1f5f9' }}
                    />
                    <span className="form-helper">Email address serves as your primary identity key.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 234-5678"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingProfile}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 2. Change Password */}
          {activeTab === 'password' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Security & Credentials</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (Min. 6 chars)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingPassword}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. Delivery Addresses */}
          {activeTab === 'addresses' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Saved Shipping Locations</h2>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddressModal(true)}
                >
                  <Plus size={16} /> Add Address
                </button>
              </div>
              <div className="card-body">
                {addresses && addresses.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          position: 'relative',
                          backgroundColor: addr.is_default ? '#f0fdf4' : '#ffffff',
                          borderColor: addr.is_default ? '#bbf7d0' : 'var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
                            {addr.full_name}
                          </span>
                          {addr.is_default && (
                            <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                              Default
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          {addr.street_address}<br />
                          {addr.city}, {addr.state} {addr.postal_code}<br />
                          {addr.country}
                        </p>

                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
                          Phone: {addr.phone}
                        </p>

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)', borderColor: '#fecaca' }}
                          onClick={() => handleDeleteAddress(addr.id)}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ margin: 0, border: 'none' }}>
                    <MapPin size={32} color="var(--color-text-light)" />
                    <h3 className="empty-state-title">No addresses saved</h3>
                    <p className="empty-state-desc">Add a shipping location for expedited checkout.</p>
                    <button className="btn btn-primary" onClick={() => setShowAddressModal(true)}>
                      <Plus size={16} /> Add Address
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Delivery Location</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddressModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAddress}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Recipient Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State / Province *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Postal Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    required
                  />
                </div>

                <label className="form-check" style={{ marginTop: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  />
                  <span>Make this my default shipping address</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddressModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAddress}
                >
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
