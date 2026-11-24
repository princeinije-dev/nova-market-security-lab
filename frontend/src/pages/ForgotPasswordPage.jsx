import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

export const ForgotPasswordPage = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenGenerated, setTokenGenerated] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email.trim());
      if (res.success) {
        showToast(res.message, 'success');
        if (res.resetToken) {
          setTokenGenerated(res.resetToken);
        }
      }
    } catch (err) {
      showToast('Could not initiate password reset.', 'error');
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
              <KeyRound size={28} />
            </div>
            <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Reset Password</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Enter your email address to receive password reset instructions.
            </p>
          </div>

          <div className="card-body" style={{ padding: '1.5rem 2rem 2rem' }}>
            {tokenGenerated ? (
              <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success-text)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} /> Password Reset Token Issued
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  In this local environment, your reset link is ready immediately:
                </p>
                <Link
                  to={`/reset-password?token=${tokenGenerated}`}
                  className="btn btn-accent btn-sm btn-block"
                >
                  Proceed to Reset Password Now &rarr;
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="customer@ecommerce.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                  style={{ marginTop: '0.75rem' }}
                >
                  {loading ? 'Sending Request...' : 'Send Reset Link'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', fontSize: '0.875rem' }}>
              <Link to="/login" style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
