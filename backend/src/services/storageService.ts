import { bucket } from '../config/storage';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export interface UploadResult {
  publicUrl: string;
  filename: string;
}

/**
 * Validate file type and size
 * @param file - Multer file object
 * @throws Error if validation fails
 */
function validateFile(file: Express.Multer.File): void {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image must be less than 5MB');
  }
}

/**
 * Generate unique filename with timestamp
 * @param originalName - Original filename
 * @returns Unique filename
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = originalName.split('.').pop() || 'jpg';
  return `${randomString}-${timestamp}.${extension}`;
}

/**
 * Upload cover image to Google Cloud Storage
 * @param file - Multer file object
 * @returns Public URL and filename
 * @throws Error if upload fails or validation fails
 */
export async function uploadCoverImage(file: Express.Multer.File): Promise<UploadResult> {
  // Validate file
  validateFile(file);

  // Generate unique filename
  const filename = generateUniqueFilename(file.originalname);

  // Create blob in bucket
  const blob = bucket.file(filename);

  // Create write stream
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
  });

  // Upload file
  await new Promise<void>((resolve, reject) => {
    blobStream.on('error', (error) => {
      reject(new Error(`Upload failed: ${error.message}`));
    });

    blobStream.on('finish', () => {
      resolve();
    });

    blobStream.end(file.buffer);
  });

  // Get public URL (bucket must have uniform bucket-level access with allUsers read permission)
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

  return {
    publicUrl,
    filename,
  };
}

/**
 * Delete image from Google Cloud Storage
 * @param filename - Filename to delete
 */
export async function deleteImage(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error - file might already be deleted
  }
}
