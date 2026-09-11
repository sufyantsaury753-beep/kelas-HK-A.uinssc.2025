import { supabase, isSupabaseConfigured } from './supabase';

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function detectFileType(fileName: string): 'PDF' | 'DOCX' | 'PPTX' | 'LINK' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'doc' || ext === 'docx') return 'DOCX';
  if (ext === 'ppt' || ext === 'pptx') return 'PPTX';
  return 'LINK';
}

export async function uploadLibraryFile(
  file: File,
  folder: string = 'general'
): Promise<{ url: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { url: '', error: 'Koneksi Supabase belum terkonfigurasi.' };
  }

  try {
    const ext = file.name.split('.').pop() || '';
    const baseName = file.name
      .substring(0, file.name.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const cleanFileName = `${Date.now()}_${baseName}.${ext}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('library-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Storage upload error:', error);
      const msg = error.message?.toLowerCase() || '';
      if (
        msg.includes('not found') ||
        (error as any)?.statusCode === '404' ||
        (error as any)?.error === 'Bucket not found'
      ) {
        return {
          url: '',
          error:
            'Bucket "library-files" belum dibuat di Supabase Storage. Silakan buka menu Storage di Supabase dan buat bucket public bernama "library-files".',
        };
      }
      return { url: '', error: `Gagal upload berkas: ${error.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('library-files')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return { url: '', error: 'Gagal mengambil URL publik berkas.' };
    }

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return { url: '', error: err?.message || 'Terjadi kesalahan sistem saat mengunggah.' };
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
