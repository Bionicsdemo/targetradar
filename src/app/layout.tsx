import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'TargetRadar — Drug Target Validation in 30 Seconds',
  description: 'Free, open-source drug target validation platform. Analyze any gene target across 7 dimensions — including AlphaGenome regulatory genomics — with AI-powered insights. Break the barrier of $50-200K/year enterprise tools.',
  keywords: ['drug target', 'target validation', 'drug discovery', 'bioinformatics', 'AI', 'open source'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0F172A]`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
