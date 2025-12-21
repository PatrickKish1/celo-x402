/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

/**
 * ENHANCED CREATE API PAGE
 * Features:
 * - API Import (Swagger/OpenAPI, Postman, Insomnia)
 * - Endpoint-level pricing
 * - Endpoint testing UI
 * - Output schema management
 * - Different forms for native x402 vs non-x402
 * - Updated code generation
 */

import { Header } from '@/components/ui/header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CodeIcon, 
  XIcon,
  PlusIcon,
  LoaderIcon,
} from 'lucide-react';
import { userServiceManager } from '@/lib/user-services';
import { generateMiddleware, type Language, type MiddlewareType } from '@/lib/middleware-templates';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { testEndpoint, compareResponses } from '@/lib/endpoint-testing';
import type { EnhancedEndpoint } from '@/lib/types/endpoint';
import { squidRouter, type SquidChain, type SquidToken } from '@/lib/squid-router';
import {
  ApiImportSection,
  BasicInfoSection,
  PricingConfiguration,
  EndpointCard,
  CodeGenerationModal,
} from '@/components/create-api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://x402-manager-backend.vercel.app';

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

export default function CreateApiPage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  
  // API Type
  const [apiType, setApiType] = useState<'existing' | 'native'>('existing');
  
  // Basic Info
  const [apiName, setApiName] = useState('');
  const [apiDescription, setApiDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  
  // Endpoints
  const [endpoints, setEndpoints] = useState<EnhancedEndpoint[]>([]);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  
  // Chains and Tokens (from Squid Router)
  const [chains, setChains] = useState<SquidChain[]>([]);
  const [tokensByChain, setTokensByChain] = useState<Map<string, SquidToken[]>>(new Map());
  const [loadingChains, setLoadingChains] = useState(false);
  
  // Service-level pricing (defaults) - Multi-chain support
  const [defaultPricing, setDefaultPricing] = useState({
    basePrice: '0.05',
    selectedChains: [] as Array<{
      chainId: string;
      chainName: string;
      networkName: string;
      tokenAddress: string;
      tokenSymbol: string;
      tokenDecimals: number;
      tokenName: string;
    }>,
  });
  
  // Code Generation
  const [apiLanguage, setApiLanguage] = useState<Language>('node');
  const [middlewareType, setMiddlewareType] = useState<MiddlewareType>('middleware');
  const [showGeneratedCode, setShowGeneratedCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  
  // Alerts
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch chains on mount
  useEffect(() => {
    const loadChains = async () => {
      setLoadingChains(true);
      try {
        const chainsData = await squidRouter.getChains();
        setChains(chainsData);
      } catch (error) {
        console.error('Error loading chains:', error);
        setAlertMessage({ type: 'error', message: 'Failed to load chains. Please refresh the page.' });
      } finally {
        setLoadingChains(false);
      }
    };
    loadChains();
  }, []);

  // Fetch tokens for a chain
  const loadTokensForChain = async (chainId: string) => {
    if (tokensByChain.has(chainId)) {
      return tokensByChain.get(chainId)!;
    }
    try {
      const tokens = await squidRouter.getTokens(chainId);
      setTokensByChain(prev => new Map(prev).set(chainId, tokens));
      return tokens;
    } catch (error) {
      console.error(`Error loading tokens for chain ${chainId}:`, error);
      return [];
    }
  };

  // Add chain to default pricing
  const addChainToPricing = async (chainId: string) => {
    const chain = chains.find(c => c.chainId === chainId);
    if (!chain) return;

    const tokens = await loadTokensForChain(chainId);
    if (tokens.length === 0) {
      const networkName = (chain as any).networkName || chain.chainName;
      setAlertMessage({ type: 'error', message: `No tokens found for ${networkName}` });
      return;
    }

    const defaultToken = tokens.find(t => t.symbol === 'USDC') || tokens[0];
    const networkName = (chain as any).networkName || chain.chainName;

    setDefaultPricing(prev => ({
      ...prev,
      selectedChains: [
        ...prev.selectedChains,
        {
          chainId: chain.chainId,
          chainName: chain.chainName,
          networkName: networkName,
          tokenAddress: defaultToken.address,
          tokenSymbol: defaultToken.symbol,
          tokenDecimals: defaultToken.decimals,
          tokenName: defaultToken.name,
        },
      ],
    }));
  };

  // Remove chain from pricing
  const removeChainFromPricing = (chainId: string) => {
    setDefaultPricing(prev => ({
      ...prev,
      selectedChains: prev.selectedChains.filter(c => c.chainId !== chainId),
    }));
  };

  // Update chain token
  const updateChainToken = (chainId: string, token: SquidToken) => {
    setDefaultPricing(prev => ({
      ...prev,
      selectedChains: prev.selectedChains.map(c =>
        c.chainId === chainId
          ? {
              ...c,
              tokenAddress: token.address,
              tokenSymbol: token.symbol,
              tokenDecimals: token.decimals,
              tokenName: token.name,
            }
          : c
      ),
    }));
  };

  // Handle API import
  const handleApiImport = (data: {
    name?: string;
    description?: string;
    baseUrl?: string;
    endpoints: EnhancedEndpoint[];
  }) => {
    if (data.name) setApiName(data.name);
    if (data.description) setApiDescription(data.description);
    if (data.baseUrl) setBaseUrl(data.baseUrl);
    setEndpoints(data.endpoints);
  };

  // Add new endpoint
  const addEndpoint = () => {
    const newEndpoint: EnhancedEndpoint = {
      id: `ep-${Date.now()}`,
      endpoint: '/',
      method: 'GET',
      description: '',
      pricePerRequest: null,
      network: null,
      currency: null,
      tokenAddress: null,
      tokenDecimals: null,
      tokenName: null,
      tokenVersion: null,
      tokenSymbol: null,
      expectedStatusCode: 200,
    };
    setEndpoints([...endpoints, newEndpoint]);
    setExpandedEndpoint(newEndpoint.id);
  };

  // Update endpoint
  const updateEndpoint = (id: string, updates: Partial<EnhancedEndpoint>) => {
    setEndpoints(endpoints.map(ep => 
      ep.id === id ? { ...ep, ...updates } : ep
    ));
  };

  // Remove endpoint
  const removeEndpoint = (id: string) => {
    setEndpoints(endpoints.filter(ep => ep.id !== id));
    if (expandedEndpoint === id) setExpandedEndpoint(null);
  };

  // Test endpoint
  const testEndpointHandler = async (endpoint: EnhancedEndpoint) => {
    if (!baseUrl.trim()) {
      setAlertMessage({ type: 'error', message: 'Please provide a base URL first' });
      return;
    }

    updateEndpoint(endpoint.id, { isTesting: true, testError: undefined });

    try {
      const testRequest: any = {
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        baseUrl: baseUrl,
        pathParams: endpoint.pathParams ? Object.fromEntries(
          Object.entries(endpoint.pathParams).map(([key]) => [key, ''])
        ) : undefined,
        queryParams: endpoint.queryParams ? Object.fromEntries(
          Object.entries(endpoint.queryParams).map(([key]) => [key, ''])
        ) : undefined,
        headers: endpoint.headers,
        body: endpoint.requestBody,
        isX402: apiType === 'native',
      };

      const result = await testEndpoint(testRequest);

      updateEndpoint(endpoint.id, {
        isTesting: false,
        testResponse: result.data,
        testError: result.error,
        testResponseTime: result.responseTime,
        testStatus: result.statusCode,
      });

      if (!endpoint.outputSchema && result.success && result.data) {
        try {
          const schema = inferSchemaFromResponse(result.data);
          updateEndpoint(endpoint.id, { outputSchema: schema });
        } catch (e) {
          // Ignore schema inference errors
        }
      }

      if (apiType === 'native' && endpoint.x402Response && result.success) {
        const comparison = compareResponses(result.data, endpoint.x402Response, endpoint.outputSchema);
        updateEndpoint(endpoint.id, {
          responseMatch: comparison.match,
          responseDifferences: comparison.differences,
        });
      }
    } catch (error) {
      updateEndpoint(endpoint.id, {
        isTesting: false,
        testError: error instanceof Error ? error.message : 'Test failed',
      });
    }
  };

  // Apply default pricing to all endpoints
  const applyPricingToAll = () => {
    if (defaultPricing.selectedChains.length === 0) {
      setAlertMessage({ type: 'error', message: 'Please add at least one chain first' });
      return;
    }
    
    const firstChain = defaultPricing.selectedChains[0];
    setEndpoints(endpoints.map(ep => ({
      ...ep,
      pricePerRequest: defaultPricing.basePrice,
      network: firstChain.networkName.toLowerCase().replace(/\s+/g, '-'),
      currency: firstChain.tokenSymbol,
      tokenAddress: firstChain.tokenAddress,
      tokenDecimals: firstChain.tokenDecimals,
      tokenName: firstChain.tokenName,
      tokenVersion: '2',
      tokenSymbol: firstChain.tokenSymbol,
    })));
    setAlertMessage({ type: 'success', message: 'Applied default pricing to all endpoints' });
  };

  // Generate code
  const handleGenerateCode = () => {
    if (!isConnected || !address) {
      setAlertMessage({ type: 'error', message: 'Please connect your wallet first' });
      return;
    }

    if (!apiName.trim()) {
      setAlertMessage({ type: 'error', message: 'Please provide an API name' });
      return;
    }

    if (apiType === 'existing' && !baseUrl.trim()) {
      setAlertMessage({ type: 'error', message: 'Please provide a base URL' });
      return;
    }

    try {
      // For existing APIs, require pricing configuration
      if (apiType === 'existing') {
        const firstChain = defaultPricing.selectedChains[0];
        if (!firstChain) {
          setAlertMessage({ type: 'error', message: 'Please add at least one chain first' });
          return;
        }
      }

      const firstChain = defaultPricing.selectedChains[0] || null;

      const middlewareConfig = {
        price: defaultPricing.basePrice,
        currency: firstChain?.tokenSymbol || '',
        network: firstChain?.networkName.toLowerCase().replace(/\s+/g, '-') || '',
        payTo: address,
        backendUrl: BACKEND_URL,
        endpoints: endpoints.map(ep => {
          // Find chain config - try endpoint's network in all chains or default pricing
          let endpointChain = null;
          if (ep.network) {
            endpointChain = defaultPricing.selectedChains.find(c => 
              c.networkName.toLowerCase().replace(/\s+/g, '-') === ep.network
            );
            
            if (!endpointChain) {
              const chain = chains.find(c => {
                const networkName = (c as any).networkName || c.chainName;
                return networkName.toLowerCase().replace(/\s+/g, '-') === ep.network;
              });
              if (chain && ep.tokenAddress) {
                endpointChain = {
                  chainId: chain.chainId,
                  networkName: (chain as any).networkName || chain.chainName,
                  tokenSymbol: ep.tokenSymbol || '',
                  tokenAddress: ep.tokenAddress,
                } as any;
              }
            }
          }
          
          endpointChain = endpointChain || firstChain;
          
          return {
            endpoint: ep.endpoint,
            method: ep.method,
            price: ep.pricePerRequest || defaultPricing.basePrice,
            network: endpointChain?.networkName.toLowerCase().replace(/\s+/g, '-') || '',
            currency: ep.tokenSymbol || endpointChain?.tokenSymbol || '',
            chainId: endpointChain?.chainId || '',
            tokenAddress: ep.tokenAddress || endpointChain?.tokenAddress || '',
          };
        }),
      };

      const code = generateMiddleware(apiLanguage, middlewareType, middlewareConfig);
      setGeneratedCode(code);
      setShowGeneratedCode(true);
      setAlertMessage({ type: 'success', message: 'Code generated successfully!' });
    } catch (error) {
      console.error('Error generating code:', error);
      setAlertMessage({ type: 'error', message: 'Error generating code. Please check your configuration.' });
    }
  };

  // Create API
  const createApi = async () => {
    if (!isConnected || !address) {
      setAlertMessage({ type: 'error', message: 'Please connect your wallet first' });
      return;
    }

    if (!apiName.trim()) {
      setAlertMessage({ type: 'error', message: 'Please provide an API name' });
      return;
    }

    if (apiType === 'existing' && !baseUrl.trim()) {
      setAlertMessage({ type: 'error', message: 'Please provide a base URL' });
      return;
    }

    if (endpoints.length === 0) {
      setAlertMessage({ type: 'error', message: 'Please add at least one endpoint' });
      return;
    }

    setIsCreating(true);

    try {
      const resourceUrl = apiType === 'existing' 
        ? baseUrl 
        : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/x402/${apiName.toLowerCase().replace(/\s+/g, '-')}`;

      const proxyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/x402/proxy/${apiName.toLowerCase().replace(/\s+/g, '-')}`;

      // For existing APIs, require pricing configuration
      if (apiType === 'existing') {
        const firstChain = defaultPricing.selectedChains[0];
        if (!firstChain) {
          setAlertMessage({ type: 'error', message: 'Please add at least one chain for pricing' });
          setIsCreating(false);
          return;
        }
      }

      // For native x402 APIs, use default values or endpoint-specific values
      const firstChain = defaultPricing.selectedChains[0] || null;

      const service = userServiceManager.addUserService({
        resource: resourceUrl,
        ownerAddress: address,
        name: apiName,
        description: apiDescription,
        upstreamUrl: apiType === 'existing' ? baseUrl : undefined,
        proxyUrl: proxyUrl,
        middlewareType: middlewareType,
        language: apiLanguage,
        status: 'pending',
        discoverable: true,
        pricing: firstChain ? {
          amount: defaultPricing.basePrice,
          currency: firstChain.tokenSymbol,
          network: firstChain.networkName.toLowerCase().replace(/\s+/g, '-'),
        } : {
          amount: '0',
          currency: 'USDC',
          network: 'base',
        },
        tokenConfig: firstChain ? {
          address: firstChain.tokenAddress,
          decimals: firstChain.tokenDecimals,
          name: firstChain.tokenName,
          version: '2',
          symbol: firstChain.tokenSymbol,
        } : {
          address: '',
          decimals: 18,
          name: 'USDC',
          version: '2',
          symbol: 'USDC',
        },
      });

      try {
        await fetch(`${BACKEND_URL}/api/user-services/${service.id}/endpoints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoints: endpoints.map(ep => {
              // Find chain config - first try endpoint's network, then default pricing, then first chain
              let endpointChain = null;
              if (ep.network) {
                // Try to find in default pricing chains first
                endpointChain = defaultPricing.selectedChains.find(c => 
                  c.networkName.toLowerCase().replace(/\s+/g, '-') === ep.network
                );
                
                // If not found, try to find in all chains
                if (!endpointChain) {
                  const chain = chains.find(c => {
                    const networkName = (c as any).networkName || c.chainName;
                    return networkName.toLowerCase().replace(/\s+/g, '-') === ep.network;
                  });
                  if (chain && ep.tokenAddress) {
                    // Create a chain config from the endpoint's data
                    endpointChain = {
                      chainId: chain.chainId,
                      chainName: chain.chainName,
                      networkName: (chain as any).networkName || chain.chainName,
                      tokenAddress: ep.tokenAddress,
                      tokenSymbol: ep.tokenSymbol || '',
                      tokenDecimals: ep.tokenDecimals || 18,
                      tokenName: ep.tokenName || '',
                    };
                  }
                }
              }
              
              // Fallback to first chain from default pricing or null for native APIs
              if (!endpointChain) {
                endpointChain = firstChain;
              }

              return {
                endpoint: ep.endpoint,
                method: ep.method,
                description: ep.description,
                pricePerRequest: apiType === 'existing' ? (ep.pricePerRequest || defaultPricing.basePrice) : null,
                network: endpointChain ? endpointChain.networkName.toLowerCase().replace(/\s+/g, '-') : ep.network,
                currency: ep.tokenSymbol || endpointChain?.tokenSymbol || null,
                tokenAddress: ep.tokenAddress || endpointChain?.tokenAddress || null,
                tokenDecimals: ep.tokenDecimals || endpointChain?.tokenDecimals || null,
                tokenName: ep.tokenName || endpointChain?.tokenName || null,
                tokenVersion: ep.tokenVersion || '2',
                tokenSymbol: ep.tokenSymbol || endpointChain?.tokenSymbol || null,
                extra: endpointChain ? JSON.stringify({
                  chainId: endpointChain.chainId,
                  networkName: endpointChain.networkName,
                  chainName: endpointChain.chainName,
                  supportedChains: defaultPricing.selectedChains.length > 0 
                    ? defaultPricing.selectedChains.map(c => ({
                        chainId: c.chainId,
                        networkName: c.networkName,
                        chainName: c.chainName,
                        tokenAddress: c.tokenAddress,
                        tokenSymbol: c.tokenSymbol,
                        tokenDecimals: c.tokenDecimals,
                      }))
                    : [],
                }) : null,
                pathParams: ep.pathParams ? JSON.stringify(ep.pathParams) : null,
                queryParams: ep.queryParams ? JSON.stringify(ep.queryParams) : null,
                headers: ep.headers ? JSON.stringify(ep.headers) : null,
                requestBody: ep.requestBody ? JSON.stringify(ep.requestBody) : null,
                outputSchema: ep.outputSchema ? JSON.stringify(ep.outputSchema) : null,
                expectedStatusCode: ep.expectedStatusCode,
              };
            }),
            multiChainConfig: apiType === 'existing' ? {
              basePrice: defaultPricing.basePrice,
              supportedChains: defaultPricing.selectedChains.map(c => ({
                chainId: c.chainId,
                networkName: c.networkName,
                chainName: c.chainName,
                tokenAddress: c.tokenAddress,
                tokenSymbol: c.tokenSymbol,
                tokenDecimals: c.tokenDecimals,
                tokenName: c.tokenName,
              })),
            } : null,
          }),
        });
      } catch (error) {
        console.error('Error saving endpoints:', error);
      }

      setAlertMessage({ type: 'success', message: 'API created successfully! Redirecting...' });
      
      setTimeout(() => {
        router.push(`/dashboard/services/${service.id}`);
      }, 1000);
    } catch (error) {
      console.error('Error creating API:', error);
      setAlertMessage({ type: 'error', message: 'Failed to create API. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <p className="text-2xl font-bold text-gray-900">Create New API</p>
            <p className="text-gray-600 text-base mt-1">Set up your x402-enabled API service</p>
          </div>
        </div>

        {/* Alert */}
        {alertMessage && (
          <Alert className={`mb-6 ${alertMessage.type === 'error' ? 'bg-red-50 border-red-200' : alertMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <AlertDescription className={alertMessage.type === 'error' ? 'text-red-800' : alertMessage.type === 'success' ? 'text-green-800' : 'text-blue-800'}>
              {alertMessage.message}
            </AlertDescription>
            <button onClick={() => setAlertMessage(null)} className="ml-auto">
              <XIcon className="w-4 h-4" />
            </button>
          </Alert>
        )}

        {/* API Type Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">API Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setApiType('existing')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                apiType === 'existing'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 mb-1">Existing API</div>
              <div className="text-sm text-gray-600">Proxy your existing API through x402 gateway</div>
            </button>
            <button
              onClick={() => setApiType('native')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                apiType === 'native'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 mb-1">Native x402 API</div>
              <div className="text-sm text-gray-600">Already implements x402 protocol</div>
            </button>
          </div>
        </div>

        {/* API Import Section */}
        <ApiImportSection
          onImport={handleApiImport}
          onError={(msg) => setAlertMessage({ type: 'error', message: msg })}
          onSuccess={(msg) => setAlertMessage({ type: 'success', message: msg })}
        />

        {/* Basic Information */}
        <BasicInfoSection
          apiName={apiName}
          apiDescription={apiDescription}
          baseUrl={baseUrl}
          apiType={apiType}
          onNameChange={setApiName}
          onDescriptionChange={setApiDescription}
          onBaseUrlChange={setBaseUrl}
        />

        {/* Default Pricing Configuration - Only for existing APIs */}
        {apiType === 'existing' && (
          <PricingConfiguration
            basePrice={defaultPricing.basePrice}
            selectedChains={defaultPricing.selectedChains}
            chains={chains}
            tokensByChain={tokensByChain}
            loadingChains={loadingChains}
            onBasePriceChange={(price) => setDefaultPricing({ ...defaultPricing, basePrice: price })}
            onAddChain={addChainToPricing}
            onRemoveChain={removeChainFromPricing}
            onUpdateChainToken={updateChainToken}
            onLoadTokens={loadTokensForChain}
            onApplyToAll={applyPricingToAll}
          />
        )}

        {/* Endpoints Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Endpoints</h2>
            <button
              onClick={addEndpoint}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary hover:text-primary flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Endpoint
            </button>
          </div>

          {endpoints.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No endpoints yet. Add one manually or import from documentation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <EndpointCard
                  key={endpoint.id}
                  endpoint={endpoint}
                  baseUrl={baseUrl}
                  apiType={apiType}
                  defaultPricing={defaultPricing}
                  chains={chains}
                  tokensByChain={tokensByChain}
                  isExpanded={expandedEndpoint === endpoint.id}
                  onToggleExpand={() => setExpandedEndpoint(expandedEndpoint === endpoint.id ? null : endpoint.id)}
                  onUpdate={(updates) => updateEndpoint(endpoint.id, updates)}
                  onTest={() => testEndpointHandler(endpoint)}
                  onRemove={() => removeEndpoint(endpoint.id)}
                  onLoadTokens={loadTokensForChain}
                />
              ))}
            </div>
          )}
        </div>

        {/* Code Generation & Create Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerateCode}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <CodeIcon className="w-5 h-5" />
            Generate Code
          </button>
          <button
            onClick={createApi}
            disabled={isCreating}
            className="flex-1 px-6 py-3 retro-button rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <LoaderIcon className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create API'
            )}
          </button>
        </div>

        {/* Generated Code Modal */}
        <CodeGenerationModal
          generatedCode={generatedCode}
          onClose={() => setShowGeneratedCode(false)}
          onCopySuccess={(msg) => setAlertMessage({ type: 'success', message: msg })}
        />
      </main>
    </div>
  );
}
