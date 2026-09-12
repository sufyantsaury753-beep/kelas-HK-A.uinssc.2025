import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kuliah Online & Video Conference',
  description:
    'Akses perkuliahan daring, tautan Google Meet, Zoom, dan jadwal perkuliahan interaktif Kelas HK A 2025 UIN Siber Syekh Nurjati Cirebon.',
};

export default function KuliahOnlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
