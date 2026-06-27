import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. File uploads will be unavailable.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnon || '');

/** Bucket name in Supabase Storage for career-console assets */
export const STORAGE_BUCKET = 'career-assets';

/**
 * Upload a file to Supabase Storage.
 * Returns { url, path } on success, throws on error.
 */
export async function uploadFile(file: File, folder = 'documents'): Promise<{ url: string; path: string; size: string }> {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  const sizeKb = file.size / 1024;
  const size = sizeKb >= 1024
    ? `${(sizeKb / 1024).toFixed(1)} MB`
    : `${sizeKb.toFixed(0)} KB`;

  return { url: data.publicUrl, path, size };
}

/**
 * Delete a file from Supabase Storage by its storage path.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
