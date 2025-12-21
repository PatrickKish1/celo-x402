/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  TrashIcon, 
  PlayIcon, 
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import type { EnhancedEndpoint } from '@/lib/types/endpoint';
import { TokenSelector } from './token-selector';
import { squidRouter, type SquidChain, type SquidToken } from '@/lib/squid-router';

interface EndpointCardProps {
  endpoint: EnhancedEndpoint;
  baseUrl: string;
  apiType: 'existing' | 'native';
  defaultPricing: {
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
  };
  chains: SquidChain[];
  tokensByChain: Map<string, SquidToken[]>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<EnhancedEndpoint>) => void;
  onTest: () => void;
  onRemove: () => void;
  onLoadTokens: (chainId: string) => Promise<SquidToken[]>;
}

function inferSchemaFromResponse(data: any): any {
  if (data === null) return { type: 'null' };
  if (Array.isArray(data)) {
    if (data.length > 0) {
      return { type: 'array', items: inferSchemaFromResponse(data[0]) };
    }
    return { type: 'array' };
  }
  if (typeof data === 'object') {
    const properties: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      properties[key] = inferSchemaFromResponse(value);
    }
    return { type: 'object', properties };
  }
  return { type: typeof data };
}

export function EndpointCard({
  endpoint,
  baseUrl,
  apiType,
  defaultPricing,
  chains,
  tokensByChain,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onTest,
  onRemove,
  onLoadTokens,
}: EndpointCardProps) {
  const [localPathParams, setLocalPathParams] = useState<Record<string, string>>({});
  const [localQueryParams, setLocalQueryParams] = useState<Record<string, string>>({});
  const [outputSchemaText, setOutputSchemaText] = useState(
    endpoint.outputSchema ? JSON.stringify(endpoint.outputSchema, null, 2) : ''
  );
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [chainSearch, setChainSearch] = useState('');
  const chainDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target as Node)) {
        setShowChainDropdown(false);
        setChainSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find the selected chain for this endpoint - can be from all chains or default pricing
  const selectedChainId = endpoint.network 
    ? (() => {
        // First try to find in default pricing chains
        const fromDefault = defaultPricing.selectedChains.find(c => 
          c.networkName.toLowerCase().replace(/\s+/g, '-') === endpoint.network
        );
        if (fromDefault) return fromDefault.chainId;
        
        // If not found, try to find in all chains by network name
        const fromAllChains = chains.find(c => {
          const networkName = (c as any).networkName || c.chainName;
          return networkName.toLowerCase().replace(/\s+/g, '-') === endpoint.network;
        });
        return fromAllChains?.chainId;
      })()
    : null;

  const selectedChain = selectedChainId 
    ? chains.find(c => c.chainId === selectedChainId)
    : null;

  const endpointTokens = selectedChainId ? (tokensByChain.get(selectedChainId) || []) : [];

  const handleChainSelect = async (chainId: string) => {
    const chain = chains.find(c => c.chainId === chainId);
    if (!chain) return;

    // Load tokens if needed
    if (!tokensByChain.has(chainId)) {
      await onLoadTokens(chainId);
    }

    const tokens = tokensByChain.get(chainId) || [];
    const defaultToken = tokens.find(t => t.symbol === 'USDC') || tokens[0];
    const networkName = (chain as any).networkName || chain.chainName;
    
    if (defaultToken) {
      onUpdate({
        network: networkName.toLowerCase().replace(/\s+/g, '-'),
        currency: defaultToken.symbol,
        tokenAddress: defaultToken.address,
        tokenSymbol: defaultToken.symbol,
        tokenDecimals: defaultToken.decimals,
        tokenName: defaultToken.name,
      });
    }
  };

  const handleTokenSelect = (token: SquidToken) => {
    onUpdate({
      currency: token.symbol,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      tokenDecimals: token.decimals,
      tokenName: token.name,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onToggleExpand} className="text-gray-600">
            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
          <select
            value={endpoint.method}
            onChange={(e) => onUpdate({ method: e.target.value as any })}
            className="px-3 py-1 border border-gray-300 rounded"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <input
            type="text"
            value={endpoint.endpoint}
            onChange={(e) => onUpdate({ endpoint: e.target.value })}
            placeholder="/endpoint"
            className="flex-1 px-3 py-1 border border-gray-300 rounded"
          />
          <button
            onClick={onTest}
            disabled={endpoint.isTesting || !baseUrl}
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {endpoint.isTesting ? (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            Test
          </button>
          <button onClick={onRemove} className="text-red-600 hover:text-red-700">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={endpoint.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Endpoint description"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          {/* Endpoint-level Pricing with Chain and Token Selectors */}
          {apiType === 'existing' && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (leave empty to use default)</label>
                <input
                  type="text"
                  value={endpoint.pricePerRequest || ''}
                  onChange={(e) => onUpdate({ pricePerRequest: e.target.value || null })}
                  placeholder={defaultPricing.basePrice}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                  <div className="relative" ref={chainDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowChainDropdown(!showChainDropdown)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-left bg-white hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="text-gray-600 truncate">
                        {selectedChain 
                          ? ((selectedChain as any).networkName || selectedChain.chainName)
                          : 'Select a network...'}
                      </span>
                      <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showChainDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showChainDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search chains..."
                            value={chainSearch}
                            onChange={(e) => setChainSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {chains
                            .filter(chain => {
                              const networkName = (chain as any).networkName || chain.chainName;
                              const searchLower = chainSearch.toLowerCase();
                              return networkName.toLowerCase().includes(searchLower) ||
                                     chain.chainId.includes(searchLower);
                            })
                            .sort((a, b) => {
                              const aName = (a as any).networkName || a.chainName;
                              const bName = (b as any).networkName || b.chainName;
                              return aName.localeCompare(bName);
                            })
                            .map(chain => {
                              const networkName = (chain as any).networkName || chain.chainName;
                              const chainIcon = (chain as any).chainIconURI;
                              
                              return (
                                <button
                                  key={chain.chainId}
                                  type="button"
                                  onClick={async () => {
                                    await handleChainSelect(chain.chainId);
                                    setShowChainDropdown(false);
                                    setChainSearch('');
                                  }}
                                  className={`w-full p-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 flex items-center gap-3 ${
                                    selectedChainId === chain.chainId ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  {chainIcon && (
                                    <Image
                                      src={chainIcon}
                                      alt={networkName}
                                      width={20}
                                      height={20}
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
                            })}
                          {chains.filter(chain => {
                            const networkName = (chain as any).networkName || chain.chainName;
                            const searchLower = chainSearch.toLowerCase();
                            return networkName.toLowerCase().includes(searchLower) ||
                                   chain.chainId.includes(searchLower);
                          }).length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No chains found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Token</label>
                  {selectedChainId && endpointTokens.length > 0 ? (
                    <TokenSelector
                      chainId={selectedChainId}
                      tokens={endpointTokens}
                      selectedTokenAddress={endpoint.tokenAddress || ''}
                      onSelectToken={handleTokenSelect}
                      onLoadTokens={onLoadTokens}
                    />
                  ) : selectedChainId ? (
                    <div className="text-sm text-gray-500 px-3 py-2">
                      Loading tokens...
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 px-3 py-2">
                      Select a network first
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Path Parameters */}
          {endpoint.pathParams && Object.keys(endpoint.pathParams).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Path Parameters</label>
              <div className="space-y-2">
                {Object.entries(endpoint.pathParams).map(([key]) => (
                  <div key={key} className="flex gap-2">
                    <span className="px-3 py-2 bg-gray-100 rounded">{key}</span>
                    <input
                      type="text"
                      value={localPathParams[key] || ''}
                      onChange={(e) => setLocalPathParams({ ...localPathParams, [key]: e.target.value })}
                      placeholder={`Value for ${key}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Parameters */}
          {endpoint.queryParams && Object.keys(endpoint.queryParams).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Query Parameters</label>
              <div className="space-y-2">
                {Object.entries(endpoint.queryParams).map(([key]) => (
                  <div key={key} className="flex gap-2">
                    <span className="px-3 py-2 bg-gray-100 rounded">{key}</span>
                    <input
                      type="text"
                      value={localQueryParams[key] || ''}
                      onChange={(e) => setLocalQueryParams({ ...localQueryParams, [key]: e.target.value })}
                      placeholder={`Value for ${key}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Schema */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Output Schema (JSON)</label>
            <textarea
              value={outputSchemaText}
              onChange={(e) => {
                setOutputSchemaText(e.target.value);
                try {
                  const parsed = JSON.parse(e.target.value);
                  onUpdate({ outputSchema: parsed });
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='{"type": "object", "properties": {...}}'
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
              style={{ maxHeight: '300px', minHeight: '100px' }}
            />
            {endpoint.testResponse && (
              <button
                onClick={() => {
                  const schema = inferSchemaFromResponse(endpoint.testResponse);
                  setOutputSchemaText(JSON.stringify(schema, null, 2));
                  onUpdate({ outputSchema: schema });
                }}
                className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                Auto-populate from test response
              </button>
            )}
          </div>

          {/* Test Results */}
          {endpoint.testResponse !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {endpoint.testStatus && endpoint.testStatus >= 200 && endpoint.testStatus < 300 ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  Status: {endpoint.testStatus} | Time: {endpoint.testResponseTime}ms
                </span>
              </div>
              {endpoint.testError ? (
                <div className="text-red-600 text-sm">{endpoint.testError}</div>
              ) : (
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(endpoint.testResponse, null, 2)}
                </pre>
              )}
              {apiType === 'native' && endpoint.responseMatch !== undefined && (
                <div className="mt-2">
                  {endpoint.responseMatch ? (
                    <div className="text-green-600 text-sm">✓ Responses match</div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      ✗ Responses differ: {endpoint.responseDifferences?.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

