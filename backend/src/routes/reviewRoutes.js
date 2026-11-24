import { Router } from 'express';
import {
  getProductReviews,
  addReview,
  getAllReviewsAdmin,
  updateReviewStatusAdmin,
  deleteReviewAdmin,
} from '../controllers/reviewController.js';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticateToken, requireAuth, addReview);

// Admin review moderation
router.get('/admin/all', authenticateToken, requireAdmin, getAllReviewsAdmin);
router.put('/admin/:id/status', authenticateToken, requireAdmin, updateReviewStatusAdmin);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteReviewAdmin);

export default router;
