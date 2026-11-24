import { Router } from 'express';
import {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAuth);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
