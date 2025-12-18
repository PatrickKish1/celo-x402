/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useAppKit, useAppKitAccount, useWalletInfo } from '@reown/appkit/react';
import { lookupENS } from '@/lib/ens-utils';

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected, embeddedWalletInfo } = useAppKitAccount();
  const { walletInfo } = useWalletInfo();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoadingENS, setIsLoadingENS] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle dropdown close
  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
  };

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
        const result = await lookupENS(address || '');
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
    if (embeddedWalletInfo) {
      const email = (embeddedWalletInfo as any)?.email;
      const name = (embeddedWalletInfo as any)?.name || (embeddedWalletInfo as any)?.displayName;
      
      if (email) {
        const emailUsername = email.split('@')[0];
        return emailUsername;
      }
      
      if (name) {
        return name;
      }
    }

    // Priority 3: Truncated address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [isConnected, address, ensName, embeddedWalletInfo]);

  // Get user email for display in dropdown
  const userEmail = useMemo(() => {
    if (embeddedWalletInfo) {
      return (embeddedWalletInfo as any)?.email || null;
    }
    return null;
  }, [embeddedWalletInfo]);

  // Get user name for display in dropdown
  const userName = useMemo(() => {
    if (embeddedWalletInfo) {
      return (embeddedWalletInfo as any)?.name || (embeddedWalletInfo as any)?.displayName || null;
    }
    return null;
  }, [embeddedWalletInfo]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isConnected) {
    return (
      <button 
        onClick={() => open()}
        className="retro-button px-6 py-2"
      >
        CONNECT WALLET
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="retro-button px-6 py-2 bg-green-100 text-green-800"
        onClick={handleDropdownToggle}
        title={
          address
            ? ensName
              ? `${ensName} (${address})`
              : userEmail
              ? `${userEmail} (${address})`
              : address
            : 'Wallet Connected'
        }
      >
        {address 
          ? isLoadingENS 
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : displayName || `${address.slice(0, 6)}...${address.slice(-4)}`
          : 'WALLET CONNECTED'}
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <div className="retro-card min-w-80 p-0 bg-white border-2 border-black">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {address ? address.slice(0, 2).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold text-base block">
                    {ensName || userName || userEmail || 'Wallet'}
                  </div>
                  <div className="font-mono text-sm text-gray-600 block truncate">
                    {ensName ? (
                      <span title={address}>{ensName}</span>
                    ) : userEmail ? (
                      <span title={address}>{userEmail}</span>
                    ) : userName ? (
                      <span title={address}>{userName}</span>
                    ) : (
                      address || 'No address'
                    )}
                  </div>
                  {address && (ensName || userEmail || userName) && (
                    <div className="font-mono text-xs text-gray-400 block truncate mt-1">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t-2 border-black pt-3 mb-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(address || '');
                    handleDropdownClose();
                  }}
                  className="font-mono text-sm font-bold hover:underline"
                >
                  Copy Address
                </button>
              </div>
            </div>
            
            <div className="border-t-2 border-black pt-3">
              <button
                onClick={() => {
                  window.open('https://reown.com', '_blank');
                  handleDropdownClose();
                }}
                className="block w-full text-left px-4 py-3 font-mono text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              >
                MANAGE WALLET
              </button>
              
              <button
                onClick={() => {
                  open({ view: 'Account' });
                  handleDropdownClose();
                }}
                className="block w-full text-left px-4 py-3 font-mono text-sm hover:bg-gray-100 text-red-600 transition-colors cursor-pointer"
              >
                DISCONNECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
