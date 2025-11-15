'use client';

import { Header } from '../../components/ui/header';
import { useState, useEffect } from 'react';
import { X402Service, x402Service } from '../../lib/x402-service';
import Link from 'next/link';

export default function DiscoverPage() {
  const [services, setServices] = useState<X402Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const liveServices = await x402Service.fetchLiveServices();
      
      if (liveServices.length > 0) {
        setServices(liveServices);
      } else {
        // Fallback to mock data if no live services found
        setServices(getMockServices());
      }
    } catch (err) {
      console.error('Error fetching live services:', err);
      setError('Failed to fetch live services');
      // Fallback to mock data
      setServices(getMockServices());
    } finally {
      setLoading(false);
    }
  };

  const getMockServices = (): X402Service[] => {
    return [
      {
        resource: 'https://api.weather.com/v1/current',
        type: 'http',
        x402Version: 1,
        lastUpdated: new Date().toISOString(),
        metadata: {
          name: 'Weather Data API',
          description: 'Real-time weather information and forecasts for global locations with historical data access.',
          tags: ['weather', 'data', 'forecast']
        },
        accepts: [{
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          description: 'USDC payment for weather data',
          extra: { name: 'USD Coin', version: '2' },
          maxAmountRequired: '50000',
          maxTimeoutSeconds: 60,
          mimeType: 'application/json',
          network: 'base',
          outputSchema: {
            input: { method: 'GET', type: 'http' },
            output: null
          },
          payTo: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          resource: 'https://api.weather.com/v1/current',
          scheme: 'exact'
        }]
      },
      {
        resource: 'https://api.finance.com/v2/stocks/price',
        type: 'http',
        x402Version: 1,
        lastUpdated: new Date().toISOString(),
        metadata: {
          name: 'Financial Market Data',
          description: 'Real-time stock prices, cryptocurrency data, and market analytics with millisecond precision.',
          tags: ['finance', 'stocks', 'crypto']
        },
        accepts: [{
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          description: 'USDC payment for financial data',
          extra: { name: 'USD Coin', version: '2' },
          maxAmountRequired: '100000',
          maxTimeoutSeconds: 60,
          mimeType: 'application/json',
          network: 'base',
          outputSchema: {
            input: { method: 'GET', type: 'http' },
            output: null
          },
          payTo: '0x8ba1f109551bA432b026B4473A19798490eF6E44',
          resource: 'https://api.finance.com/v2/stocks/price',
          scheme: 'exact'
        }]
      }
    ];
  };

  const availableTags = Array.from(new Set(services.flatMap(service => 
    x402Service.getServiceTags(service)
  )));

  const filteredServices = services.filter(service => {
    const searchText = `${service.metadata.name || ''} ${service.metadata.description || ''} ${service.resource}`.toLowerCase();
    const matchesSearch = searchText.includes(searchTerm.toLowerCase());
    
    const serviceTags = x402Service.getServiceTags(service);
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => serviceTags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.metadata.name || '').localeCompare(b.metadata.name || '');
      case 'price':
        const priceA = parseInt(a.accepts[0]?.maxAmountRequired || '0');
        const priceB = parseInt(b.accepts[0]?.maxAmountRequired || '0');
        return priceA - priceB;
      case 'rating':
        const ratingA = x402Service.getServiceRating(a);
        const ratingB = x402Service.getServiceRating(b);
        return ratingB - ratingA;
      case 'updated':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <div className="h-16 w-16 bg-gray-200 mx-auto mb-4 animate-pulse"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedServices.map(service => {
              const tags = x402Service.getServiceTags(service);
              const primaryPayment = service.accepts[0];
              const price = x402Service.formatUSDCAmount(primaryPayment?.maxAmountRequired || '0');
              const rating = x402Service.getServiceRating(service);
              
              return (
                <div key={service.resource} className="retro-card hover:transform hover:-translate-y-1 transition-transform duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-mono tracking-wide">
                      {service.metadata.name || service.resource.split('/').pop() || 'X402 Service'}
                    </h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono">
                        {price} USDC
                      </div>
                      <div className="text-sm text-gray-600 font-mono">
                        per request
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {service.metadata.description || 'Professional x402 API service with instant payment integration.'}
                  </p>
                  
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
                      <div className="text-gray-600">{service.type.toUpperCase()}</div>
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
                      <div className="text-gray-600">{service.x402Version}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/discover/${encodeURIComponent(service.resource)}`}
                      className="retro-button flex-1 text-center"
                    >
                      VIEW DETAILS
                    </Link>
                    <Link 
                      href={`/discover/${encodeURIComponent(service.resource)}/test`}
                      className="retro-button flex-1 bg-gray-100 text-center"
                    >
                      TEST API
                    </Link>
                  </div>
                </div>
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
