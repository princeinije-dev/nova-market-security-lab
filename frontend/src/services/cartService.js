import api from './api';

export const cartService = {
  async getCart() {
    const res = await api.get('/cart');
    return res.data;
  },

  async addToCart(productId, quantity = 1) {
    const res = await api.post('/cart/add', { productId, quantity });
    return res.data;
  },

  async updateQuantity(productId, quantity) {
    const res = await api.put('/cart/update', { productId, quantity });
    return res.data;
  },

  async removeItem(productId) {
    const res = await api.delete(`/cart/item/${productId}`);
    return res.data;
  },

  async clearCart() {
    const res = await api.delete('/cart/clear');
    return res.data;
  },

  async syncCart(localItems) {
    const res = await api.post('/cart/sync', { localItems });
    return res.data;
  },

  async getWishlist() {
    const res = await api.get('/wishlist');
    return res.data;
  },

  async toggleWishlist(productId) {
    const res = await api.post('/wishlist/toggle', { productId });
    return res.data;
  },

  async removeFromWishlist(productId) {
    const res = await api.delete(`/wishlist/${productId}`);
    return res.data;
  },
};
