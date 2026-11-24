import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email, password });
      if (res.success) {
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Demo account quick fill for testing
  const fillDemoCustomer = () => {
    setEmail('customer@ecommerce.com');
    setPassword('Customer123!');
    setErrorMsg('');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        <div className="card" style={{ boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
            <div className="benefit-icon" style={{ width: '56px', height: '56px', marginBottom: '1rem' }}>
              <ShoppingBag size={28} />
            </div>
            <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Customer Sign In</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Access your order tracking, invoice receipts, and saved items.
            </p>
          </div>

          <div className="card-body" style={{ padding: '1.5rem 2rem 2rem' }}>
            {/* Demo Helper Button */}
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="btn btn-secondary btn-sm btn-block"
              style={{ marginBottom: '1.5rem', backgroundColor: '#f1f5f9', border: '1px dashed #94a3b8' }}
            >
              <UserCheck size={16} color="var(--color-accent)" />
              Fill Demo Customer (customer@ecommerce.com)
            </button>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-danger-text)', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="customer@ecommerce.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
                style={{ marginTop: '0.75rem' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Don't have an account yet?{' '}
              <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Staff portal note */}
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-light)', marginTop: '1.5rem' }}>
          Are you a store administrator?{' '}
          <Link to="/admin/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>
            Go to Admin Portal
          </Link>
        </p>
      </div>
    </div>
  );
};
