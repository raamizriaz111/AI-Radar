import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://airadar.dev';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'AI Radar — Real-Time AI Intelligence & Horizon',
    template: '%s · AI Radar',
  },
  description:
    'Your personal intelligence layer for the rapidly changing AI ecosystem. Track verified AI news, tools, models, research, trends, and career opportunities.',
  keywords: [
    'AI intelligence',
    'artificial intelligence',
    'AI research',
    'AI tools',
    'AI models',
    'machine learning',
    'frontier models',
    'coding agents',
  ],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'AI Radar — Real-Time AI Intelligence & Horizon',
    description:
      'Verified primary source intelligence on foundation models, AI developer tools, and emerging trends — plain English executive synthesis.',
    url: appUrl,
    siteName: 'AI Radar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Radar — Real-Time AI Intelligence',
    description:
      'The signal layer for the rapidly changing AI world. Zero hype, primary source citations, plain-English synthesis.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
