import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ContactPage = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please complete all required fields.', 'warning');
      return;
    }

    setSubmitted(true);
    showToast('Inquiry sent successfully! Our concierge will respond within 4 hours.', 'success');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="section-header center" style={{ maxWidth: '640px', margin: '0 auto 3rem' }}>
        <span className="section-tag">Client Support</span>
        <h1 className="section-title">Get in Touch</h1>
        <p className="section-subtitle">
          Have an inquiry regarding a piece, need assistance with your bank transfer, or seeking bulk order information? We are at your service.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
        {/* Contact Info Card */}
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">Direct Concierge Office</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="benefit-icon" style={{ width: '40px', height: '40px' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)' }}>Headquarters</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>100 Commerce Way, Suite 400<br />New York, NY 10001, United States</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="benefit-icon" style={{ width: '40px', height: '40px' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)' }}>Email Concierge</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>orders@novamarket.com<br />support@novamarket.com</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="benefit-icon" style={{ width: '40px', height: '40px' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)' }}>Telephone</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>+1 (800) 555-0199 (Toll-Free)<br />Mon - Fri: 8:00 AM - 7:00 PM EST</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div className="benefit-icon" style={{ width: '40px', height: '40px' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)' }}>Wire Verification Window</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Bank payments confirmed twice daily (11:00 AM & 4:00 PM EST).</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Send a Message</h3>
          </div>
          <div className="card-body">
            {submitted && (
              <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-success-text)' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Thank you. Your message has been received!</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Elena Rostova"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="elena@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inquiry Subject</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bank transfer verification, custom order, etc."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Details *</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="How can our concierge assist you today?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg">
                <Send size={18} /> Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
