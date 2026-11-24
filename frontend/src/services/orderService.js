import api from './api';

export const orderService = {
  async checkout(orderData) {
    const res = await api.post('/orders/checkout', orderData);
    return res.data;
  },

  async getMyOrders(params = {}) {
    const res = await api.get('/orders/my-orders', { params });
    return res.data;
  },

  async getOrderById(id) {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  async cancelOrder(id, reason) {
    const res = await api.post(`/orders/${id}/cancel`, { reason });
    return res.data;
  },

  async getInvoiceData(id) {
    const res = await api.get(`/orders/${id}/invoice`);
    return res.data;
  },

  async submitPayment(orderId, paymentData) {
    const res = await api.post(`/payments/orders/${orderId}/submit`, paymentData);
    return res.data;
  },

  async uploadProof(formData) {
    const res = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
