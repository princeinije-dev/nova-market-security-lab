import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { ArrowRight, Layers } from 'lucide-react';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="section-header center">
        <span className="section-tag">Explore Architecture</span>
        <h1 className="section-title">Product Categories</h1>
        <p className="section-subtitle">
          Browse our dedicated collections engineered for acoustic depth, tactile precision, horological excellence, and timeless leathercraft.
        </p>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner" />
          <p>Loading categories...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '220px', overflow: 'hidden' }}>
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                  alt={cat.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  {cat.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                  {cat.description || 'Discover curated pieces in this exclusive category.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
                    {cat.product_count !== undefined ? `${cat.product_count} Items Available` : 'View Selection'}
                  </span>
                  <Link to={`/shop?category=${cat.slug}`} className="btn btn-primary btn-sm">
                    Browse Category <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
