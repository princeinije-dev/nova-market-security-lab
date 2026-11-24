import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const tokenParam = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Reset token is required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword(token, newPassword);
      if (res.success) {
        showToast('Password updated successfully! Please sign in with your new password.', 'success');
        navigate('/login');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired token.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        <div className="card" style={{ boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
            <div className="benefit-icon" style={{ width: '56px', height: '56px', marginBottom: '1rem' }}>
              <Lock size={28} />
            </div>
            <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Set New Password</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Create a strong password for your NovaMarket account.
            </p>
          </div>

          <div className="card-body" style={{ padding: '1.5rem 2rem 2rem' }}>
            {errorMsg && (
              <div style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-danger-text)', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!tokenParam && (
                <div className="form-group">
                  <label className="form-label">Security Token</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste your reset token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
              )}

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
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
                style={{ marginTop: '0.75rem' }}
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', fontSize: '0.875rem' }}>
              <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                Cancel and return to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
