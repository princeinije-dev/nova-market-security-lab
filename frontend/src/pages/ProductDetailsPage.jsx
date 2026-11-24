import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  Check,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { productService } from '../services/productService';
import { StarRating } from '../components/common/StarRating';
import { ProductCard } from '../components/product/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProductDetailsPage = () => {
  const { identifier } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(identifier);
        if (res.success && res.data) {
          setProduct(res.data);
          setSelectedImage(0);
          setQuantity(1);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    window.scrollTo(0, 0);
  }, [identifier]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="empty-state">
          <h2 className="empty-state-title">Product Not Found</h2>
          <p className="empty-state-desc">The item you are searching for does not exist or may have been unlisted.</p>
          <Link to="/shop" className="btn btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' }];

  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;
  const currentPrice = parseFloat(product.discount_price || product.price);
  const originalPrice = product.discount_price ? parseFloat(product.price) : null;
  const savings = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : null;

  const handleQuantityChange = (delta) => {
    const next = quantity + delta;
    if (next >= 1 && next <= product.stock_quantity) {
      setQuantity(next);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please log in to submit your product review.', 'info');
      return;
    }

    if (!reviewComment.trim()) {
      showToast('Please provide a comment for your review.', 'warning');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await productService.addReview({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || null,
        comment: reviewComment.trim(),
      });

      if (res.success) {
        showToast('Review submitted successfully!', 'success');
        setReviewTitle('');
        setReviewComment('');
        // Refresh product to show updated rating and review list
        const updatedRes = await productService.getProduct(identifier);
        if (updatedRes.success) {
          setProduct(updatedRes.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Breadcrumbs */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <div className="breadcrumb-item">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
        </div>
        <div className="breadcrumb-item">
          <Link to="/shop">Shop</Link>
          <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
        </div>
        {product.category_name && (
          <div className="breadcrumb-item">
            <Link to={`/shop?category=${product.category_slug}`}>{product.category_name}</Link>
            <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
          </div>
        )}
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="product-details-grid">
        {/* Left: Gallery */}
        <div className="gallery-container">
          <div className="gallery-main">
            <img
              src={images[selectedImage]?.image_url}
              alt={product.name}
              className="gallery-main-img"
            />
          </div>

          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className={`gallery-thumb ${selectedImage === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img.image_url} alt="" className="gallery-thumb-img" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="product-info-panel">
          <span className="product-detail-sku">
            SKU: <strong>{product.sku || 'N/A'}</strong> • Category:{' '}
            <strong>{product.category_name || 'General'}</strong>
          </span>

          <h1 className="product-detail-title">{product.name}</h1>

          <div className="product-detail-rating">
            <StarRating rating={product.rating_avg} count={product.rating_count} size={18} />
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span style={{ fontSize: '0.875rem', color: isOutOfStock ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
              {isOutOfStock ? '● Currently Out of Stock' : `● ${product.stock_quantity} In Stock Ready to Ship`}
            </span>
          </div>

          {/* Pricing Box */}
          <div className="product-detail-price-box">
            <span className="price-detail-current">${currentPrice.toFixed(2)}</span>
            {originalPrice && (
              <span className="price-detail-original">${originalPrice.toFixed(2)}</span>
            )}
            {savings && (
              <span className="badge badge-danger">Save {savings}%</span>
            )}
          </div>

          <p className="product-detail-desc">
            {product.short_description || product.description.substring(0, 180) + '...'}
          </p>

          {/* Quantity and Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Quantity:</span>
            <div className="qty-control">
              <button
                className="qty-btn"
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => handleQuantityChange(-1)}
              >
                -
              </button>
              <input
                type="text"
                className="qty-input"
                value={quantity}
                readOnly
              />
              <button
                className="qty-btn"
                disabled={quantity >= product.stock_quantity || isOutOfStock}
                onClick={() => handleQuantityChange(1)}
              >
                +
              </button>
            </div>
            {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                Low stock alert: Only {product.stock_quantity} left!
              </span>
            )}
          </div>

          <div className="product-action-row">
            <button
              className={`btn btn-lg ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flex: 1 }}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={20} />
              {isOutOfStock ? 'Out of Stock' : `Add to Bag • $${(currentPrice * quantity).toFixed(2)}`}
            </button>

            <button
              className={`btn btn-lg ${inWishlist ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => toggleWishlist(product)}
              title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart size={20} fill={inWishlist ? '#ffffff' : 'none'} />
            </button>
          </div>

          {/* Assurances */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              <Truck size={18} color="var(--color-accent)" />
              <span>Free domestic shipping on orders over $150</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              <ShieldCheck size={18} color="var(--color-accent)" />
              <span>Full manufacturer 2-year warranty & authenticity cert</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              <RotateCcw size={18} color="var(--color-accent)" />
              <span>30-day hassle-free return policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs (Description, Specifications, Customer Reviews) */}
      <section className="product-tabs">
        <div className="tab-nav">
          <button
            className={`tab-nav-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description & Story
          </button>
          <button
            className={`tab-nav-btn ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Product Specifications
          </button>
          <button
            className={`tab-nav-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Customer Reviews ({product.reviews?.length || 0})
          </button>
        </div>

        {activeTab === 'description' && (
          <div style={{ maxWidth: '800px', lineHeight: 1.8, fontSize: '1.0625rem', color: 'var(--color-text-main)' }}>
            <p style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div style={{ maxWidth: '650px' }}>
            <table className="cart-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, width: '220px' }}>Manufacturer SKU</td>
                  <td>{product.sku}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Category</td>
                  <td>{product.category_name}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Stock Availability</td>
                  <td>{product.stock_quantity} units available</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Packaging</td>
                  <td>Luxury gift box with authenticity card</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Warranty</td>
                  <td>2-year official international warranty</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-grid">
            {/* Review Submission Form */}
            <div>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Write a Review</h3>
                </div>
                <div className="card-body">
                  {!isAuthenticated ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Please sign in to share your experience with this item.
                      </p>
                      <Link to="/login" className="btn btn-primary btn-sm">
                        Sign In to Review
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit}>
                      <div className="form-group">
                        <label className="form-label">Your Rating (1 to 5 Stars)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setReviewRating(star)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Star
                                size={24}
                                fill={star <= reviewRating ? '#fbbf24' : 'none'}
                                color={star <= reviewRating ? '#fbbf24' : '#cbd5e1'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Review Headline</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Exceptional sound and comfort"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Your Feedback</label>
                        <textarea
                          className="form-textarea"
                          placeholder="What did you like or dislike about this product?"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={submittingReview}
                      >
                        {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div>
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="review-card">
                    <div className="review-author">
                      <div className="review-avatar">
                        {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{rev.user_name}</span>
                          <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>Verified Buyer</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                          {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                      <StarRating rating={rev.rating} showCount={false} size={14} />
                    </div>

                    {rev.title && (
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-primary)' }}>
                        {rev.title}
                      </h4>
                    )}

                    <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
                      {rev.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ margin: 0 }}>
                  <h4 className="empty-state-title">No Reviews Yet</h4>
                  <p className="empty-state-desc">Be the first to review this exceptional piece!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Related Products Section */}
      {product.related && product.related.length > 0 && (
        <section style={{ marginTop: '5rem' }}>
          <div className="section-header">
            <span className="section-tag">Pairing Recommendations</span>
            <h2 className="section-title">Related Items</h2>
          </div>
          <div className="product-grid">
            {product.related.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
