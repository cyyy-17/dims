import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#4F46E5',
};

export const metadata: Metadata = {
  title: 'DIMS — Dormitory & Inventory Management System | ASR Campus',
  description:
    'Management system for school dormitory residents, physical assets custody, and campus communications at ASR Field Campus.',
  keywords: ['dormitory management', 'inventory system', 'DIMS', 'ASR campus', 'FAITH'],
  openGraph: {
    title: 'DIMS — ASR Dormitory & Inventory System',
    description: 'Unified management for dormitory residents and physical asset custody.',
    type: 'website',
    locale: 'en_PH',
  },
  robots: {
    index: false,
    follow: false,
  },
};

import { ToastProvider } from '@/components/ui/Toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F8F8F6] text-[#2C2C2A]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
