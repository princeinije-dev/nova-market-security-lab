import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await cartService.getWishlist();
      if (res.success && res.data) {
        setWishlistItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some((item) => (item.product_id || item.id) === productId);
  }, [wishlistItems]);

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) {
      showToast('Please log in to save items to your wishlist.', 'info');
      return false;
    }

    try {
      const res = await cartService.toggleWishlist(product.id);
      if (res.success) {
        showToast(res.message, res.inWishlist ? 'success' : 'info');
        await fetchWishlist();
        return res.inWishlist;
      }
    } catch (err) {
      showToast('Could not update wishlist.', 'error');
    }
    return false;
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) return;
    try {
      const res = await cartService.removeFromWishlist(productId);
      if (res.success) {
        showToast('Removed from wishlist.', 'info');
        await fetchWishlist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
