import api from './api';

export const productService = {
  async getProducts(params = {}) {
    const res = await api.get('/products', { params });
    return res.data;
  },

  async getFeatured() {
    const res = await api.get('/products/featured');
    return res.data;
  },

  async getProduct(identifier) {
    const res = await api.get(`/products/${identifier}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/categories');
    return res.data;
  },

  async addReview(data) {
    const res = await api.post('/reviews', data);
    return res.data;
  },

  async validateCoupon(code, subtotal) {
    const res = await api.post('/coupons/validate', { code, subtotal });
    return res.data;
  },

  async getPublicSettings() {
    const res = await api.get('/admin/settings/public');
    return res.data;
  },

  async getPublicBanners() {
    const res = await api.get('/admin/banners/public');
    return res.data;
  },
};
