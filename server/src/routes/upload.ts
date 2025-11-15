import express, { Response } from 'express';
import multer from 'multer';
import { ImageUploadService } from '../services/imageUploadService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = express.Router();
const imageUploadService = new ImageUploadService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Max 10 files per request
  }
});

/**
 * Upload a single image
 * POST /api/upload/image
 */
router.post(
  '/image',
  authenticateToken,
  uploadLimiter,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate image
      const validation = imageUploadService.validateImage(
        req.file.mimetype,
        req.file.size
      );

      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Upload to Supabase Storage
      const imageUrl = await imageUploadService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        user.id
      );

      res.json({
        message: 'Image uploaded successfully',
        url: imageUrl
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
  }
);

/**
 * Upload multiple images
 * POST /api/upload/images
 */
router.post(
  '/images',
  authenticateToken,
  uploadLimiter,
  upload.array('images', 10),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Validate all images
      for (const file of req.files) {
        const validation = imageUploadService.validateImage(file.mimetype, file.size);
        if (!validation.valid) {
          return res.status(400).json({
            error: `Invalid file ${file.originalname}: ${validation.error}`
          });
        }
      }

      // Upload all images
      const files = req.files.map(file => ({
        buffer: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype
      }));

      const imageUrls = await imageUploadService.uploadMultipleImages(files, user.id);

      res.json({
        message: 'Images uploaded successfully',
        urls: imageUrls
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload images' });
    }
  }
);

/**
 * Delete an image
 * DELETE /api/upload/image
 */
router.delete('/image', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Verify the URL belongs to this user
    if (!url.includes(`/${user.id}/`)) {
      return res.status(403).json({ error: 'You can only delete your own images' });
    }

    await imageUploadService.deleteImage(url);

    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
});

export default router;
