import { supabase, isSupabaseConfigured } from './supabase';

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function detectFileType(fileName: string): 'PDF' | 'DOCX' | 'PPTX' | 'IMG' | 'LINK' | 'DRIVE' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'doc' || ext === 'docx') return 'DOCX';
  if (ext === 'ppt' || ext === 'pptx') return 'PPTX';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'IMG';
  return 'LINK';
}

export async function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.75
): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  // Jika sudah sangat kecil (< 250 KB), tidak perlu dikompres
  if (file.size <= 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const compressedName = file.name.replace(/\.[^/.]+$/, '.jpg');
          const compressedFile = new File([blob], compressedName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          console.log(
            `Auto-compress gambar: ${formatFileSize(file.size)} -> ${formatFileSize(compressedFile.size)}`
          );
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export async function uploadLibraryFile(
  file: File,
  folder: string = 'general',
  onCompressProgress?: (status: string) => void
): Promise<{ url: string; file?: File; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { url: '', file, error: 'Koneksi Supabase belum terkonfigurasi.' };
  }

  try {
    let fileToUpload = file;
    if (file.type.startsWith('image/') && file.size > 250 * 1024) {
      if (onCompressProgress) onCompressProgress('Mengompres resolusi gambar...');
      fileToUpload = await compressImageFile(file);
    }

    const ext = fileToUpload.name.split('.').pop() || '';
    const baseName = fileToUpload.name
      .substring(0, fileToUpload.name.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const cleanFileName = `${Date.now()}_${baseName}.${ext}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('library-files')
      .upload(filePath, fileToUpload, {
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
          file: fileToUpload,
          error:
            'Bucket "library-files" belum dibuat di Supabase Storage. Silakan buka menu Storage di Supabase dan buat bucket public bernama "library-files".',
        };
      }
      return { url: '', file: fileToUpload, error: `Gagal upload berkas: ${error.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('library-files')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return { url: '', error: 'Gagal mengambil URL publik berkas.' };
    }

    return { url: publicUrlData.publicUrl, file: fileToUpload };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return { url: '', file, error: err?.message || 'Terjadi kesalahan sistem saat mengunggah.' };
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
