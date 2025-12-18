/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { useState, useEffect } from 'react';
import { X402Service, x402Service } from '@/lib/x402-service';
import { groupServicesByServer } from '@/lib/x402-server-grouping';
import { generateServiceId } from '@/lib/x402-service-id';
import Link from 'next/link';
import Image from 'next/image';

export default function DiscoverPage() {
  const [services, setServices] = useState<X402Service[]>([]);
  const [displayedServices, setDisplayedServices] = useState<X402Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'resources' | 'servers'>('resources');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Preload from cache immediately for faster display
    const preloadFromCache = (): boolean => {
      if (typeof window !== 'undefined') {
        try {
          const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
          
          // Check all localStorage keys that match the pattern
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('x402_services_cache_')) {
              const cached = localStorage.getItem(key);
              if (cached) {
                try {
                  const parsed = JSON.parse(cached);
                  // Check if cache is still valid
                  if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION) {
                    if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                      // console.log(`Loaded ${parsed.data.length} services from cache (${key}, age: ${Math.round((Date.now() - parsed.timestamp) / 1000 / 60)} minutes)`);
                      setServices(parsed.data);
                      setLoading(false);
                      return true; // Found valid cache, stop looking
                    }
                  } else {
                    // Cache expired, remove it
                    // console.log(`Cache expired for ${key}, removing...`);
                    localStorage.removeItem(key);
                  }
                } catch (e) {
                  // Skip invalid entries
                  console.warn(`Invalid cache entry for ${key}:`, e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading cached data:', error);
        }
      }
      return false;
    };

    const hasCache = preloadFromCache();
    // Only refresh if no cache was found
    if (!hasCache) {
      refreshData();
    }
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const liveServices = await x402Service.fetchLiveServices();
      // Filter out any null/undefined services and ensure they have required properties
      const validServices = (liveServices || []).filter(service => 
        service != null && service?.resource
      );
      setServices(validServices);
    } catch (err) {
      console.error('Error fetching live services:', err);
      setError('Failed to load services. Using cached data if available.');
      // Don't clear services on error - keep cached data visible
    } finally {
      setLoading(false);
    }
  };

  const availableTags = Array.from(new Set(services
    .filter(service => service != null)
    .flatMap(service => x402Service.getServiceTags(service))
  ));

  const filteredServices = services.filter(service => {
    if (!service) return false;
    
    const searchText = `${service?.metadata?.name || ''} ${service?.metadata?.description || ''} ${service?.resource || ''}`.toLowerCase();
    const matchesSearch = searchText.includes(searchTerm.toLowerCase());
    
    const serviceTags = x402Service.getServiceTags(service);
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => serviceTags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (!a || !b) return 0;
    
    switch (sortBy) {
      case 'name':
        return (a?.metadata?.name || '').localeCompare(b?.metadata?.name || '');
      case 'price':
        const priceA = parseInt(a?.accepts?.[0]?.maxAmountRequired || '0');
        const priceB = parseInt(b?.accepts?.[0]?.maxAmountRequired || '0');
        return priceA - priceB;
      case 'rating':
        const ratingA = x402Service.getServiceRating(a);
        const ratingB = x402Service.getServiceRating(b);
        return ratingB - ratingA;
      case 'updated':
        const timeA = a?.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const timeB = b?.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return timeB - timeA;
      default:
        return 0;
    }
  });

  // Paginate the sorted services
  const paginatedServices = sortedServices.slice(0, currentPage * itemsPerPage);
  const hasMore = sortedServices.length > paginatedServices.length;

  const loadMore = async () => {
    setLoadingMore(true);
    // Simulate async loading for smooth UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setCurrentPage(prev => prev + 1);
    setLoadingMore(false);
  };

  // Helper function to extract domain or subdomain from URL
  const extractDomainOrSubdomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const parts = hostname.split('.');
      
      // If we have a subdomain (e.g., gateway.grapevine.fyi)
      if (parts.length > 2) {
        // Return the subdomain (first part)
        return parts[0];
      }
      // If it's just a domain (e.g., example.com)
      if (parts.length === 2) {
        return parts[0];
      }
      // Fallback to hostname
      return hostname;
    } catch {
      return 'service';
    }
  };

  // Helper function to check if a string looks like an ID (CID, UUID, hash)
  const looksLikeId = (str: string): boolean => {
    if (!str) return false;
    // Check for CID (starts with baf, Qm, etc.), UUID, or long hex strings
    return (
      str.length > 30 || // Very long strings are likely IDs
      /^(baf|Qm)[a-z0-9]{40,}$/i.test(str) || // IPFS CID
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || // UUID
      /^[0-9a-f]{32,}$/i.test(str) || // Long hex string
      /^0x[0-9a-f]{40,}$/i.test(str) // Ethereum address or hash
    );
  };

  // Helper function to truncate text to approximately 3 lines (150 chars)
  const truncateText = (text: string, maxLength: number = 150): { text: string; isTruncated: boolean } => {
    if (text.length <= maxLength) {
      return { text, isTruncated: false };
    }
    // Find the last space before maxLength to avoid cutting words
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const finalText = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
    return { text: finalText + '...', isTruncated: true };
  };

  // Toggle expanded state for a card
  const toggleCardExpansion = (serviceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <div className="h-16 w-16 bg-gray-200 mx-auto mb-4 animate-pulse">
              <Image src="/1x402.ico" alt="x402 Logo" width={64} height={64} />
            </div>
            <h2 className="text-xl font-bold font-mono mb-2">LOADING X402 SERVICES</h2>
            <p className="text-gray-600 font-mono">Fetching live data from x402 Bazaar...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold font-mono tracking-wider mb-6">
              DISCOVER X402 APIS
            </h1>
            <p className="text-xl font-mono text-gray-700 max-w-3xl mx-auto mb-8">
              Browse and explore available x402 APIs from the live Bazaar. Find the perfect service for your needs with transparent pricing and comprehensive documentation.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={refreshData}
                className="retro-button bg-gray-100"
              >
                REFRESH DATA
              </button>
              <Link
                href="/network-demo"
                className="retro-button bg-blue-100 text-blue-800"
              >
                VIEW 3D NETWORK
              </Link>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-gray-50 border-2 border-gray-300 text-gray-800 font-mono text-sm">
                {error} - Showing fallback data
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="retro-card mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-mono font-bold text-sm mb-2 tracking-wide">
                  SEARCH APIS
                </label>
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="retro-input w-full"
                />
              </div>
              
              <div>
                <label className="block font-mono font-bold text-sm mb-2 tracking-wide">
                  FILTER BY TAGS
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-1 text-sm font-mono border-2 border-black ${
                        selectedTags.includes(tag)
                          ? 'bg-black text-white'
                          : 'bg-white text-black'
                      }`}
                    >
                      {tag.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block font-mono font-bold text-sm mb-2 tracking-wide">
                  SORT BY
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="retro-input w-full"
                >
                  <option value="name">NAME</option>
                  <option value="price">PRICE</option>
                  <option value="rating">RATING</option>
                  <option value="updated">LAST UPDATED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="font-mono text-sm text-gray-600">
              {filteredServices.length} API{filteredServices.length !== 1 ? 's' : ''} found
            </p>
          </div>

              {/* API Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-hidden">
                {paginatedServices.map(service => {
                  if (!service) return null;
                  
                  const tags = x402Service.getServiceTags(service);
                  const primaryPayment = service?.accepts?.[0];
                  const price = x402Service.formatUSDCAmount(primaryPayment?.maxAmountRequired || '0');
                  const rating = x402Service.getServiceRating(service);

                  // Generate service ID for URL
                  const serviceId = service?.resource ? generateServiceId(service.resource) : 'unknown';

                  // Get the service name and resource details
                  const rawName = service?.metadata?.name || service?.resource?.split('/').pop() || 'X402 Service';
                  const isNameAnId = looksLikeId(rawName);
                  const domainOrSubdomain = service?.resource ? extractDomainOrSubdomain(service.resource) : '';
                  
                  // Determine display name and subtitle
                  const displayName = isNameAnId ? domainOrSubdomain : rawName;
                  const displaySubtitle = isNameAnId ? rawName : domainOrSubdomain;

                  // Get description and truncate if needed
                  const fullDescription = service?.accepts?.[0]?.description || service?.metadata?.description || 'Professional x402 API service with instant payment integration.';
                  const isExpanded = expandedCards.has(serviceId);
                  const { text: displayDescription, isTruncated } = isExpanded ? { text: fullDescription, isTruncated: false } : truncateText(fullDescription);

                  return (
                    <Link
                      key={service?.resource || Math.random()}
                      href={`/discover/${serviceId}`}
                      className="retro-card hover:transform hover:-translate-y-1 transition-all duration-200 break-words block"
                    >
                  <div className="mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-wide mb-1 overflow-hidden text-ellipsis break-words" style={{ fontSize: 'clamp(1rem, 2vw + 0.5rem, 1.5rem)' }}>
                      {displayName}
                    </h3>
                    {displaySubtitle && (
                      <p className="text-xs sm:text-sm text-gray-500 font-mono mb-2 break-all">
                        {displaySubtitle}
                      </p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl sm:text-3xl font-bold font-mono" style={{ fontSize: 'clamp(1.25rem, 2.5vw + 0.5rem, 1.875rem)' }}>
                        {price} USDC
                      </div>
                      <div className="text-sm text-gray-600 font-mono whitespace-nowrap">
                        per request
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">
                      {displayDescription}
                    </p>
                    {isTruncated && (
                      <button
                        onClick={(e) => toggleCardExpansion(serviceId, e)}
                        className="text-sm font-mono text-blue-600 hover:text-blue-800 underline mt-1"
                      >
                        {isExpanded ? 'READ LESS' : 'READ MORE'}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-xs font-mono border border-gray-300"
                      >
                        {tag.toUpperCase()}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-200 text-xs font-mono border border-gray-300">
                        +{tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="font-mono font-bold">TYPE</div>
                      <div className="text-gray-600">{service?.type?.toUpperCase() || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold">NETWORK</div>
                      <div className="text-gray-600">{primaryPayment?.network?.toUpperCase() || 'BASE'}</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold">RATING</div>
                      <div className="text-gray-600">{rating.toFixed(1)}/5.0</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold">VERSION</div>
                      <div className="text-gray-600">{service?.x402Version || '1'}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="retro-button flex-1 text-center text-xs sm:text-sm bg-black text-white">
                      VIEW DETAILS
                    </div>
                    <Link
                      href={`/discover/${serviceId}/test`}
                      className="retro-button flex-1 bg-gray-100 text-gray-900 text-center text-xs sm:text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      TEST API
                    </Link>
                  </div>
                  </Link>
              );
            })}
          </div>

          {/* No Results */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-200 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold font-mono mb-2">
                NO APIS FOUND
              </h3>
              <p className="text-gray-600 font-mono">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="retro-button bg-gray-100 disabled:opacity-50"
              >
                {loadingMore ? 'LOADING...' : `LOAD MORE`}
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center mt-8">
            <button
              onClick={refreshData}
              className="retro-button bg-gray-100"
            >
              REFRESH SERVICES
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
