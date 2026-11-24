import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
} from '../controllers/cartController.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAuth);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/item/:productId', removeCartItem);
router.delete('/clear', clearCart);
router.post('/sync', syncCart);

export default router;
