import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  getWallet,
  getWalletTransactions,
  requestTopup,
  adminListTopups,
  adminApproveTopup,
  adminRejectTopup,
  adminAdjustWallet,
  payOrderWithWallet,
} from '../controllers/walletController.js';

const router = Router();

// ── Customer routes (require login) ──────────────────────────────────────────
router.get('/',             requireAuth, getWallet);
router.get('/transactions', requireAuth, getWalletTransactions);
router.post('/topup',       requireAuth, requestTopup);
router.post('/pay/:orderId',requireAuth, payOrderWithWallet);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/topups',               requireAdmin, adminListTopups);
router.patch('/admin/topups/:id/approve', requireAdmin, adminApproveTopup);
router.patch('/admin/topups/:id/reject',  requireAdmin, adminRejectTopup);
router.patch('/admin/customers/:userId/adjust', requireAdmin, adminAdjustWallet);

export default router;
