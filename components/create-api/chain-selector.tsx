/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDownIcon, XIcon } from 'lucide-react';
import { squidRouter, type SquidChain } from '@/lib/squid-router';

interface ChainSelectorProps {
  chains: SquidChain[];
  selectedChains: Array<{
    chainId: string;
    chainName: string;
    networkName: string;
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    tokenName: string;
  }>;
  loadingChains: boolean;
  onAddChain: (chainId: string) => Promise<void>;
  onRemoveChain: (chainId: string) => void;
  dropdownRef?: React.RefObject<HTMLDivElement>;
}

export function ChainSelector({
  chains,
  selectedChains,
  loadingChains,
  onAddChain,
  onRemoveChain,
  dropdownRef,
}: ChainSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = dropdownRef || internalRef;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  const filteredChains = chains
    .filter(chain => {
      const networkName = (chain as any).networkName || chain.chainName;
      const searchLower = search.toLowerCase();
      return !selectedChains.some(c => c.chainId === chain.chainId) &&
             (networkName.toLowerCase().includes(searchLower) ||
              chain.chainId.includes(searchLower));
    })
    .sort((a, b) => {
      const aName = (a as any).networkName || a.chainName;
      const bName = (b as any).networkName || b.chainName;
      return aName.localeCompare(bName);
    });

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loadingChains}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
      >
        <span className="text-gray-600">
          {selectedChains.length > 0 
            ? selectedChains.map(c => c.networkName).join(', ')
            : 'Select a chain to add...'}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search chains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredChains.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No chains found
              </div>
            ) : (
              filteredChains.map(chain => {
                const networkName = (chain as any).networkName || chain.chainName;
                const chainIcon = (chain as any).chainIconURI;
                
                return (
                  <button
                    key={chain.chainId}
                    type="button"
                    onClick={async () => {
                      await onAddChain(chain.chainId);
                      setShowDropdown(false);
                      setSearch('');
                    }}
                    className="w-full p-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 flex items-center gap-3"
                  >
                    {chainIcon && (
                      <Image
                        src={chainIcon}
                        alt={networkName}
                        width={24}
                        height={24}
                        className="rounded-full flex-shrink-0"
                        unoptimized
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{networkName}</div>
                      <div className="text-xs text-gray-500">Chain ID: {chain.chainId}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

