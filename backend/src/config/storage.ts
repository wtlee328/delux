import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

// In Cloud Run, use default credentials (Workload Identity)
// In local development, use key file
const storageConfig: any = {
  projectId: process.env.GCS_PROJECT_ID,
};

// Only use keyFilename in local development
if (process.env.GCS_KEYFILE_PATH && process.env.NODE_ENV !== 'production') {
  storageConfig.keyFilename = process.env.GCS_KEYFILE_PATH;
}

const storage = new Storage(storageConfig);

const bucketName = process.env.GCS_BUCKET_NAME || 'delux-plus-products';
const bucket = storage.bucket(bucketName);

export { storage, bucket, bucketName };
