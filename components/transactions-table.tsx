'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, DollarSign, Globe, Hash, Server, User } from 'lucide-react';

interface Transaction {
  id: string;
  recipient: string;
  amount: string;
  sender: string;
  tx_hash: string;
  block_timestamp: string;
  chain: string;
  facilitator_id: string;
  resource?: string;
  token_address?: string;
  transaction_from?: string;
}

interface TransactionsTableProps {
  resourceFilter?: string;
  pageSize?: number;
  userAddress?: string;
  chain?: string;
}

export function TransactionsTable({ 
  resourceFilter, 
  pageSize = 15,
  userAddress,
  chain 
}: TransactionsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (resourceFilter) params.append('resource', resourceFilter);
      if (userAddress) params.append('userAddress', userAddress);
      if (chain) params.append('chain', chain);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/transactions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      setTransactions(data.items || []);
      setHasMore(data.hasNextPage || false);
      setTotalPages(data.total_pages || 0);
    } catch (err) {
      console.error('[TransactionsTable] Error fetching transactions:', err);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, resourceFilter, userAddress, chain]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    return `${parseFloat(amount).toFixed(2)} USDC`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getChainIcon = (chain: string) => {
    const colors: { [key: string]: string } = {
      base: 'bg-blue-500',
      ethereum: 'bg-purple-500',
      optimism: 'bg-red-500',
      arbitrum: 'bg-cyan-500',
    };
    return colors[chain] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="retro-card">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="retro-card p-8 text-center">
        <p className="font-mono text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchTransactions()}
          className="retro-button px-4 py-2"
        >
          RETRY
        </button>
      </div>
    );
  }

  if (!loading && transactions.length === 0) {
    return (
      <div className="retro-card p-8 text-center">
        <p className="font-mono text-gray-600">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="retro-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <thead className="border-b-2 border-black bg-gray-50">
            <tr>
              <th className="text-left p-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  <span>Server</span>
                </div>
              </th>
              <th className="text-center p-3">
                <div className="flex items-center gap-2 justify-center">
                  <DollarSign className="w-4 h-4" />
                  <span>Amount</span>
                </div>
              </th>
              <th className="text-center p-3">
                <div className="flex items-center gap-2 justify-center">
                  <User className="w-4 h-4" />
                  <span>Sender</span>
                </div>
              </th>
              <th className="text-center p-3">
                <div className="flex items-center gap-2 justify-center">
                  <Hash className="w-4 h-4" />
                  <span>Tx Hash</span>
                </div>
              </th>
              <th className="text-center p-3">
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="w-4 h-4" />
                  <span>Time</span>
                </div>
              </th>
              <th className="text-center p-3">
                <div className="flex items-center gap-2 justify-center">
                  <Globe className="w-4 h-4" />
                  <span>Chain</span>
                </div>
              </th>
              <th className="text-center p-3">
                <div className="flex items-center gap-2 justify-center">
                  <Server className="w-4 h-4" />
                  <span>Facilitator</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr
                key={tx.id}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-xs font-bold text-purple-600">
                      {tx.recipient.slice(2, 4).toUpperCase()}
                    </div>
                    <span className="text-xs">{formatAddress(tx.recipient)}</span>
                  </div>
                </td>
                <td className="p-3 text-center text-xs font-semibold text-green-600">
                  {formatAmount(tx.amount)}
                </td>
                <td className="p-3 text-center text-xs text-gray-600">
                  {formatAddress(tx.sender)}
                </td>
                <td className="p-3 text-center">
                  <a
                    href={`https://basescan.org/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {formatAddress(tx.tx_hash)}
                  </a>
                </td>
                <td className="p-3 text-center text-xs text-gray-600">
                  {formatTimestamp(tx.block_timestamp)}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${getChainIcon(tx.chain)}`} />
                    <span className="text-xs capitalize">{tx.chain}</span>
                  </div>
                </td>
                <td className="p-3 text-center text-xs text-gray-600">
                  {tx.facilitator_id || 'Coinbase'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 p-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="border-2 border-black p-3 bg-white">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center text-xs font-bold text-purple-600">
                  {tx.recipient.slice(2, 4).toUpperCase()}
                </div>
                <span className="text-xs font-mono">{formatAddress(tx.recipient)}</span>
              </div>
              <span className="text-sm font-bold font-mono text-green-600">
                {formatAmount(tx.amount)}
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono text-gray-600">
              <div className="flex justify-between">
                <span>Sender:</span>
                <span>{formatAddress(tx.sender)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tx:</span>
                <a
                  href={`https://basescan.org/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {formatAddress(tx.tx_hash)}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span>Chain:</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getChainIcon(tx.chain)}`} />
                  <span className="capitalize">{tx.chain}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{formatTimestamp(tx.block_timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="border-t-2 border-black bg-gray-50 p-4 flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="retro-button px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← PREV
        </button>
        <span className="font-mono text-sm text-gray-600">
          Page {page + 1}{totalPages > 0 ? ` of ${totalPages}` : ''}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
          className="retro-button px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          NEXT →
        </button>
      </div>
    </div>
  );
}

