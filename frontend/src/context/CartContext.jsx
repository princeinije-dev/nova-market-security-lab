import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('local_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fetch or sync server cart when authentication changes
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await cartService.getCart();
      if (res.success && res.data) {
        setCartItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load server cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // If user had local items, sync to server
      const local = localStorage.getItem('local_cart');
      if (local) {
        try {
          const items = JSON.parse(local);
          if (items.length > 0) {
            cartService.syncCart(items.map(i => ({ productId: i.product_id || i.productId, quantity: i.quantity })))
              .then(() => {
                localStorage.removeItem('local_cart');
                fetchCart();
              });
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      fetchCart();
    } else {
      // Load local cart
      try {
        const saved = localStorage.getItem('local_cart');
        setCartItems(saved ? JSON.parse(saved) : []);
      } catch {
        setCartItems([]);
      }
    }
  }, [isAuthenticated, fetchCart]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('local_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  // Persist coupon
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('applied_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = async (product, quantity = 1) => {
    const qty = parseInt(quantity, 10) || 1;

    // Check available stock
    if (product.stock_quantity <= 0) {
      showToast('Sorry, this product is currently out of stock.', 'error');
      return false;
    }

    if (isAuthenticated) {
      try {
        const res = await cartService.addToCart(product.id, qty);
        if (res.success) {
          showToast(`Added ${product.name} to cart.`, 'success');
          await fetchCart();
          return true;
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to add item to cart.';
        showToast(msg, 'error');
        return false;
      }
    } else {
      // Local cart logic
      setCartItems((prev) => {
        const existingIndex = prev.findIndex((item) => (item.product_id || item.productId) === product.id);
        const unitPrice = parseFloat(product.discount_price || product.price);

        if (existingIndex > -1) {
          const existing = prev[existingIndex];
          const newQty = existing.quantity + qty;

          if (newQty > product.stock_quantity) {
            showToast(`Cannot add more. Only ${product.stock_quantity} available in stock.`, 'warning');
            return prev;
          }

          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            line_total: parseFloat((newQty * unitPrice).toFixed(2)),
          };
          showToast(`Updated ${product.name} quantity to ${newQty}.`, 'success');
          return updated;
        } else {
          if (qty > product.stock_quantity) {
            showToast(`Cannot add ${qty}. Only ${product.stock_quantity} in stock.`, 'warning');
            return prev;
          }

          showToast(`Added ${product.name} to cart.`, 'success');
          return [
            ...prev,
            {
              id: `local-${Date.now()}`,
              product_id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              discount_price: product.discount_price,
              unit_price: unitPrice,
              quantity: qty,
              stock_quantity: product.stock_quantity,
              line_total: parseFloat((qty * unitPrice).toFixed(2)),
              image_url: product.primary_image || (product.images && product.images[0]?.image_url) || null,
            },
          ];
        }
      });
      return true;
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);

    if (isAuthenticated) {
      try {
        const res = await cartService.updateQuantity(productId, qty);
        if (res.success) {
          await fetchCart();
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Could not update quantity.';
        showToast(msg, 'error');
      }
    } else {
      if (qty <= 0) {
        removeItem(productId);
        return;
      }
      setCartItems((prev) => {
        return prev.map((item) => {
          if ((item.product_id || item.productId) === productId) {
            if (qty > item.stock_quantity) {
              showToast(`Exceeds available stock (${item.stock_quantity} available).`, 'warning');
              return item;
            }
            return {
              ...item,
              quantity: qty,
              line_total: parseFloat((qty * item.unit_price).toFixed(2)),
            };
          }
          return item;
        });
      });
    }
  };

  const removeItem = async (productId) => {
    if (isAuthenticated) {
      try {
        const res = await cartService.removeItem(productId);
        if (res.success) {
          showToast('Item removed from cart.', 'info');
          await fetchCart();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setCartItems((prev) => prev.filter((item) => (item.product_id || item.productId) !== productId));
      showToast('Item removed from cart.', 'info');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clearCart();
        await fetchCart();
      } catch (err) {
        console.error(err);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem('local_cart');
    }
    setAppliedCoupon(null);
  };

  const applyCoupon = (couponData) => {
    setAppliedCoupon(couponData);
    showToast(`Coupon "${couponData.code}" applied!`, 'success');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed.', 'info');
  };

  // Calculations
  const subtotal = parseFloat(
    cartItems
      .reduce((sum, item) => {
        const unit = parseFloat(item.unit_price || item.discount_price || item.price || 0);
        return sum + unit * (parseInt(item.quantity, 10) || 1);
      }, 0)
      .toFixed(2)
  );

  const itemCount = cartItems.reduce((count, item) => count + (parseInt(item.quantity, 10) || 0), 0);

  const shippingFee = subtotal >= 150 || subtotal === 0 ? 0.0 : 15.0;

  let discountAmount = 0.0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
    discountAmount = parseFloat(discountAmount.toFixed(2));
  }

  const grandTotal = parseFloat(Math.max(0, subtotal + shippingFee - discountAmount).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        subtotal,
        itemCount,
        shippingFee,
        discountAmount,
        grandTotal,
        appliedCoupon,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
