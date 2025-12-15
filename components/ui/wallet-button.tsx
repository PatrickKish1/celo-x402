/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle dropdown close
  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
  };

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
      >
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'WALLET CONNECTED'}
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
                    Wallet
                  </div>
                  <div className="font-mono text-sm text-gray-600 block truncate">
                    {address || 'No address'}
                  </div>
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
