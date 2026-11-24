import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { StarRating } from '../common/StarRating';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const currentPrice = parseFloat(product.discount_price || product.price);
  const originalPrice = product.discount_price ? parseFloat(product.price) : null;
  const savings = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : null;

  const imageUrl =
    product.primary_image ||
    (product.images && product.images[0]?.image_url) ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.slug || product.id}`} className="product-card-img-wrap">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
        />

        {/* Badges */}
        <div className="product-badge-group">
          {product.is_featured && <span className="badge badge-gold">Featured</span>}
          {savings && <span className="badge badge-danger">-{savings}% OFF</span>}
          {isOutOfStock && <span className="badge badge-secondary">Sold Out</span>}
          {isLowStock && !isOutOfStock && <span className="badge badge-warning">Only {product.stock_quantity} left</span>}
        </div>

        {/* Wishlist Button */}
        <button
          className={`wishlist-btn-corner ${inWishlist ? 'active' : ''}`}
          onClick={handleToggleWishlist}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Wishlist toggle"
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
      </Link>

      <div className="product-card-body">
        {product.category_name && (
          <span className="product-card-cat">{product.category_name}</span>
        )}

        <h3 className="product-card-title">
          <Link to={`/products/${product.slug || product.id}`}>
            {product.name}
          </Link>
        </h3>

        <div className="product-card-rating">
          <StarRating rating={product.rating_avg} count={product.rating_count} size={14} />
        </div>

        <div className="product-card-price-row">
          <span className="price-current">${currentPrice.toFixed(2)}</span>
          {originalPrice && (
            <span className="price-original">${originalPrice.toFixed(2)}</span>
          )}
        </div>

        <div className="product-card-footer">
          <button
            className={`btn btn-block ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            <ShoppingBag size={16} />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};
