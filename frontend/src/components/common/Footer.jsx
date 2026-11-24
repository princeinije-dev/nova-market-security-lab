import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand info */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <ShoppingBag size={24} color="#3b82f6" />
              <span>NOVAMARKET</span>
            </Link>
            <p className="footer-desc">
              Curated masterworks in acoustics, horology, computing ergonomics, and handcrafted leather. Engineered for uncompromising daily excellence.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <span className="payment-badge">Direct Bank Wire</span>
              <span className="payment-badge">Verified Swift</span>
              <span className="payment-badge">ACH Transfer</span>
            </div>
          </div>

          {/* Quick shop */}
          <div>
            <h4 className="footer-title">Collections</h4>
            <div className="footer-links">
              <Link to="/shop?category=electronics-audio">Audio & Hi-Fi</Link>
              <Link to="/shop?category=watches-wearables">Titanium Chronographs</Link>
              <Link to="/shop?category=computers-accessories">Mechanical Keyboards</Link>
              <Link to="/shop?category=luxury-leather">Full-Grain Leather</Link>
              <Link to="/shop?category=home-lifestyle">Artisan Lifestyle</Link>
            </div>
          </div>

          {/* Customer support */}
          <div>
            <h4 className="footer-title">Customer Care</h4>
            <div className="footer-links">
              <Link to="/orders">Track My Order</Link>
              <Link to="/cart">Review Bag</Link>
              <Link to="/about">Our Philosophy</Link>
              <Link to="/contact">Wire Transfer Guide</Link>
              <Link to="/admin/login">Staff Portal</Link>
            </div>
          </div>

          {/* Direct contact */}
          <div>
            <h4 className="footer-title">Headquarters</h4>
            <div className="footer-links" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <MapPin size={16} color="#60a5fa" />
                <span>100 Commerce Way, New York, NY</span>
              </p>
              <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Phone size={16} color="#60a5fa" />
                <span>+1 (800) 555-0199</span>
              </p>
              <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Mail size={16} color="#60a5fa" />
                <span>concierge@novamarket.com</span>
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} NovaMarket Global Direct LLC. All rights reserved.</p>
          <div className="footer-cards">
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Bank Wire Payment Protocol • 256-Bit SSL Encrypted
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
