import { Router } from 'express';
import {
  submitPaymentDetails,
  getPaymentByOrderId,
  adminConfirmPayment,
  adminRejectPayment,
  adminRefundPayment,
} from '../controllers/paymentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Customer submits payment confirmation details / reference / notes
router.post('/orders/:orderId/submit', authenticateToken, submitPaymentDetails);
router.get('/orders/:orderId', authenticateToken, getPaymentByOrderId);

// Admin-only payment management actions
router.post('/orders/:orderId/confirm', authenticateToken, requireAdmin, adminConfirmPayment);
router.post('/orders/:orderId/reject', authenticateToken, requireAdmin, adminRejectPayment);
router.post('/orders/:orderId/refund', authenticateToken, requireAdmin, adminRefundPayment);

export default router;
