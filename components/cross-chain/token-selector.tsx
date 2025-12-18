/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { squidRouter, SquidToken } from '@/lib/squid-router';
import { useAccount } from 'wagmi';

export interface TokenSelectorProps {
  chainId?: string;
  selectedTokenAddress?: string;
  onTokenSelect: (token: SquidToken | null) => void;
  onBalanceUpdate?: (balance: string) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
  showBalance?: boolean;
  externalApiUrl?: string; // Optional external API for token list
}

/**
 * Exportable Token Selector Component
 * Automatically fetches balance when token is selected
 */
export function TokenSelector({
  chainId,
  selectedTokenAddress,
  onTokenSelect,
  onBalanceUpdate,
  className = '',
  label = 'SELECT TOKEN',
  disabled = false,
  showBalance = true,
  externalApiUrl,
}: TokenSelectorProps) {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<SquidToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTokens = useCallback(async (targetChainId: string) => {
    try {
      setLoading(true);
      setError(null);
      setTokens([]);

      let tokensData: SquidToken[] = [];

      // Try external API first if provided
      if (externalApiUrl) {
        try {
          const response = await fetch(`${externalApiUrl}?chainId=${targetChainId}`);
          if (response.ok) {
            const data = await response.json();
            tokensData = data.tokens || data || [];
          }
        } catch (err) {
          console.warn('External API failed, falling back to Squid:', err);
        }
      }

      // Fallback to Squid Router API
      if (tokensData.length === 0) {
        tokensData = await squidRouter.getTokens(targetChainId);
      }

      setTokens(tokensData);
    } catch (err: any) {
      console.error('Error loading tokens:', err);
      setError(err?.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  }, [externalApiUrl]);

  const fetchBalance = useCallback(async () => {
    if (!selectedTokenAddress || !chainId || !address) return;

    try {
      setBalanceLoading(true);
      const tokenBalance = await squidRouter.getTokenBalance(
        chainId,
        selectedTokenAddress,
        address
      );
      setBalance(tokenBalance);
      onBalanceUpdate?.(tokenBalance);
    } catch (err: any) {
      console.error('Error fetching balance:', err);
      setBalance('0');
      onBalanceUpdate?.('0');
    } finally {
      setBalanceLoading(false);
    }
  }, [selectedTokenAddress, chainId, address, onBalanceUpdate]);

  useEffect(() => {
    if (chainId) {
      loadTokens(chainId);
    } else {
      setTokens([]);
      setBalance('0');
    }
  }, [chainId, externalApiUrl, loadTokens]);

  useEffect(() => {
    if (selectedTokenAddress && chainId && address && showBalance) {
      fetchBalance();
    } else {
      setBalance('0');
      onBalanceUpdate?.('0');
    }
  }, [selectedTokenAddress, chainId, address, showBalance, fetchBalance, onBalanceUpdate]);


  const selectedToken = tokens.find(t => t?.address === selectedTokenAddress);
  const filteredTokens = tokens.filter(token =>
    token?.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBalance = (bal: string, decimals: number): string => {
    try {
      const value = BigInt(bal);
      const divisor = BigInt(10 ** decimals);
      const formatted = Number(value) / Number(divisor);
      return formatted.toFixed(6).replace(/\.?0+$/, '');
    } catch {
      return '0';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block font-mono font-bold text-sm">
        {label}
      </label>

      {!chainId ? (
        <div className="text-sm font-mono text-gray-500">
          Please select a chain first
        </div>
      ) : loading ? (
        <div className="text-sm font-mono text-gray-600">Loading tokens...</div>
      ) : error ? (
        <div className="text-sm font-mono text-red-600">{error}</div>
      ) : (
        <>
          {searchTerm && tokens.length > 10 && (
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="retro-input w-full text-sm"
              disabled={disabled}
            />
          )}

          <select
            value={selectedTokenAddress || ''}
            onChange={(e) => {
              const token = tokens.find(t => t?.address === e.target.value);
              onTokenSelect(token || null);
            }}
            className="retro-input w-full"
            disabled={disabled}
          >
            <option value="">Choose a token...</option>
            {filteredTokens.map(token => (
              <option key={token?.address} value={token?.address}>
                {token?.symbol} - {token?.name}
              </option>
            ))}
          </select>

          {selectedToken && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600 font-mono">
                {selectedToken?.symbol} ({selectedToken?.name})
              </div>
              {showBalance && address && (
                <div className="text-xs font-mono">
                  <span className="text-gray-600">Balance: </span>
                  {balanceLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <span className="font-bold">
                      {formatBalance(balance, selectedToken?.decimals || 18)} {selectedToken?.symbol}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

