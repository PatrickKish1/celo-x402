'use client';

import Link from 'next/link';
import { WalletButton } from './wallet-button';

export function Header() {
  return (
    <header className="border-b-2 border-black bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/1x402.png" 
              alt="x402 Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold font-mono tracking-wider">
              X402 MANAGER
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/discover"
              className="font-mono text-sm font-medium hover:underline tracking-wide"
            >
              DISCOVER APIS
            </Link>
            <Link
              href="/dashboard"
              className="font-mono text-sm font-medium hover:underline tracking-wide"
            >
              DASHBOARD
            </Link>
            <Link
              href="/docs"
              className="font-mono text-sm font-medium hover:underline tracking-wide"
            >
              DOCUMENTATION
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}
