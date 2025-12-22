import path from 'path';
import { randomUUID } from 'crypto';
import { getSupabaseServiceClient } from '@lib/supabase';

export interface UploadImageParams {
  bucket: string;
  fileBuffer: Buffer;
  originalName: string;
  mimeType: string;
}

/**
 * Uploads an image file buffer to a Supabase storage bucket and returns
 * the public URL for the uploaded file.
 */
export const uploadImageToBucket = async ({
  bucket,
  fileBuffer,
  originalName,
  mimeType
}: UploadImageParams): Promise<string> => {
  const supabase = getSupabaseServiceClient();

  const ext = path.extname(originalName) || '.jpg';
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, fileBuffer, {
    cacheControl: '3600',
    upsert: false,
    contentType: mimeType
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return data.publicUrl;
};

export interface DeleteImageByUrlParams {
  bucket: string;
  url: string;
}

/**
 * Deletes a stored image given its public URL. This helper is resilient and
 * will throw only for clear Supabase errors; callers may choose to swallow
 * errors if deletion should be best-effort.
 */
export const deleteImageFromBucketByUrl = async ({
  bucket,
  url
}: DeleteImageByUrlParams): Promise<void> => {
  const supabase = getSupabaseServiceClient();

  // Expect URLs containing `/{bucket}/{path}` but be defensive.
  const marker = `${bucket}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    throw new Error('Unable to extract file path from image URL');
  }

  const filePath = url.slice(index + marker.length).split('?')[0];

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    throw error;
  }
};

