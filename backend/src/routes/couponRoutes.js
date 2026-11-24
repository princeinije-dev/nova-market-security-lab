import { Router } from 'express';
import {
  validateCoupon,
  getAllCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,
} from '../controllers/couponController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public coupon validation (during checkout or cart)
router.post('/validate', validateCoupon);

// Admin coupon management
router.get('/', authenticateToken, requireAdmin, getAllCouponsAdmin);
router.post('/', authenticateToken, requireAdmin, createCouponAdmin);
router.put('/:id', authenticateToken, requireAdmin, updateCouponAdmin);
router.delete('/:id', authenticateToken, requireAdmin, deleteCouponAdmin);

export default router;
