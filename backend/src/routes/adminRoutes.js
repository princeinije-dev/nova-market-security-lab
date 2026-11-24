import { Router } from 'express';
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllCustomers,
  toggleCustomerStatus,
  getStoreSettings,
  updateStoreSettings,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getReports,
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes for store settings and banners (so customer site can show them)
router.get('/settings/public', getStoreSettings);
router.get('/banners/public', getBanners);

// Protected Admin-only routes
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/customers', getAllCustomers);
router.put('/customers/:id/toggle-status', toggleCustomerStatus);

router.get('/settings', getStoreSettings);
router.put('/settings', updateStoreSettings);

router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

router.get('/reports', getReports);

export default router;
