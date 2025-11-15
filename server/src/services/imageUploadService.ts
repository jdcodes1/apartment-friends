import { supabase } from '../config/supabase';
import { randomBytes } from 'crypto';
import path from 'path';

const STORAGE_BUCKET = 'listing-images';

export class ImageUploadService {
  /**
   * Upload an image to Supabase Storage
   * @param file File buffer and metadata
   * @param userId User ID for organizing files
   * @returns Public URL of the uploaded image
   */
  async uploadImage(
    file: Buffer,
    fileName: string,
    mimeType: string,
    userId: string
  ): Promise<string> {
    // Generate unique filename
    const fileExt = path.extname(fileName);
    const uniqueName = `${userId}/${randomBytes(16).toString('hex')}${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueName, file, {
        contentType: mimeType,
        cacheControl: '31536000', // 1 year
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Upload multiple images
   * @param files Array of file buffers and metadata
   * @param userId User ID for organizing files
   * @returns Array of public URLs
   */
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; fileName: string; mimeType: string }>,
    userId: string
  ): Promise<string[]> {
    const uploadPromises = files.map(file =>
      this.uploadImage(file.buffer, file.fileName, file.mimeType, userId)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl Public URL of the image
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // Extract path from URL
    const urlParts = imageUrl.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   * @param imageUrls Array of public URLs
   */
  async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(url => this.deleteImage(url));
    await Promise.all(deletePromises);
  }

  /**
   * Validate image file
   * @param mimeType MIME type of the file
   * @param fileSize File size in bytes
   * @returns Validation result
   */
  validateImage(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
    // Allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
      };
    }

    // Max file size: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit.'
      };
    }

    return { valid: true };
  }

  /**
   * Ensure the storage bucket exists (should be run during setup)
   */
  async ensureBucketExists(): Promise<void> {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log(`✓ Storage bucket '${STORAGE_BUCKET}' created successfully`);
      }
    }
  }
}
