// lib/filebase-upload.ts
import AWS from 'aws-sdk';
import { env } from '~~/env';

// Configure Filebase S3 client
const filebaseS3 = new AWS.S3({
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  signatureVersion: 'v4',
  accessKeyId: env.FILEBASE_ACCESS_KEY,
  secretAccessKey: env.FILEBASE_SECRET_KEY,
});

export interface UploadResponse {
  success: boolean;
  cid?: string;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  cid?: string;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Generate a safe filename by removing or replacing problematic characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 100); // Limit length
}

/**
 * Upload an image file to Filebase/IPFS (without custom metadata)
 */
export async function uploadImageToFilebase(
  file: File,
  bucketName: string,
  customKey?: string
): Promise<UploadResponse> {
  try {
    // Generate unique key if not provided
    const timestamp = Date.now();
    const sanitizedFileName = sanitizeFilename(file.name);
    const key = customKey || `images/${timestamp}-${sanitizedFileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload parameters (no custom metadata)
    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.length,
    };

    // Upload to Filebase
    const result = await new Promise<{ cid: string; etag: string }>((resolve, reject) => {
      const request = filebaseS3.putObject(params);
      
      let cid = '';
      
      // Listen for headers to get CID
      request.on('httpHeaders', (statusCode, headers) => {
        console.log('Response headers:', headers);
        if (headers['x-amz-meta-cid']) {
          cid = headers['x-amz-meta-cid'];
        }
        // Sometimes the CID might be in a different header
        if (headers['x-amz-cid']) {
          cid = headers['x-amz-cid'];
        }
      });

      request.on('complete', (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve({
            cid,
            etag: response.data?.ETag || '',
          });
        }
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.send();
    });

    return {
      success: true,
      cid: result.cid,
      url: result.cid ? `https://ipfs.filebase.io/ipfs/${result.cid}` : undefined,
      key,
    };
  } catch (error) {
    console.error('Error uploading image to Filebase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload JSON metadata to Filebase/IPFS (without custom metadata)
 */
export async function uploadJsonToFilebase(
  jsonData: object,
  bucketName: string,
  customKey?: string
): Promise<UploadResponse> {
  try {
    // Generate unique key if not provided
    const timestamp = Date.now();
    const key = customKey || `metadata/${timestamp}-metadata.json`;

    // Convert JSON to buffer
    const jsonString = JSON.stringify(jsonData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    // Upload parameters (no custom metadata)
    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'application/json',
      ContentLength: buffer.length,
    };

    // Upload to Filebase
    const result = await new Promise<{ cid: string; etag: string }>((resolve, reject) => {
      const request = filebaseS3.putObject(params);
      
      let cid = '';
      
      // Listen for headers to get CID
      request.on('httpHeaders', (statusCode, headers) => {
        console.log('Response headers:', headers);
        if (headers['x-amz-meta-cid']) {
          cid = headers['x-amz-meta-cid'];
        }
        if (headers['x-amz-cid']) {
          cid = headers['x-amz-cid'];
        }
      });

      request.on('complete', (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve({
            cid,
            etag: response.data?.ETag || '',
          });
        }
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.send();
    });

    return {
      success: true,
      cid: result.cid,
      url: result.cid ? `https://ipfs.filebase.io/ipfs/${result.cid}` : undefined,
      key,
    };
  } catch (error) {
    console.error('Error uploading JSON to Filebase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload both image and metadata in sequence
 */
export async function uploadNFTToFilebase(
  imageFile: File,
  metadata: {
    name: string;
    description: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  },
  bucketName: string
): Promise<{
  success: boolean;
  imageCid?: string;
  metadataCid?: string;
  imageUrl?: string;
  metadataUrl?: string;
  error?: string;
}> {
  try {
    // Upload image first
    const imageResult = await uploadImageToFilebase(imageFile, bucketName);
    
    if (!imageResult.success) {
      return {
        success: false,
        error: `Image upload failed: ${imageResult.error}`,
      };
    }

    // Create complete metadata with image reference
    const completeMetadata = {
      ...metadata,
      image: imageResult.url,
      image_cid: imageResult.cid,
      created_at: new Date().toISOString(),
    };

    // Upload metadata
    const metadataResult = await uploadJsonToFilebase(completeMetadata, bucketName);
    
    if (!metadataResult.success) {
      return {
        success: false,
        error: `Metadata upload failed: ${metadataResult.error}`,
      };
    }

    return {
      success: true,
      imageCid: imageResult.cid,
      metadataCid: metadataResult.cid,
      imageUrl: imageResult.url,
      metadataUrl: metadataResult.url,
    };
  } catch (error) {
    console.error('Error uploading NFT to Filebase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}