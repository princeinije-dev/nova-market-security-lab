import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Compass, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Hero section */}
      <div className="section-header center" style={{ maxWidth: '780px', margin: '0 auto 3.5rem' }}>
        <span className="section-tag">Our Heritage & Craft</span>
        <h1 className="section-title">Pursuit of Tangible Excellence</h1>
        <p className="section-subtitle">
          Founded in New York, NovaMarket was born from a singular passion: creating and curating objects of genuine material beauty, acoustic perfection, and durable craftsmanship.
        </p>
      </div>

      <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: '400px', marginBottom: '4rem', boxShadow: 'var(--shadow-lg)' }}>
        <img
          src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80"
          alt="Studio Workshop"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Values Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div className="card">
          <div className="card-body">
            <div className="benefit-icon" style={{ marginBottom: '1rem' }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Uncompromising Quality
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Every titanium casing, CNC mechanical keyboard chassis, and full-grain leather hide undergoes stringent durability certification.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="benefit-icon" style={{ marginBottom: '1rem' }}>
              <Compass size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Ethical Sourcing
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              We partner exclusively with verified workshops in Switzerland, Italy, and Japan that practice sustainable, fair-labor manufacturing.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="benefit-icon" style={{ marginBottom: '1rem' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Direct Wire Integrity
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Independent bank wire and manual validation shield our customers from third-party payment intermediary markups and surveillance.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="benefit-icon" style={{ marginBottom: '1rem' }}>
              <HeartHandshake size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Dedicated Concierge
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Our personal client relations team is on standby to assist with order status, technical advice, and bespoke corporate orders.
            </p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link to="/shop" className="btn btn-primary btn-lg">
          Explore Our Products <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};
