/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { useState, useEffect } from 'react';
import { x402Service } from '@/lib/x402-service';
import { groupServicesByServer, X402Server } from '@/lib/x402-server-grouping';
import Link from 'next/link';
import { SmartImage } from '@/components/ui/smart-image';
import { TransactionsTable } from '@/components/transactions-table';

const SERVERS_PER_PAGE = 12;

export default function ServersPage() {
  const [servers, setServers] = useState<X402Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'servers' | 'transactions'>('servers');

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const services = await x402Service.fetchLiveServices();
      const validServices = (services || []).filter(service => 
        service != null && service?.resource
      );
      const groupedServers = groupServicesByServer(validServices);
      setServers(groupedServers);
    } catch (err) {
      console.error('Error loading servers:', err);
      setError('Failed to load servers. Using cached data if available.');
    } finally {
      setLoading(false);
    }
  };

  const filteredServers = servers.filter(server => {
    const searchText = `${server?.title || ''} ${server?.domain || ''} ${server?.description || ''}`.toLowerCase();
    return searchText.includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredServers.length / SERVERS_PER_PAGE);
  const startIndex = (currentPage - 1) * SERVERS_PER_PAGE;
  const endIndex = startIndex + SERVERS_PER_PAGE;
  const paginatedServers = filteredServers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold font-mono tracking-wide">
              {viewMode === 'servers' ? 'X402 SERVERS' : 'X402 TRANSACTIONS'}
            </h1>
            <div className="flex gap-3">
              {/* <button
                onClick={() => setViewMode(viewMode === 'servers' ? 'transactions' : 'servers')}
                className="retro-button px-4 py-2"
              >
                {viewMode === 'servers' ? 'SHOW TRANSACTIONS' : 'SHOW SERVERS'}
              </button> */}
              {viewMode === 'servers' && (
                <Link href="/discover" className="retro-button px-4 py-2">
                  VIEW RESOURCES
                </Link>
              )}
            </div>
          </div>
          <p className="text-gray-700 font-mono">
            {viewMode === 'servers' 
              ? 'Browse x402 APIs grouped by server/origin'
              : 'View all x402 transactions through the Coinbase facilitator'
            }
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="retro-input w-full"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 font-mono">Loading {viewMode}...</p>
          </div>
        ) : error && viewMode === 'servers' ? (
          <div className="retro-card p-4 bg-yellow-100 border-yellow-500">
            <p className="text-yellow-800 font-mono">{error}</p>
          </div>
        ) : viewMode === 'transactions' ? (
          /* Transactions View */
          <TransactionsTable pageSize={15} />
        ) : (
          /* Servers View */
          <>
            <div className="mb-4">
              <p className="font-mono text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredServers.length)} of {filteredServers.length} Server{filteredServers.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Servers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServers.map(server => (
                <Link
                  key={server.id}
                  href={`/discover/servers/${encodeURIComponent(server.id)}`}
                  className="retro-card hover:transform hover:-translate-y-1 transition-transform duration-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-white rounded border-2 border-black flex items-center justify-center overflow-hidden">
                      {server.favicon ? (
                        <SmartImage
                          src={server.favicon}
                          alt={server.title || server.domain}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-lg font-bold">
                          {(server.title || server.domain)[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold font-mono mb-1 break-words">
                        {server.title || server.domain}
                      </h3>
                      <p className="text-xs font-mono text-gray-600 truncate">
                        {server.domain}
                      </p>
                    </div>
                  </div>
                  
                  {server.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                      {server.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-gray-600">
                      {server.resourceCount} Resource{server.resourceCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-blue-600 hover:underline">
                      View →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="retro-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← PREV
                </button>
                
                <div className="font-mono text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="retro-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  NEXT →
                </button>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}

