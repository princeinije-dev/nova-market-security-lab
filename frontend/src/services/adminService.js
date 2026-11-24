import api from './api';

export const adminService = {
  async getDashboardStats() {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  async getOrders(params = {}) {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },

  async updateOrderStatus(id, data) {
    const res = await api.put(`/admin/orders/${id}/status`, data);
    return res.data;
  },

  async confirmPayment(orderId) {
    const res = await api.post(`/payments/orders/${orderId}/confirm`);
    return res.data;
  },

  async rejectPayment(orderId, reason) {
    const res = await api.post(`/payments/orders/${orderId}/reject`, { reason });
    return res.data;
  },

  async refundPayment(orderId, notes) {
    const res = await api.post(`/payments/orders/${orderId}/refund`, { notes });
    return res.data;
  },

  async getProducts(params = {}) {
    const res = await api.get('/products', { params: { ...params, allStatus: 'true' } });
    return res.data;
  },

  async createProduct(data) {
    const res = await api.post('/products', data);
    return res.data;
  },

  async updateProduct(id, data) {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  async getCustomers(params = {}) {
    const res = await api.get('/admin/customers', { params });
    return res.data;
  },

  async toggleCustomerStatus(id) {
    const res = await api.put(`/admin/customers/${id}/toggle-status`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/categories/admin/all');
    return res.data;
  },

  async createCategory(data) {
    const res = await api.post('/categories', data);
    return res.data;
  },

  async updateCategory(id, data) {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },

  async getCoupons() {
    const res = await api.get('/coupons');
    return res.data;
  },

  async createCoupon(data) {
    const res = await api.post('/coupons', data);
    return res.data;
  },

  async updateCoupon(id, data) {
    const res = await api.put(`/coupons/${id}`, data);
    return res.data;
  },

  async deleteCoupon(id) {
    const res = await api.delete(`/coupons/${id}`);
    return res.data;
  },

  async getReviews() {
    const res = await api.get('/reviews/admin/all');
    return res.data;
  },

  async updateReviewStatus(id, status) {
    const res = await api.put(`/reviews/admin/${id}/status`, { status });
    return res.data;
  },

  async deleteReview(id) {
    const res = await api.delete(`/reviews/admin/${id}`);
    return res.data;
  },

  async getSettings() {
    const res = await api.get('/admin/settings');
    return res.data;
  },

  async updateSettings(data) {
    const res = await api.put('/admin/settings', data);
    return res.data;
  },

  async getBanners() {
    const res = await api.get('/admin/banners');
    return res.data;
  },

  async createBanner(data) {
    const res = await api.post('/admin/banners', data);
    return res.data;
  },

  async updateBanner(id, data) {
    const res = await api.put(`/admin/banners/${id}`, data);
    return res.data;
  },

  async deleteBanner(id) {
    const res = await api.delete(`/admin/banners/${id}`);
    return res.data;
  },

  async getReports() {
    const res = await api.get('/admin/reports');
    return res.data;
  },

  async uploadImage(formData) {
    const res = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
