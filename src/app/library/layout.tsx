import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'E-Library & Repositori Tugas',
  description:
    'Perpustakaan digital, modul, silabus, dan repositori berkas tugas mahasiswa Kelas HK A 2025 UIN Siber Cirebon.',
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
