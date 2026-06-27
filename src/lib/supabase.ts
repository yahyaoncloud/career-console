import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. File uploads will be unavailable.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnon || '');

/** Default Bucket name in Supabase Storage */
export const STORAGE_BUCKET = 'career-assets';
export const BUCKETS = ['career-assets', 'career-profile', 'career-resume'];

/**
 * Upload a file to Supabase Storage.
 * Returns { url, path } on success, throws on error.
 */
export async function uploadFile(file: File, folder = 'documents', bucket = STORAGE_BUCKET): Promise<{ url: string; path: string; size: string }> {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  const sizeKb = file.size / 1024;
  const size = sizeKb >= 1024
    ? `${(sizeKb / 1024).toFixed(1)} MB`
    : `${sizeKb.toFixed(0)} KB`;

  return { url: data.publicUrl, path, size };
}

/**
 * Delete a file from Supabase Storage by its storage path.
 */
export async function deleteFile(storagePath: string, bucket = STORAGE_BUCKET): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
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
