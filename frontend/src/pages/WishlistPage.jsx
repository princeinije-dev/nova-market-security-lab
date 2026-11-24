import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleMoveToCart = async (item) => {
    const success = await addToCart(item, 1);
    if (success) {
      removeFromWishlist(item.product_id || item.id);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="section-header">
        <h1 className="section-title">My Wishlist</h1>
        <p className="section-subtitle">
          Your curated selection of personal favorites and pieces saved for future acquisition.
        </p>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner" />
          <p>Loading your saved pieces...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Heart size={32} />
          </div>
          <h2 className="empty-state-title">Your wishlist is currently empty</h2>
          <p className="empty-state-desc">
            Explore our collections and tap the heart icon on any piece to save it here.
          </p>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {wishlistItems.map((item) => {
            const pId = item.product_id || item.id;
            const currentPrice = parseFloat(item.discount_price || item.price);
            const isOutOfStock = item.stock_quantity <= 0;

            return (
              <div key={item.id} className="product-card">
                <Link to={`/products/${item.slug || pId}`} className="product-card-img-wrap">
                  <img
                    src={item.primary_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                    alt={item.name}
                    className="product-card-img"
                  />
                  {isOutOfStock && (
                    <div className="product-badge-group">
                      <span className="badge badge-secondary">Out of Stock</span>
                    </div>
                  )}
                </Link>

                <div className="product-card-body">
                  <h3 className="product-card-title">
                    <Link to={`/products/${item.slug || pId}`}>{item.name}</Link>
                  </h3>

                  <div className="product-card-price-row">
                    <span className="price-current">${currentPrice.toFixed(2)}</span>
                    {item.discount_price && (
                      <span className="price-original">${parseFloat(item.price).toFixed(2)}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                      className={`btn btn-sm ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ flex: 1 }}
                      disabled={isOutOfStock}
                      onClick={() => handleMoveToCart(item)}
                    >
                      <ShoppingBag size={14} /> Move to Cart
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--color-danger)', padding: '0.4rem' }}
                      title="Remove from wishlist"
                      onClick={() => removeFromWishlist(pId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
