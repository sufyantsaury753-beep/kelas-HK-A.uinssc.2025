import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Portal Kelas HK A 2025 | UIN Siber Syekh Nurjati Cirebon',
  description: 'Sistem Informasi Akademik, Presensi Digital & Repositori 11 Mata Kuliah Kelas Hukum Keluarga A 2025, Fakultas Syariah, UIN Siber Syekh Nurjati Cirebon.',
  keywords: ['Hukum Keluarga A 2025', 'HK A 2025', 'UIN Siber Syekh Nurjati Cirebon', 'Cyber Islamic University', 'Presensi Kelas HK A'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#fbf8f5] text-stone-800 antialiased selection:bg-amber-200 selection:text-amber-900">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
