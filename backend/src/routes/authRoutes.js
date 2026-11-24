import { Router } from 'express';
import {
  register,
  login,
  adminLogin,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  addAddress,
  deleteAddress,
} from '../controllers/authController.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticateToken, requireAuth, getMe);
router.put('/profile', authenticateToken, requireAuth, updateProfile);
router.put('/change-password', authenticateToken, requireAuth, changePassword);
router.post('/addresses', authenticateToken, requireAuth, addAddress);
router.delete('/addresses/:id', authenticateToken, requireAuth, deleteAddress);

export default router;
