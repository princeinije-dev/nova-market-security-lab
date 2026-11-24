import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
      <div className="empty-state" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>
          404
        </h1>
        <h2 className="empty-state-title" style={{ marginTop: '1rem' }}>
          Page Not Found
        </h2>
        <p className="empty-state-desc">
          The page or product you were looking for does not exist or may have been relocated.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            <Home size={16} /> Return Home
          </Link>
          <Link to="/shop" className="btn btn-outline">
            <ShoppingBag size={16} /> Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};
