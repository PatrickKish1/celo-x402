/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { squidRouter, SquidChain } from '@/lib/squid-router';

export interface ChainSelectorProps {
  selectedChainId?: string;
  onChainSelect: (chain: SquidChain | null) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
  externalApiUrl?: string; // Optional external API for chain list
}

/**
 * Exportable Chain Selector Component
 * Can be used independently or integrated into payment flows
 */
export function ChainSelector({
  selectedChainId,
  onChainSelect,
  className = '',
  label = 'SELECT CHAIN',
  disabled = false,
  externalApiUrl,
}: ChainSelectorProps) {
  const [chains, setChains] = useState<SquidChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadChains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let chainsData: SquidChain[] = [];

      // Try external API first if provided
      if (externalApiUrl) {
        try {
          const response = await fetch(externalApiUrl);
          if (response.ok) {
            const data = await response.json();
            chainsData = data.chains || data || [];
          }
        } catch (err) {
          console.warn('External API failed, falling back to Squid:', err);
        }
      }

      // Fallback to Squid Router API
      if (chainsData.length === 0) {
        chainsData = await squidRouter.getChains();
      }

      setChains(chainsData);
    } catch (err: any) {
      console.error('Error loading chains:', err);
      setError(err?.message || 'Failed to load chains');
    } finally {
      setLoading(false);
    }
  }, [externalApiUrl]);

  
  useEffect(() => {
    loadChains();
  }, [externalApiUrl, loadChains]);


  const filteredChains = chains.filter(chain =>
    chain?.chainName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chain?.networkName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChain = chains.find(c => c?.chainId === selectedChainId);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block font-mono font-bold text-sm">
        {label}
      </label>
      
      {searchTerm && chains.length > 5 && (
        <input
          type="text"
          placeholder="Search chains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="retro-input w-full text-sm"
          disabled={disabled}
        />
      )}

      {loading ? (
        <div className="text-sm font-mono text-gray-600">Loading chains...</div>
      ) : error ? (
        <div className="text-sm font-mono text-red-600">{error}</div>
      ) : (
        <select
          value={selectedChainId || ''}
          onChange={(e) => {
            const chain = chains.find(c => c?.chainId === e.target.value);
            onChainSelect(chain || null);
          }}
          className="retro-input w-full"
          disabled={disabled}
        >
          <option value="">Choose a chain...</option>
          {filteredChains.map(chain => (
            <option key={chain?.chainId} value={chain?.chainId}>
              {chain?.chainName || chain?.networkName || chain?.chainId}
            </option>
          ))}
        </select>
      )}

      {selectedChain && (
        <div className="text-xs text-gray-600 font-mono mt-1">
          {selectedChain?.chainName} ({selectedChain?.chainId})
        </div>
      )}
    </div>
  );
}

