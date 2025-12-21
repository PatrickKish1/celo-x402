/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useRef } from 'react';
import { XIcon } from 'lucide-react';
import { ChainSelector } from './chain-selector';
import { TokenSelector } from './token-selector';
import { squidRouter, type SquidChain, type SquidToken } from '@/lib/squid-router';

interface PricingConfigurationProps {
  basePrice: string;
  selectedChains: Array<{
    chainId: string;
    chainName: string;
    networkName: string;
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    tokenName: string;
  }>;
  chains: SquidChain[];
  tokensByChain: Map<string, SquidToken[]>;
  loadingChains: boolean;
  onBasePriceChange: (price: string) => void;
  onAddChain: (chainId: string) => Promise<void>;
  onRemoveChain: (chainId: string) => void;
  onUpdateChainToken: (chainId: string, token: SquidToken) => void;
  onLoadTokens: (chainId: string) => Promise<SquidToken[]>;
  onApplyToAll: () => void;
}

export function PricingConfiguration({
  basePrice,
  selectedChains,
  chains,
  tokensByChain,
  loadingChains,
  onBasePriceChange,
  onAddChain,
  onRemoveChain,
  onUpdateChainToken,
  onLoadTokens,
  onApplyToAll,
}: PricingConfigurationProps) {
  const chainDropdownRef = useRef<HTMLDivElement>(null);
  const tokenDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Default Pricing Configuration</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
          <input
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => onBasePriceChange(e.target.value)}
            placeholder="0.05"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Default price for all chains (can be overridden per chain)</p>
        </div>

        {/* Add Chain Button */}
        <div className="flex items-center gap-4">
          <label className="block text-sm font-medium text-gray-700">Supported Chains</label>
          <ChainSelector
            chains={chains}
            selectedChains={selectedChains}
            loadingChains={loadingChains}
            onAddChain={onAddChain}
            onRemoveChain={onRemoveChain}
            dropdownRef={chainDropdownRef}
          />
        </div>

        {/* Selected Chains */}
        {selectedChains.length > 0 && (
          <div className="space-y-3">
            {selectedChains.map((chainConfig) => {
              const tokens = tokensByChain.get(chainConfig.chainId) || [];
              
              return (
                <div key={chainConfig.chainId} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{chainConfig.networkName}</h4>
                      <p className="text-xs text-gray-500">Chain ID: {chainConfig.chainId}</p>
                    </div>
                    <button
                      onClick={() => onRemoveChain(chainConfig.chainId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Token</label>
                    <div ref={(el) => { tokenDropdownRefs.current[chainConfig.chainId] = el; }}>
                      <TokenSelector
                        chainId={chainConfig.chainId}
                        tokens={tokens}
                        selectedTokenAddress={chainConfig.tokenAddress}
                        onSelectToken={(token) => onUpdateChainToken(chainConfig.chainId, token)}
                        onLoadTokens={onLoadTokens}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Address: {chainConfig.tokenAddress}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedChains.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p>No chains selected. Add a chain to configure pricing.</p>
            <p className="text-xs mt-1">Supports EVM chains, Solana, Cosmos, and more via Squid Router</p>
          </div>
        )}

        <button
          onClick={onApplyToAll}
          disabled={selectedChains.length === 0}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply to All Endpoints
        </button>
      </div>
    </div>
  );
}

