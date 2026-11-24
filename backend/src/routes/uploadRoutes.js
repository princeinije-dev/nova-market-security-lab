import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { uploadSingleImage, uploadMultipleImages } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Allow authenticated users (e.g. customer uploading bank receipt proof, admin uploading product images)
router.post('/single', authenticateToken, upload.single('image'), uploadSingleImage);
router.post('/multiple', authenticateToken, upload.array('images', 10), uploadMultipleImages);

export default router;
