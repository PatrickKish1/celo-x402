/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import '@reown/appkit-wallet-button/react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useEffect, useState, useMemo } from 'react';
import { lookupENS } from '@/lib/ens-utils';

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected, embeddedWalletInfo } = useAppKitAccount();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoadingENS, setIsLoadingENS] = useState(false);
  
  // Try to extract user info from embeddedWalletInfo if available
  // Note: embeddedWalletInfo may not always be available or may have different structure
  const userInfo = useMemo(() => {
    if (!embeddedWalletInfo) return null;
    
    try {
      const info = embeddedWalletInfo as any;
      return {
        email: info?.email || null,
        name: info?.name || info?.displayName || info?.username || null,
      };
    } catch {
      return null;
    }
  }, [embeddedWalletInfo]);

  // Lookup ENS name when address changes
  useEffect(() => {
    if (!isConnected || !address) {
      setEnsName(null);
      return;
    }

    let cancelled = false;

    async function fetchENS() {
      setIsLoadingENS(true);
      try {
        const result = await lookupENS(`${address}`);
        if (!cancelled && result.name) {
          setEnsName(result.name);
        } else if (!cancelled) {
          setEnsName(null);
        }
      } catch (error) {
        console.error('Error fetching ENS name:', error);
        if (!cancelled) {
          setEnsName(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingENS(false);
        }
      }
    }

    fetchENS();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  // Get display name - priority: ENS > Email/Name from SSO > Address
  const displayName = useMemo(() => {
    if (!isConnected || !address) {
      return null;
    }

    // Priority 1: ENS name
    if (ensName) {
      return ensName;
    }

    // Priority 2: Email or name from embedded wallet (SSO login)
    if (userInfo) {
      if (userInfo.email) {
        // Show email username part (before @)
        const emailUsername = userInfo.email.split('@')[0];
        return emailUsername;
      }
      
      if (userInfo.name) {
        return userInfo.name;
      }
    }

    // Priority 3: Truncated address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [isConnected, address, ensName, userInfo]);

  return (
    <div className="relative">
      <button
        onClick={() => open()}
        className="retro-button bg-black text-white hover:bg-white hover:text-black"
        title={
          isConnected && address
            ? ensName
              ? `${ensName} (${address})`
              : userInfo
              ? `${displayName} (${address})`
              : address
            : 'Connect Wallet'
        }
      >
        {isConnected && address 
          ? (
            <span className="hidden sm:inline">
              {isLoadingENS ? (
                `${address.slice(0, 6)}...${address.slice(-4)}`
              ) : (
                displayName || `${address.slice(0, 6)}...${address.slice(-4)}`
              )}
            </span>
          )
          : <><span className="hidden sm:inline">CONNECT </span>WALLET</>
        }
      </button>
    </div>
  );
}

// Alternative: Use AppKit's built-in button component
export function ReownWalletButton() {
  return <appkit-button />;
}

// Custom styled button with balance
export function WalletButtonWithBalance() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  return (
    <button
      onClick={() => open()}
      className="retro-button bg-black text-white hover:bg-white hover:text-black flex items-center gap-2"
    >
      {isConnected && address ? (
        <>
          <span className="hidden sm:inline">Connected:</span>
          <span className="font-bold">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">🔗</span>
          <span>CONNECT WALLET</span>
        </>
      )}
    </button>
  );
}

// Network switcher button
export function NetworkSwitcher() {
  const { open } = useAppKit();

  return (
    <button
      onClick={() => open({ view: 'Networks' })}
      className="retro-button bg-gray-100 text-gray-900 hover:bg-black hover:text-white"
    >
      <span className="hidden lg:inline">Switch </span>Network
    </button>
  );
}

