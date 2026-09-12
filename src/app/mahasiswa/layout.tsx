import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Mahasiswa & Struktur Kelas',
  description:
    'Daftar lengkap anggota mahasiswa, NIM, dan pengurus Kelas Hukum Keluarga A 2025 Fakultas Syariah UIN Siber Cirebon.',
};

export default function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
