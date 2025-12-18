/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { x402Service } from '@/lib/x402-service';
import { groupServicesByServer, getServerById, X402Server } from '@/lib/x402-server-grouping';
import { x402Service as serviceManager } from '@/lib/x402-service';
import Link from 'next/link';
import { SmartImage } from '@/components/ui/smart-image';

export default function ServerDetailPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [server, setServer] = useState<X402Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const services = await x402Service.fetchLiveServices();
      const validServices = (services || []).filter(service => 
        service != null && service?.resource
      );
      const servers = groupServicesByServer(validServices);
      const foundServer = getServerById(servers, decodeURIComponent(serverId));
      
      if (foundServer) {
        setServer(foundServer);
      } else {
        setError('Server not found');
      }
    } catch (err) {
      console.error('Error loading server details:', err);
      setError('Failed to load server details');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  
  useEffect(() => {
    if (serverId) {
      loadServerDetails();
    }
  }, [serverId, loadServerDetails]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center font-mono">Loading server details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="retro-card p-6 text-center">
            <p className="text-red-600 font-mono mb-4">{error || 'Server not found'}</p>
            <Link href="/discover/servers" className="retro-button">
              BACK TO SERVERS
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <nav className="mb-8">
          <Link href="/discover/servers" className="text-blue-600 hover:underline font-mono">
            ← BACK TO SERVERS
          </Link>
        </nav>

        {/* Server Header */}
        <div className="retro-card p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 flex-shrink-0 bg-white rounded border-2 border-black flex items-center justify-center overflow-hidden">
              {server.favicon ? (
                <SmartImage
                  src={server.favicon}
                  alt={server.title || server.domain}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                <span className="text-2xl font-bold">
                  {(server.title || server.domain)[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-mono mb-2">
                {server.title || server.domain}
              </h1>
              <p className="text-sm font-mono text-gray-600 mb-2">
                {server.domain}
              </p>
              {server.description && (
                <p className="text-gray-700 mb-4">
                  {server.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {server.metadata?.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t-2 border-black">
            <div>
              <div className="text-2xl font-bold font-mono text-purple-600">
                {server.resourceCount}
              </div>
              <div className="text-sm text-gray-600 font-mono">Resources</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-blue-600">
                {server.metadata?.category || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 font-mono">Category</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-cyan-600">
                {new Date(server.lastUpdated).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600 font-mono">Last Updated</div>
            </div>
            <div>
              <a
                href={server.origin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-bold font-mono text-green-600 hover:underline"
              >
                Visit →
              </a>
              <div className="text-sm text-gray-600 font-mono">Website</div>
            </div>
          </div>
        </div>

        {/* Resources List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-mono mb-4">
            RESOURCES ({server.resources.length})
          </h2>
        </div>

        <div className="space-y-4">
          {server.resources.map((resource, index) => {
            const primaryPayment = resource?.accepts?.[0];
            const price = serviceManager.formatUSDCAmount(primaryPayment?.maxAmountRequired || '0');
            const tags = serviceManager.getServiceTags(resource);

            return (
              <Link
                key={resource?.resource || index}
                href={`/discover/${encodeURIComponent(resource?.resource || '')}`}
                className="retro-card p-4 hover:transform hover:-translate-y-1 transition-transform duration-200 block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold font-mono mb-2 break-words">
                      {resource?.metadata?.name || resource?.resource?.split('/').pop() || 'X402 Service'}
                    </h3>
                    {resource?.metadata?.description && (
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {resource.metadata.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.slice(0, 3).map((tag, tagIdx) => (
                        <span key={tagIdx} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-mono text-gray-600 break-all">
                      {resource?.resource}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-purple-600">
                      {price} USDC
                    </div>
                    <div className="text-xs text-gray-600 font-mono">per request</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

