// app/(actions)/upload-file.ts
'use server'

import { uploadNFTToFilebase } from '@/lib/upload-file';
import { env } from '~~/env';

export interface UploadNFTResult {
  success: boolean;
  imageCid?: string;
  metadataCid?: string;
  imageUrl?: string;
  metadataUrl?: string;
  error?: string;
}

export async function uploadNFTAction(formData: FormData): Promise<UploadNFTResult> {
  try {
    const bucketName = env.FILEBASE_BUCKET_NAME;
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
    let attributes: Array<{ 
      display_type: string; 
      trait_type: string; 
      value: string | number 
    }> = [];
    
    if (attributesString) {
      try {
        attributes = JSON.parse(attributesString);
      } catch (error) {
        console.warn('Failed to parse attributes:', error);
        // Don't fail the upload, just continue without attributes
      }
    }

    // Prepare metadata following OpenSea standard
    const metadata = {
      name,
      description,
      // Add any additional metadata fields
      external_url: "", // Could be a link to agent details page
      background_color: "000000", // Hex color without #
      ...(attributes.length > 0 && { attributes }),
      // Add AI Agent specific metadata
      agent_type: "AI Assistant",
      version: "1.0",
      created_at: new Date().toISOString(),
    };

    // Upload to Filebase/IPFS
    const result = await uploadNFTToFilebase(image, metadata, bucketName);

    return result;
  } catch (error) {
    console.error('Server action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}