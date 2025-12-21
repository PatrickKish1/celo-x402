/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDownIcon } from 'lucide-react';
import { squidRouter, type SquidToken } from '@/lib/squid-router';

interface TokenSelectorProps {
  chainId: string;
  tokens: SquidToken[];
  selectedTokenAddress: string;
  onSelectToken: (token: SquidToken) => void;
  onLoadTokens: (chainId: string) => Promise<SquidToken[]>;
  dropdownRef?: React.RefObject<HTMLDivElement>;
}

export function TokenSelector({
  chainId,
  tokens,
  selectedTokenAddress,
  onSelectToken,
  onLoadTokens,
  dropdownRef,
}: TokenSelectorProps) {
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

  const selectedToken = tokens.find(t => t.address === selectedTokenAddress);

  const filteredTokens = tokens.filter(token => {
    const searchLower = search.toLowerCase();
    return token.symbol.toLowerCase().includes(searchLower) ||
           token.name.toLowerCase().includes(searchLower) ||
           token.address.toLowerCase().includes(searchLower);
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={async () => {
          if (tokens.length === 0) {
            await onLoadTokens(chainId);
          }
          setShowDropdown(!showDropdown);
        }}
        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedToken?.logoURI && (
            <Image
              src={selectedToken.logoURI}
              alt={selectedToken.symbol}
              width={20}
              height={20}
              className="rounded-full flex-shrink-0"
              unoptimized
            />
          )}
          <span className="truncate">
            {selectedToken
              ? `${selectedToken.symbol} - ${selectedToken.name}`
              : tokens.length === 0 ? 'Loading tokens...' : 'Select a token...'}
          </span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {tokens.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Loading tokens...
            </div>
          ) : (
            <>
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  autoFocus
                />
              </div>
              {filteredTokens.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No tokens found
                </div>
              ) : (
                filteredTokens.map(token => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => {
                      onSelectToken(token);
                      setShowDropdown(false);
                      setSearch('');
                    }}
                    className={`w-full p-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 flex items-center gap-3 ${
                      selectedTokenAddress === token.address ? 'bg-blue-50' : ''
                    }`}
                  >
                    {token.logoURI && (
                      <Image
                        src={token.logoURI}
                        alt={token.symbol}
                        width={24}
                        height={24}
                        className="rounded-full flex-shrink-0"
                        unoptimized
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{token.symbol}</div>
                      <div className="text-xs text-gray-500 truncate">{token.name}</div>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

