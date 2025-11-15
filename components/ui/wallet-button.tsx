'use client';

import { useEffect, useState, useRef } from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

export function WalletButton() {
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

  return (
    <Wallet>
      <ConnectWallet>
        {({ isConnected, address, disconnect }) => {
          if (!isConnected) {
            return (
              <button className="retro-button px-6 py-2">
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
                    <Identity className="px-4 pt-4 pb-3" hasCopyAddressOnClick>
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10" />
                        <div className="flex-1 min-w-0">
                          <Name className="font-mono font-bold text-base block" />
                          <Address className="font-mono text-sm text-gray-600 block truncate" />
                        </div>
                      </div>
                      <div className="border-t-2 border-black pt-3 mb-3">
                        <EthBalance className="font-mono text-sm font-bold" />
                      </div>
                    </Identity>
                    
                    <div className="border-t-2 border-black pt-3">
                      <button
                        onClick={() => {
                          window.open('https://keys.coinbase.com', '_blank');
                          handleDropdownClose();
                        }}
                        className="block w-full text-left px-4 py-3 font-mono text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        MANAGE WALLET
                      </button>
                      
                      <button
                        onClick={() => {
                          disconnect();
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
        }}
      </ConnectWallet>
    </Wallet>
  );
}
