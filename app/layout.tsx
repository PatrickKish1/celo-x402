/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'x402 Manager - API Monetization Platform',
  description: 'Professional platform for managing and discovering x402 APIs with seamless integration and comprehensive analytics.',
  icons: {
    icon: '/1x402.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
