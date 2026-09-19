import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'DIMS — Dormitory & Inventory Management System | ASR Campus',
  description:
    'Award-winning minimalist management system for school dormitory residents (students, employees, visitors), physical assets, and Brevo bulk email notices.',
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
