import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kelas-hk-a-uinssc-2025.vercel.app'),
  title: {
    default: 'Portal Kelas HK A 2025 | UIN Siber Syekh Nurjati Cirebon',
    template: '%s | HK A 2025 UIN Siber Cirebon',
  },
  description:
    'Portal Resmi Kelas Hukum Keluarga A 2025, Fakultas Syariah, UIN Siber Syekh Nurjati Cirebon (Cyber Islamic University). Presensi digital, jadwal perkuliahan, repositori materi, dan video conference kuliah online.',
  keywords: [
    'Hukum Keluarga A 2025',
    'HK A 2025',
    'UIN Siber Syekh Nurjati Cirebon',
    'UINSSC',
    'Cyber Islamic University',
    'Fakultas Syariah UIN Cirebon',
    'Presensi Kelas HK A',
    'Portal HK A 2025',
    'Kuliah Online HK A',
  ],
  authors: [{ name: 'Pengurus Kelas HK A 2025' }],
  creator: 'Kelas Hukum Keluarga A 2025',
  publisher: 'UIN Siber Syekh Nurjati Cirebon',
  alternates: {
    canonical: 'https://kelas-hk-a-uinssc-2025.vercel.app',
  },
  openGraph: {
    title: 'Portal Kelas HK A 2025 | UIN Siber Syekh Nurjati Cirebon',
    description:
      'Sistem Informasi Akademik, Presensi Digital & Repositori 11 Mata Kuliah Kelas Hukum Keluarga A 2025, Fakultas Syariah, UIN Siber Syekh Nurjati Cirebon.',
    url: 'https://kelas-hk-a-uinssc-2025.vercel.app',
    siteName: 'Portal Kelas HK A 2025',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Logo Resmi Kelas HK A 2025',
      },
    ],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      'cUPEHbfq_JqOjvcE0H_NeWWkGZz4QtY2WUrnHYE7DEQ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Portal Kelas HK A 2025',
  alternateName: [
    'Kelas HK A 2025',
    'Kelas HK A 2025 UIN Siber Cirebon',
    'Hukum Keluarga A 2025',
    'Portal Akademik HK A 2025',
  ],
  url: 'https://kelas-hk-a-uinssc-2025.vercel.app',
  description:
    'Portal Resmi Kelas Hukum Keluarga A 2025, Fakultas Syariah, UIN Siber Syekh Nurjati Cirebon.',
  publisher: {
    '@type': 'EducationalOrganization',
    name: 'UIN Siber Syekh Nurjati Cirebon',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`w-full ${jakarta.variable}`}>
      <head>
        <meta
          name="google-site-verification"
          content="cUPEHbfq_JqOjvcE0H_NeWWkGZz4QtY2WUrnHYE7DEQ"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${jakarta.className} min-h-screen w-full overflow-x-hidden flex flex-col bg-white text-stone-900 antialiased selection:bg-[#9d5f2f]/20 selection:text-[#753e1f] font-sans`}>
        <Navbar />
        <main className="flex-1 w-full flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
