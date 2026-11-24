import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminLoginPage = () => {
  const { adminLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Both administrative email and password are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await adminLogin({ email, password });
      if (res.success) {
        showToast(`Welcome back, ${res.user.name}. Administrator authenticated.`, 'success');
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Administrative authentication failed.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@ecommerce.com');
    setPassword('Admin123!');
    setErrorMsg('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#38bdf8',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            NovaMarket Admin Console
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Authorized personnel only. Direct bank transfer & order fulfillment hub.
          </p>
        </div>

        <div className="card" style={{ backgroundColor: '#1e293b', borderColor: '#334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div className="card-body" style={{ padding: '2rem' }}>
            {/* Quick Demo Fill Button */}
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="btn btn-secondary btn-sm btn-block"
              style={{
                marginBottom: '1.5rem',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderColor: '#0284c7',
                color: '#38bdf8',
                fontWeight: 600,
              }}
            >
              <KeyRound size={16} /> Fill Demo Admin (admin@ecommerce.com)
            </button>

            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#e2e8f0' }}>Administrator Email</label>
                <input
                  type="email"
                  className="form-input"
                  style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  placeholder="admin@ecommerce.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#e2e8f0' }}>Admin Password</label>
                <input
                  type="password"
                  className="form-input"
                  style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent btn-block btn-lg"
                disabled={loading}
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Authenticating Staff...' : 'Access Administration'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'underline' }}>
            &larr; Return to Public Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};
