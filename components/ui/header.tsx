'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { WalletButton, NetworkSwitcher } from '@/components/wallet-button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Responsive */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <Image 
              src="/1x402.png" 
              alt="x402 Logo" 
              width={32}
              height={32}
              className="h-6 w-6 sm:h-8 sm:w-8"
            />
            <span className="text-lg sm:text-xl font-bold font-mono tracking-wider">
              X402
              <span className="hidden sm:inline"> MANAGER</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6">
            <Link
              href="/discover"
              className="font-mono text-xs lg:text-sm font-medium hover:underline tracking-wide transition-all whitespace-nowrap"
            >
              DISCOVER APIS
            </Link>
            <Link
              href="/discover/servers"
              className="font-mono text-xs lg:text-sm font-medium hover:underline tracking-wide transition-all whitespace-nowrap"
            >
              SERVERS
            </Link>
            <Link
              href="/ecosystem"
              className="font-mono text-xs lg:text-sm font-medium hover:underline tracking-wide transition-all whitespace-nowrap"
            >
              ECOSYSTEM
            </Link>
            <Link
              href="/dashboard"
              className="font-mono text-xs lg:text-sm font-medium hover:underline tracking-wide transition-all whitespace-nowrap"
            >
              DASHBOARD
            </Link>
            <Link
              href="/docs"
              className="font-mono text-xs lg:text-sm font-medium hover:underline tracking-wide transition-all whitespace-nowrap"
            >
              DOCS
            </Link>
          </nav>

          {/* Desktop Wallet Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <NetworkSwitcher />
            <WalletButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden retro-button bg-black text-white px-2 py-1.5 text-sm min-w-[40px]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t-2 border-black pt-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/discover"
                className="font-mono text-sm font-medium hover:underline tracking-wide"
                onClick={() => setMobileMenuOpen(false)}
              >
                DISCOVER APIS
              </Link>
              <Link
                href="/discover/servers"
                className="font-mono text-sm font-medium hover:underline tracking-wide"
                onClick={() => setMobileMenuOpen(false)}
              >
                SERVERS
              </Link>
              <Link
                href="/ecosystem"
                className="font-mono text-sm font-medium hover:underline tracking-wide"
                onClick={() => setMobileMenuOpen(false)}
              >
                ECOSYSTEM
              </Link>
              <Link
                href="/dashboard"
                className="font-mono text-sm font-medium hover:underline tracking-wide"
                onClick={() => setMobileMenuOpen(false)}
              >
                DASHBOARD
              </Link>
              <Link
                href="/docs"
                className="font-mono text-sm font-medium hover:underline tracking-wide"
                onClick={() => setMobileMenuOpen(false)}
              >
                DOCUMENTATION
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-300">
                <NetworkSwitcher />
                <WalletButton />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
