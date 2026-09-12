import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Penanggung Jawab (PJ) Mata Kuliah',
  description:
    'Daftar Penanggung Jawab (PJ) 11 mata kuliah aktif Kelas Hukum Keluarga A 2025 UIN Siber Cirebon.',
};

export default function PjLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
