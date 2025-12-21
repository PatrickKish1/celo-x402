/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { Header } from '@/components/ui/header';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CheckCircle2Icon, 
  XCircleIcon, 
  LoaderIcon,
  AlertTriangleIcon,
  ClockIcon,
  SearchIcon,
  FilterIcon
} from 'lucide-react';
import { X402Service, x402Service } from '@/lib/x402-service';
import { generateServiceId } from '@/lib/x402-service-id';
import Image from 'next/image';

interface ValidationResult {
  validationId: number;
  serviceId: string;
  serviceName: string;
  status: 'verified' | 'failed' | 'pending';
  score: number;
  testsPassed: number;
  testsFailed: number;
  totalTests: number;
  testResults: TestResult[];
  tokensSpent: number;
  testnetChain: string;
  errorMessage?: string;
}

interface TestResult {
  endpoint: string;
  method: string;
  passed: boolean;
  statusCode: number;
  responseTime: number;
  schemaValid: boolean;
  actualOutput?: any;
  errorMessage?: string;
}

interface UsageStats {
  dailyValidations: number;
  weeklyValidations: number;
  monthlyValidations: number;
  lastValidation: Date | null;
}

export default function ValidateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAppKitAccount();
  
  const serviceIdFromUrl = searchParams.get('serviceId');
  
  const [services, setServices] = useState<X402Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<X402Service[]>([]);
  const [selectedService, setSelectedService] = useState<X402Service | null>(null);
  const [showMainnet, setShowMainnet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationMode, setValidationMode] = useState<'free' | 'user-paid'>('free');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Check wallet connection status with a small delay to avoid flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingWallet(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [isConnected]);

  // Helper function to extract domain or subdomain from URL
  const extractDomainOrSubdomain = useCallback((url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const parts = hostname.split(".");

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
      return "service";
    }
  }, []);

  // Helper function to check if a string looks like an ID (CID, UUID, hash)
  const looksLikeId = useCallback((str: string): boolean => {
    if (!str) return false;
    // Check for CID (starts with baf, Qm, etc.), UUID, or long hex strings
    return (
      str.length > 30 || // Very long strings are likely IDs
      /^(baf|Qm)[a-z0-9]{40,}$/i.test(str) || // IPFS CID
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || // UUID
      /^[0-9a-f]{32,}$/i.test(str) || // Long hex string
      /^0x[0-9a-f]{40,}$/i.test(str) // Ethereum address or hash
    );
  }, []);

  // Get service display name (same logic as discover page)
  const getServiceDisplayName = useCallback((service: X402Service): { name: string; subtitle?: string } => {
    const rawName =
      service?.metadata?.name ||
      service?.resource?.split("/").pop() ||
      "X402 Service";
    const isNameAnId = looksLikeId(rawName);
    const domainOrSubdomain = service?.resource
      ? extractDomainOrSubdomain(service.resource)
      : "";

    // Determine display name and subtitle
    const displayName = isNameAnId ? domainOrSubdomain : rawName;
    const displaySubtitle = isNameAnId ? rawName : domainOrSubdomain;

    return {
      name: displayName,
      subtitle: displaySubtitle && displaySubtitle !== displayName ? displaySubtitle : undefined,
    };
  }, [extractDomainOrSubdomain, looksLikeId]);

  // Check if service is testnet
  const isTestnetService = (service: X402Service): boolean => {
    if (!service.accepts || service.accepts.length === 0) return false;
    
    return service.accepts.some(accept => {
      const network = accept.network?.toLowerCase() || '';
      return (
        network.includes('sepolia') ||
        network.includes('mumbai') ||
        network.includes('devnet') ||
        network.includes('testnet') ||
        network === 'base-sepolia' ||
        network === 'sepolia' ||
        network === 'polygon-mumbai' ||
        network === 'solana-devnet'
      );
    });
  };

  // Load ALL services from localStorage first, then fetch if needed
  useEffect(() => {
    const loadServices = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        setLoadingServices(true);
        const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
        const loadedServices: X402Service[] = [];

        // Check all localStorage keys that match the pattern
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('x402_services_cache_')) {
            const cached = localStorage.getItem(key);
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (
                  parsed.timestamp &&
                  Date.now() - parsed.timestamp < CACHE_DURATION &&
                  parsed.data &&
                  Array.isArray(parsed.data)
                ) {
                  loadedServices.push(...parsed.data);
                }
              } catch (e) {
                console.warn(`Invalid cache entry for ${key}:`, e);
              }
            }
          }
        }

        // Remove duplicates based on resource URL
        let uniqueServices = Array.from(
          new Map(loadedServices.map(s => [s.resource, s])).values()
        );

        // If no services in cache, fetch from discovery service
        if (uniqueServices.length === 0) {
          console.log('No services in cache, fetching from discovery service...');
          try {
            const liveServices = await x402Service.fetchLiveServices();
            uniqueServices = (liveServices || []).filter(
              (service) => service != null && service?.resource
            );
          } catch (err) {
            console.error('Error fetching live services:', err);
          }
        }

        setServices(uniqueServices);
        setLoadingServices(false);
      } catch (error) {
        console.error('Error loading services:', error);
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  // Filter services by network
  useEffect(() => {
    let filtered = [...services];

    // Filter by network (testnet vs mainnet)
    filtered = filtered.filter(service => {
      if (!service.accepts || service.accepts.length === 0) return false;
      
      const isTestnet = isTestnetService(service);
      
      if (showMainnet) {
        // Show mainnet services (not testnet)
        return !isTestnet;
      } else {
        // Show testnet services
        return isTestnet;
      }
    });

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(service => {
        const { name, subtitle } = getServiceDisplayName(service);
        const description = service.metadata?.description || '';
        const resource = service.resource || '';
        return (
          name.toLowerCase().includes(searchLower) ||
          (subtitle && subtitle.toLowerCase().includes(searchLower)) ||
          description.toLowerCase().includes(searchLower) ||
          resource.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredServices(filtered);
    setCurrentPage(1); // Reset to first page when filter changes

    // If serviceId from URL, find and select it
    if (serviceIdFromUrl && filtered.length > 0) {
      const found = filtered.find(s => generateServiceId(s.resource) === serviceIdFromUrl);
      if (found) {
        setSelectedService(found);
      }
    }
  }, [services, showMainnet, searchTerm, serviceIdFromUrl, getServiceDisplayName]);

  // Paginate filtered services
  const paginatedServices = filteredServices.slice(0, currentPage * itemsPerPage);
  const hasMore = filteredServices.length > paginatedServices.length;

  const loadMore = () => {
    setCurrentPage((prev: number) => prev + 1);
  };

  const fetchUsageStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/validate?userAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.usage);
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
    }
  }, [address]);
  

  // Fetch usage stats on mount
  useEffect(() => {
    if (address) {
      fetchUsageStats();
    }
  }, [address, fetchUsageStats]);


  const handleValidate = async (service?: X402Service) => {
    const serviceToValidate = service || selectedService;
    if (!address || !serviceToValidate) return;

    const serviceId = generateServiceId(serviceToValidate.resource);
    const { name } = getServiceDisplayName(serviceToValidate);

    // Determine if it's testnet or mainnet
    const isTestnet = isTestnetService(serviceToValidate);

    // Set validation mode based on network
    const mode = isTestnet ? 'free' : 'user-paid';
    setValidationMode(mode);
    setSelectedService(serviceToValidate);

    setIsValidating(true);
    setError(null);
    setValidationResult(null);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          service: serviceToValidate, // Send full service data
          validationMode: mode,
          userAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.error + (data.retryAfter ? ` Retry in ${Math.ceil(data.retryAfter / 60)} minutes.` : ''));
        } else {
          setError(data.error || 'Validation failed');
        }
        return;
      }

      setValidationResult(data);
      fetchUsageStats(); // Refresh usage stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  // Show loader while checking wallet connection
  if (isCheckingWallet) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <Image src="/1x402.png" alt="Loading" width={100} height={100} className="animate-pulse" />
            <h2 className="text-2xl font-bold mb-4 font-mono">Loading...</h2>
            <p className="text-gray-600 font-mono">
              Please wait while we check your wallet connection
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <AlertTriangleIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-4 font-mono">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-6 font-mono">
              Please connect your wallet to validate services
            </p>
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
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/discover"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold font-mono tracking-wider">Validate Services</h1>
              <p className="text-gray-600 mt-1 font-mono">Test x402 services on testnet or mainnet</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Service List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <div className="retro-card">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="retro-input w-full pl-10"
                    />
                  </div>

                  {/* Network Toggle */}
                  <div className="flex items-center gap-3">
                    <FilterIcon className="w-5 h-5 text-gray-600" />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMainnet}
                        onChange={(e) => setShowMainnet(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-white text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-mono font-bold">Show Mainnet</span>
                    </label>
                  </div>
                </div>

                <div className="text-sm text-gray-600 font-mono">
                  {loadingServices ? (
                    <span>Loading services...</span>
                  ) : (
                    <>
                      <span className="font-bold">{services.length}</span> total services loaded •{' '}
                      {showMainnet ? (
                        <span>Showing {filteredServices.length} mainnet services (you pay for validation)</span>
                      ) : (
                        <span>Showing {filteredServices.length} testnet services (platform pays for validation)</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Service List */}
              {loadingServices ? (
                <div className="retro-card p-12 text-center">
                  <LoaderIcon className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className="text-gray-600 font-mono">Loading services...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="retro-card p-12 text-center">
                  <AlertTriangleIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2 font-mono font-bold">No services found</p>
                  <p className="text-sm text-gray-500 font-mono">
                    Fetching services from discovery service...
                  </p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="retro-card p-12 text-center">
                  <AlertTriangleIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2 font-mono font-bold">No services match the current filter</p>
                  <p className="text-sm text-gray-500 font-mono">
                    {showMainnet 
                      ? `No mainnet services found. ${services.length} total services loaded. Try disabling "Show Mainnet" to see testnet services.`
                      : `No testnet services found. ${services.length} total services loaded. Try enabling "Show Mainnet" to see mainnet services.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedServices.map((service: X402Service) => {
                      const id = generateServiceId(service.resource);
                      const { name, subtitle } = getServiceDisplayName(service);
                      const description = service.metadata?.description || service.accepts?.[0]?.description || '';
                      const isTestnet = isTestnetService(service);
                      const isSelected = selectedService?.resource === service.resource;

                      return (
                        <div
                          key={id}
                          className={`retro-card p-4 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-blue-500 bg-blue-50'
                              : 'hover:transform hover:-translate-y-1'
                          }`}
                          onClick={() => setSelectedService(service)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold font-mono text-xl mb-1">{name}</h3>
                              {subtitle && (
                                <p className="text-xs text-gray-500 font-mono mb-2">{subtitle}</p>
                              )}
                              {description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`px-2 py-1 rounded font-mono ${
                                  isTestnet 
                                    ? 'bg-green-100 text-green-800 border border-green-300' 
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                                }`}>
                                  {isTestnet ? 'TESTNET' : 'MAINNET'}
                                </span>
                                {service.accepts?.[0]?.network && (
                                  <span className="text-gray-500 font-mono">{service.accepts[0].network}</span>
                                )}
                              </div>
                            </div>
                            <Link
                              href={`/validate/${encodeURIComponent(generateServiceId(service.resource))}/test`}
                              onClick={() => {
                                // Store service in sessionStorage for quick retrieval
                                try {
                                  sessionStorage.setItem('x402_validation_service', JSON.stringify(service));
                                } catch (e) {
                                  console.error('Error storing service in sessionStorage:', e);
                                }
                              }}
                              className="px-4 py-2 rounded-lg font-mono font-bold transition-all retro-button bg-blue-100 text-blue-800 hover:bg-blue-200 inline-block text-center"
                            >
                              Validate
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center">
                      <button
                        onClick={loadMore}
                        className="retro-button bg-gray-100"
                      >
                        Load More ({filteredServices.length - paginatedServices.length} remaining)
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Validation Results */}
              {validationResult && selectedService && (
                <div className="retro-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-mono">Validation Results</h2>
                    <div className={`px-4 py-2 rounded-full font-bold font-mono ${
                      validationResult.status === 'verified' 
                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                        : 'bg-red-100 text-red-800 border-2 border-red-500'
                    }`}>
                      {validationResult.status === 'verified' ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle2Icon className="w-5 h-5" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <XCircleIcon className="w-5 h-5" />
                          FAILED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
                    <div className="text-6xl font-bold font-mono mb-2">
                      {validationResult.score}
                      <span className="text-2xl text-gray-600">/100</span>
                    </div>
                    <div className="text-gray-600 font-mono">Validation Score</div>
                  </div>

                  {/* Test Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold font-mono mb-1">
                        {validationResult.totalTests}
                      </div>
                      <div className="text-xs text-gray-600 font-mono">Total Tests</div>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-800 font-mono mb-1">
                        {validationResult.testsPassed}
                      </div>
                      <div className="text-xs text-gray-600 font-mono">Passed</div>
                    </div>
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-800 font-mono mb-1">
                        {validationResult.testsFailed}
                      </div>
                      <div className="text-xs text-gray-600 font-mono">Failed</div>
                    </div>
                  </div>

                  {/* Test Details */}
                  <div className="space-y-3">
                    <h3 className="font-bold font-mono text-lg mb-3">Test Details</h3>
                    {validationResult.testResults.map((test: TestResult, index: number) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          test.passed 
                            ? 'bg-green-50 border-green-300'
                            : 'bg-red-50 border-red-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {test.passed ? (
                              <CheckCircle2Icon className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircleIcon className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-mono text-sm">
                              {test.method} {test.endpoint}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
                            <span>Status: {test.statusCode}</span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {test.responseTime}ms
                            </span>
                          </div>
                        </div>
                        {test.errorMessage && (
                          <div className="text-xs text-red-600 mt-2 font-mono">
                            {test.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-300 text-xs text-gray-600 space-y-1 font-mono">
                    <div>Testnet Chain: {validationResult.testnetChain}</div>
                    <div>Tokens Spent: {(validationResult.tokensSpent / 1000000).toFixed(2)} USDC</div>
                    <div>Validation ID: #{validationResult.validationId}</div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="retro-card bg-red-50 border-2 border-red-300 p-4">
                  <div className="flex items-start gap-3">
                    <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800 font-mono">{error}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6">
              {/* Selected Service Info */}
              {selectedService && (
                <div className="retro-card p-6">
                  <h3 className="font-bold font-mono mb-3">Selected Service</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 font-mono">Name:</span>
                      <span className="ml-2 font-mono font-bold">{getServiceDisplayName(selectedService).name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-mono">Network:</span>
                      <span className="ml-2 font-mono">
                        {selectedService.accepts?.[0]?.network || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-mono">Price:</span>
                      <span className="ml-2 font-mono">
                        {selectedService.accepts?.[0]?.maxAmountRequired 
                          ? `${(parseInt(selectedService.accepts[0].maxAmountRequired) / 1000000).toFixed(6)} USDC`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleValidate()}
                    disabled={isValidating}
                    className={`w-full mt-4 py-3 rounded-lg font-bold font-mono transition-all ${
                      isValidating
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'retro-button bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {isValidating ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoaderIcon className="w-5 h-5 animate-spin" />
                        Validating...
                      </span>
                    ) : (
                      'Start Validation'
                    )}
                  </button>
                </div>
              )}

              {/* What is Validation */}
              <div className="retro-card p-6">
                <h3 className="font-bold font-mono mb-3">What is Validation?</h3>
                <p className="text-sm text-gray-600 mb-4 font-mono">
                  Validation tests your x402 service to ensure:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 font-mono">
                  <li className="flex items-start gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>API responds correctly to payment headers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Endpoints return expected responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Performance meets standards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Schema validation passes</span>
                  </li>
                </ul>
              </div>

              {/* Usage Stats */}
              {usageStats && validationMode === 'free' && (
                <div className="retro-card p-6">
                  <h3 className="font-bold font-mono mb-3">Your Usage</h3>
                  <div className="space-y-3 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Today</span>
                      <span className="font-bold">{usageStats.dailyValidations}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Week</span>
                      <span className="font-bold">{usageStats.weeklyValidations}/20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Month</span>
                      <span className="font-bold">{usageStats.monthlyValidations}/50</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
