// lib/actions/upload-to-filebase.ts
'use server'

import { uploadImageToFilebase, uploadJsonToFilebase, uploadNFTToFilebase } from '@/lib/upload-file';
import { env } from '~~/env';

export interface NFTMetadata {
  name: string;
  description: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export interface UploadNFTResult {
  success: boolean;
  imageCid?: string;
  metadataCid?: string;
  imageUrl?: string;
  metadataUrl?: string;
  error?: string;
}

/**
 * Server action to upload NFT image and metadata to Filebase/IPFS
 */
export async function uploadNFTAction(
  formData: FormData
): Promise<UploadNFTResult> {
  try {
    const bucketName = process.env.FILEBASE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('Filebase bucket name not configured');
    }

    // Extract data from FormData
    const image = formData.get('image') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const attributesString = formData.get('attributes') as string;

    // Validate required fields
    if (!image || !name || !description) {
      return {
        success: false,
        error: 'Missing required fields: image, name, or description',
      };
    }

    // Parse attributes if provided
    let attributes: Array<{ trait_type: string; value: string | number }> = [];
    if (attributesString) {
      try {
        attributes = JSON.parse(attributesString);
      } catch (error) {
        console.warn('Failed to parse attributes:', error);
      }
    }

    // Prepare metadata
    const metadata: NFTMetadata = {
      name,
      description,
      ...(attributes.length > 0 && { attributes }),
    };

    // Upload to Filebase
    const result = await uploadNFTToFilebase(image, metadata,env.FILEBASE_BUCKET_NAME);

    return result;
  } catch (error) {
    console.error('Server action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to upload only an image to Filebase/IPFS
 */
export async function uploadImageAction(formData: FormData): Promise<{
  success: boolean;
  cid?: string;
  url?: string;
  error?: string;
}> {
  try {
    const image = formData.get('image') as File;
    if (!image) {
      return {
        success: false,
        error: 'No image file provided',
      };
    }

    const result = await uploadImageToFilebase(image,env.FILEBASE_BUCKET_NAME);
    
    return {
      success: result.success,
      cid: result.cid,
      url: result.url,
      error: result.error,
    };
  } catch (error) {
    console.error('Image upload server action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to upload only JSON metadata to Filebase/IPFS
 */
export async function uploadMetadataAction(formData: FormData): Promise<{
  success: boolean;
  cid?: string;
  url?: string;
  error?: string;
}> {
  try {
    const metadataString = formData.get('metadata') as string;
    if (!metadataString) {
      return {
        success: false,
        error: 'No metadata provided',
      };
    }

    let metadata: object;
    try {
      metadata = JSON.parse(metadataString);
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON metadata format',
      };
    }

    const result = await uploadJsonToFilebase(metadata,env.FILEBASE_BUCKET_NAME);
    
    return {
      success: result.success,
      cid: result.cid,
      url: result.url,
      error: result.error,
    };
  } catch (error) {
    console.error('Metadata upload server action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}