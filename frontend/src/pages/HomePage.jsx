import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { productService } from '../services/productService';
import { ProductCard } from '../components/product/ProductCard';

export const HomePage = () => {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [bannersRes, featRes, catRes] = await Promise.all([
          productService.getPublicBanners().catch(() => ({ data: [] })),
          productService.getFeatured().catch(() => ({ data: [] })),
          productService.getCategories().catch(() => ({ data: [] })),
        ]);

        if (bannersRes.data && bannersRes.data.length > 0) {
          setBanners(bannersRes.data);
        } else {
          setBanners([
            {
              id: 1,
              title: 'Elevate Your Everyday Essentials',
              subtitle: 'Discover artisan craftsmanship, precision acoustics, and modern tech engineered for perfection.',
              image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
              link_url: '/shop',
              button_text: 'Explore Collection',
              badge_text: 'Autumn/Winter 2026',
            },
          ]);
        }

        setFeaturedProducts(featRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Error loading homepage:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Slide controls
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto advance slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const activeBanner = banners[currentSlide] || banners[0];

  return (
    <div className="container" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
      {/* Hero Carousel */}
      {activeBanner && (
        <section
          className="hero-slider"
          style={{ backgroundImage: `url(${activeBanner.image_url})` }}
        >
          <div className="hero-slide-overlay" />
          <div className="hero-slide">
            <div className="hero-content">
              {activeBanner.badge_text && (
                <span className="hero-badge">
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {activeBanner.badge_text}
                </span>
              )}
              <h1 className="hero-title">{activeBanner.title}</h1>
              <p className="hero-subtitle">{activeBanner.subtitle}</p>
              <Link to={activeBanner.link_url || '/shop'} className="btn btn-accent btn-lg">
                {activeBanner.button_text || 'Shop Now'}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {banners.length > 1 && (
            <div className="hero-controls">
              <button
                className="hero-ctrl-btn"
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="hero-ctrl-btn"
                onClick={nextSlide}
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Benefits Value Props */}
      <section className="benefits-grid">
        <div className="benefit-card">
          <div className="benefit-icon">
            <Truck size={24} />
          </div>
          <div>
            <h4 className="benefit-title">Complimentary Shipping</h4>
            <p className="benefit-desc">Free insured delivery on all domestic orders exceeding $150.</p>
          </div>
        </div>

        <div className="benefit-card">
          <div className="benefit-icon">
            <CreditCard size={24} />
          </div>
          <div>
            <h4 className="benefit-title">Direct Bank Transfer</h4>
            <p className="benefit-desc">Secure wire and ACH payments with instant manual order verification.</p>
          </div>
        </div>

        <div className="benefit-card">
          <div className="benefit-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="benefit-title">Authenticity Guaranteed</h4>
            <p className="benefit-desc">Every piece is certified original with full manufacturer warranty.</p>
          </div>
        </div>

        <div className="benefit-card">
          <div className="benefit-icon">
            <RotateCcw size={24} />
          </div>
          <div>
            <h4 className="benefit-title">30-Day Hassle-Free Returns</h4>
            <p className="benefit-desc">Not completely satisfied? Return your items within 30 days.</p>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-header">
          <span className="section-tag">Curated Collections</span>
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">
            Explore our specialized selections designed for focused performance and aesthetic harmony.
          </p>
        </div>

        <div className="category-cards-grid">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="category-card"
            >
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                alt={cat.name}
                className="category-card-img"
              />
              <div className="category-card-overlay">
                <h3 className="category-card-name">{cat.name}</h3>
                <span className="category-card-count">
                  {cat.product_count !== undefined ? `${cat.product_count} Products` : 'Browse Collection'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="section-tag">Editor's Choice</span>
            <h2 className="section-title">Featured Highlights</h2>
            <p className="section-subtitle">
              Hand-selected gear celebrated for innovation, acoustic fidelity, and tactile satisfaction.
            </p>
          </div>
          <Link to="/shop" className="btn btn-outline">
            View All Products <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="loader-container">
            <div className="spinner" />
            <p>Loading curated catalogue...</p>
          </div>
        ) : (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Promotion / Bank Transfer Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '3.5rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
            Direct Bank Wire Option
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2 }}>
            Instant Wire Checkout & Order Verification
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6 }}>
            Pay directly via domestic wire transfer or ACH. Use coupon <strong>WELCOME10</strong> at checkout for 10% off your inaugural order.
          </p>
        </div>
        <Link to="/shop" className="btn btn-accent btn-lg">
          Shop Now with WELCOME10
        </Link>
      </section>
    </div>
  );
};
