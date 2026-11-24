import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getInvoiceData,
} from '../controllers/orderController.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// Guest or logged-in user can place order (if guest, order is placed with customer details in address)
router.post('/checkout', authenticateToken, createOrder);

// Authenticated user order history
router.get('/my-orders', authenticateToken, requireAuth, getMyOrders);

// View order by ID / order_number (supports token or invoice lookup)
router.get('/:id', authenticateToken, getOrderById);
router.get('/:id/invoice', authenticateToken, getInvoiceData);
router.post('/:id/cancel', authenticateToken, cancelOrder);

export default router;
