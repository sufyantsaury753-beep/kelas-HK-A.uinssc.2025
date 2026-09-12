import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk Portal Kelas',
  description:
    'Halaman masuk mahasiswa dan admin sistem informasi Kelas HK A 2025.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
