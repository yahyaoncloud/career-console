import { authFetch } from '../lib/api';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. File uploads will be unavailable.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnon || '');

/** Default Bucket name in Supabase Storage */
export const STORAGE_BUCKET = 'career-assets';
export const BUCKETS = ['career-assets', 'documents', 'authors'];

/**
 * Upload a file to Supabase Storage.
 * Returns { url, path } on success, throws on error.
 */
export async function uploadFile(file: File, folder = 'documents', bucket = STORAGE_BUCKET, explicitFileName?: string): Promise<{ url: string; path: string; size: string }> {
  const ext = file.name.split('.').pop();
  const path = explicitFileName ? `${folder}/${explicitFileName}` : `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // 1. Get Presigned URL from backend proxy
  const res = await authFetch('/api/s3/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: path,
      contentType: file.type || 'application/octet-stream',
      bucket
    })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to get presigned URL');

  // 2. Upload file directly to S3 using the presigned URL
  const uploadRes = await authFetch(data.presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed: ${uploadRes.statusText}`);
  }

  const sizeKb = file.size / 1024;
  const size = sizeKb >= 1024
    ? `${(sizeKb / 1024).toFixed(1)} MB`
    : `${sizeKb.toFixed(0)} KB`;

  return { url: data.publicUrl, path, size };
}

export async function deleteFile(storagePath: string, bucket = STORAGE_BUCKET): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Get the public URL for a file stored in Supabase Storage.
 * If the path is already a full URL, it returns it directly.
 */
export function getPublicUrl(path: string, bucket = STORAGE_BUCKET): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const url = supabaseUrl || 'https://olxnluwjpkboskbjsmlj.supabase.co';
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Track the total storage size used across all managed buckets.
 * Calculates MB against the 50MB Supabase free tier.
 */
export async function getStorageUsage(): Promise<number> {
  let totalBytes = 0;
  for (const bucket of BUCKETS) {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'asc' },
    });
    
    // Fallback recursive structure logic if folders are used.
    // In our simplified setup, most files are just at the top or in 1 folder depth.
    // For exact tracking, server-side APIs are better, but client-side list() 
    // will grab the first 100 objects (including folders, which have no size).
    
    if (data && !error) {
      for (const item of data) {
        if (item.metadata && item.metadata.size) {
          totalBytes += item.metadata.size;
        } else if (item.id === null) {
           // It's a folder, we need to list inside it
           const { data: folderData } = await supabase.storage.from(bucket).list(item.name);
           if (folderData) {
             for (const sub of folderData) {
               if (sub.metadata && sub.metadata.size) {
                 totalBytes += sub.metadata.size;
               }
             }
           }
        }
      }
    }
  }
  
  return totalBytes / (1024 * 1024); // Return in MB
}
