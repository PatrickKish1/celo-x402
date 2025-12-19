/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { Header } from '@/components/ui/header';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';
import { ArrowLeftIcon, CopyIcon, DownloadIcon, CodeIcon, AlertCircle, XIcon } from 'lucide-react';
import { userServiceManager } from '@/lib/user-services';
import { generateMiddleware, type Language, type MiddlewareType } from '@/lib/middleware-templates';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  price: string;
}

interface HeaderField {
  id: string;
  key: string;
  value: string;
  required: boolean;
}

export default function CreateApiPage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [apiType, setApiType] = useState<'existing' | 'native'>('existing');
  const [baseUrl, setBaseUrl] = useState('');
  const [healthEndpoint, setHealthEndpoint] = useState('/health');
  const [healthStatus, setHealthStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [healthResponse, setHealthResponse] = useState('');
  const [apiName, setApiName] = useState('');
  const [apiDescription, setApiDescription] = useState('');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [headers, setHeaders] = useState<HeaderField[]>([]);
  const [docsType, setDocsType] = useState<'swagger' | 'link' | 'manual'>('swagger');
  const [docsUrl, setDocsUrl] = useState('');
  const [docsContent, setDocsContent] = useState('');
  const [pricing, setPricing] = useState({
    basePrice: '0.05',
    currency: 'USDC',
    network: 'base',
    useCustomToken: false,
    customToken: {
      address: '',
      decimals: 6,
      name: '',
      version: '2',
      symbol: ''
    }
  });
  const [isCreating, setIsCreating] = useState(false);
  const [apiLanguage, setApiLanguage] = useState<Language>('node');
  const [middlewareType, setMiddlewareType] = useState<MiddlewareType>('middleware');
  const [showGeneratedCode, setShowGeneratedCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  // Health check function
  const testHealthEndpoint = async () => {
    if (!baseUrl || !healthEndpoint) return;
    
    setHealthStatus('testing');
    try {
      const url = `${baseUrl}${healthEndpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();
      
      // Check if response is JSON
      let formattedResponse = responseText;
      if (contentType.includes('application/json')) {
        try {
          const jsonData = JSON.parse(responseText);
          formattedResponse = JSON.stringify(jsonData, null, 2);
        } catch (e) {
          // If JSON parse fails, use original text
        }
      } else if (contentType.includes('text/html')) {
        formattedResponse = '[HTML Response - Not JSON]\n\n' + responseText.substring(0, 500) + (responseText.length > 500 ? '...\n\n(Truncated - HTML responses not supported)' : '');
      }
      
      setHealthResponse(`Status: ${response.status} ${response.statusText}\nContent-Type: ${contentType}\n\nResponse:\n${formattedResponse}`);
      setHealthStatus(response.ok ? 'success' : 'error');
    } catch (error) {
      setHealthResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHealthStatus('error');
    }
  };

  // Add new endpoint
  const addEndpoint = () => {
    const newEndpoint: Endpoint = {
      id: Date.now().toString(),
      path: '',
      method: 'GET',
      description: '',
      price: '0.05'
    };
    setEndpoints([...endpoints, newEndpoint]);
  };

  // Update endpoint
  const updateEndpoint = (id: string, field: keyof Endpoint, value: string) => {
    setEndpoints(endpoints.map(ep => 
      ep.id === id ? { ...ep, [field]: value } : ep
    ));
  };

  // Remove endpoint
  const removeEndpoint = (id: string) => {
    setEndpoints(endpoints.filter(ep => ep.id !== id));
  };

  // Add header field
  const addHeader = () => {
    const newHeader: HeaderField = {
      id: Date.now().toString(),
      key: '',
      value: '',
      required: false
    };
    setHeaders([...headers, newHeader]);
  };

  // Update header
  const updateHeader = (id: string, field: keyof HeaderField, value: string | boolean) => {
    setHeaders(headers.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  // Remove header
  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  // Generate middleware code
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
      setAlertMessage({ type: 'error', message: 'Please provide a base URL for existing API' });
      return;
    }

    try {
      const middlewareConfig = {
        price: pricing.basePrice,
        currency: pricing.currency,
        network: pricing.network,
        payTo: address,
        excludedPaths: ['/health', '/metrics'],
        excludedMethods: ['OPTIONS'],
        timeout: 30000,
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

  const handleCopy = (content: string, fileName: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!generatedCode) return;
    generatedCode.files.forEach((file: any) => {
      handleDownload(file.name, file.content);
    });
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
      setAlertMessage({ type: 'error', message: 'Please provide a base URL for existing API' });
      return;
    }

    setIsCreating(true);

    try {
      // Generate resource URL
      const resourceUrl = apiType === 'existing' 
        ? baseUrl 
        : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/x402/${apiName.toLowerCase().replace(/\s+/g, '-')}`;

      // Generate proxy URL (for proxy mode)
      const proxyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/x402/proxy/${apiName.toLowerCase().replace(/\s+/g, '-')}`;

      // Validate custom token if enabled
      if (pricing.useCustomToken) {
        if (!pricing.customToken.address.trim()) {
          setAlertMessage({ type: 'error', message: 'Please provide a token contract address' });
          setIsCreating(false);
          return;
        }
        if (!pricing.customToken.symbol.trim()) {
          setAlertMessage({ type: 'error', message: 'Please provide a token symbol' });
          setIsCreating(false);
          return;
        }
        if (!pricing.customToken.name.trim()) {
          setAlertMessage({ type: 'error', message: 'Please provide a token name' });
          setIsCreating(false);
          return;
        }
      }

      // Save to user services
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
        pricing: {
          amount: pricing.basePrice,
          currency: pricing.customToken.symbol || pricing.currency,
          network: pricing.network,
        },
        tokenConfig: pricing.useCustomToken ? {
          address: pricing.customToken.address,
          decimals: pricing.customToken.decimals,
          name: pricing.customToken.name,
          version: pricing.customToken.version,
          symbol: pricing.customToken.symbol,
        } : undefined,
      });

      setAlertMessage({ type: 'success', message: 'API created successfully! Redirecting...' });
      
      // Redirect to dashboard after a brief delay
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
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Alert Message */}
          {alertMessage && (
            <Alert 
              className={`mb-6 ${
                alertMessage.type === 'error' ? 'bg-red-50 border-red-200' : 
                alertMessage.type === 'success' ? 'bg-green-50 border-green-200' : 
                'bg-blue-50 border-blue-200'
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${
                alertMessage.type === 'error' ? 'text-red-600' : 
                alertMessage.type === 'success' ? 'text-green-600' : 
                'text-blue-600'
              }`} />
              <AlertDescription className={`flex items-center justify-between ${
                alertMessage.type === 'error' ? 'text-red-800' : 
                alertMessage.type === 'success' ? 'text-green-800' : 
                'text-blue-800'
              }`}>
                <span className="font-mono">{alertMessage.message}</span>
                <button
                  onClick={() => setAlertMessage(null)}
                  className="ml-4 p-1 hover:bg-white/50 rounded"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <nav className="mb-6">
              <Link href="/dashboard" className="text-blue-600 hover:underline font-mono text-nowrap">
                <ArrowLeftIcon className="w-4 h-4" /> BACK TO DASHBOARD
              </Link>
            </nav>
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
              CREATE NEW API
            </h1>
            <p className="text-xl font-mono text-gray-700">
              Transform existing APIs into x402 services or add native x402 APIs
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); createApi(); }} className="space-y-8">
            {/* API Type Selection */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                API TYPE
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setApiType('existing')}
                  className={`p-4 border-2 border-black text-left transition-all ${
                    apiType === 'existing' 
                      ? 'bg-black text-white' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-mono font-bold mb-2">EXISTING API</div>
                  <div className="text-sm">Wrap non-x402 APIs with x402 payment layer</div>
                </button>
                <button
                  type="button"
                  onClick={() => setApiType('native')}
                  className={`p-4 border-2 border-black text-left transition-all ${
                    apiType === 'native' 
                      ? 'bg-black text-white' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-mono font-bold mb-2">NATIVE X402</div>
                  <div className="text-sm">API already built with x402 protocol</div>
                </button>
              </div>
            </div>

            {/* Basic API Information */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                BASIC INFORMATION
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    API NAME
                  </label>
                  <input
                    type="text"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="e.g., Weather Data API"
                    className="retro-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    BASE URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="retro-input w-full"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block font-mono font-bold text-sm mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  value={apiDescription}
                  onChange={(e) => setApiDescription(e.target.value)}
                  placeholder="Describe what your API does..."
                  rows={3}
                  className="retro-input w-full"
                  required
                />
              </div>
            </div>

            {/* Health Check */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                HEALTH CHECK ENDPOINT
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    HEALTH ENDPOINT
                  </label>
                  <input
                    type="text"
                    value={healthEndpoint}
                    onChange={(e) => setHealthEndpoint(e.target.value)}
                    placeholder="/health"
                    className="retro-input w-full"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={testHealthEndpoint}
                    disabled={!baseUrl || healthStatus === 'testing'}
                    className="retro-button w-full disabled:opacity-50"
                  >
                    {healthStatus === 'testing' ? 'TESTING...' : 'TEST ENDPOINT'}
                  </button>
                </div>
                <div className="text-center">
                  {healthStatus === 'success' && (
                    <div className="text-green-600 font-mono text-sm">✓ HEALTHY</div>
                  )}
                  {healthStatus === 'error' && (
                    <div className="text-red-600 font-mono text-sm">✗ UNHEALTHY</div>
                  )}
                </div>
              </div>
              {healthResponse && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded max-h-[400px] overflow-y-auto">
                  <div className="font-mono text-sm whitespace-pre-wrap break-words">{healthResponse}</div>
                </div>
              )}
            </div>

            {/* Endpoints Management */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                API ENDPOINTS
              </h2>
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <div key={endpoint.id} className="border-2 border-black p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block font-mono font-bold text-sm mb-2">
                          ENDPOINT PATH
                        </label>
                        <input
                          type="text"
                          value={endpoint.path}
                          onChange={(e) => updateEndpoint(endpoint.id, 'path', e.target.value)}
                          placeholder="/new-report"
                          className="retro-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block font-mono font-bold text-sm mb-2">
                          HTTP METHOD
                        </label>
                        <select
                          value={endpoint.method}
                          onChange={(e) => updateEndpoint(endpoint.id, 'method', e.target.value as any)}
                          className="retro-input w-full"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                          <option value="PATCH">PATCH</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono font-bold text-sm mb-2">
                          PRICE (USDC)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={endpoint.price}
                          onChange={(e) => updateEndpoint(endpoint.id, 'price', e.target.value)}
                          className="retro-input w-full"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeEndpoint(endpoint.id)}
                          className="retro-button bg-red-100 text-red-800 w-full"
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        DESCRIPTION
                      </label>
                      <input
                        type="text"
                        value={endpoint.description}
                        onChange={(e) => updateEndpoint(endpoint.id, 'description', e.target.value)}
                        placeholder="What does this endpoint do?"
                        className="retro-input w-full"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEndpoint}
                  className="retro-button bg-gray-100 w-full"
                >
                  + ADD ENDPOINT
                </button>
              </div>
            </div>

            {/* Headers Configuration */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                CUSTOM HEADERS
              </h2>
              <p className="text-gray-600 mb-4 font-mono text-sm">
                Note: x402 handles payments, so API keys are not required. Add any other custom headers your API needs.
              </p>
              <div className="space-y-4">
                {headers.map((header) => (
                  <div key={header.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        HEADER KEY
                      </label>
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                        placeholder="X-Custom-Header"
                        className="retro-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        HEADER VALUE
                      </label>
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                        placeholder="header-value"
                        className="retro-input w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${header.id}`}
                        checked={header.required}
                        onChange={(e) => updateHeader(header.id, 'required', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`required-${header.id}`} className="font-mono text-sm">
                        REQUIRED
                      </label>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeHeader(header.id)}
                        className="retro-button bg-red-100 text-red-800 w-full"
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHeader}
                  className="retro-button bg-gray-100 w-full"
                >
                  + ADD HEADER
                </button>
              </div>
            </div>

            {/* Documentation */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                DOCUMENTATION
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    DOCUMENTATION TYPE
                  </label>
                  <select
                    value={docsType}
                    onChange={(e) => setDocsType(e.target.value as any)}
                    className="retro-input w-full"
                  >
                    <option value="swagger">Swagger/OpenAPI</option>
                    <option value="link">Documentation Link</option>
                    <option value="manual">Manual Documentation</option>
                  </select>
                </div>
                
                {docsType === 'swagger' && (
                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      SWAGGER URL
                    </label>
                    <input
                      type="url"
                      value={docsUrl}
                      onChange={(e) => setDocsUrl(e.target.value)}
                      placeholder="https://api.example.com/swagger.json"
                      className="retro-input w-full"
                    />
                  </div>
                )}
                
                {docsType === 'link' && (
                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      DOCUMENTATION URL
                    </label>
                    <input
                      type="url"
                      value={docsUrl}
                      onChange={(e) => setDocsUrl(e.target.value)}
                      placeholder="https://docs.example.com"
                      className="retro-input w-full"
                    />
                  </div>
                )}
                
                {docsType === 'manual' && (
                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      MANUAL DOCUMENTATION
                    </label>
                    <textarea
                      value={docsContent}
                      onChange={(e) => setDocsContent(e.target.value)}
                      placeholder="Describe your API endpoints, parameters, and responses..."
                      rows={6}
                      className="retro-input w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* API Language & Middleware Type */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                API LANGUAGE & MIDDLEWARE TYPE
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    YOUR API LANGUAGE
                  </label>
                  <select
                    value={apiLanguage}
                    onChange={(e) => setApiLanguage(e.target.value as Language)}
                    className="retro-input w-full"
                  >
                    <option value="node">Node.js (JavaScript/TypeScript)</option>
                    <option value="python">Python (Flask/FastAPI)</option>
                    <option value="java">Java (Spring Boot)</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    Select the language your API is built in
                  </p>
                </div>

                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    MIDDLEWARE TYPE
                  </label>
                  <select
                    value={middlewareType}
                    onChange={(e) => setMiddlewareType(e.target.value as MiddlewareType)}
                    className="retro-input w-full"
                  >
                    <option value="middleware">Middleware (Add to existing API)</option>
                    <option value="proxy">Proxy (Standalone gateway)</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    {middlewareType === 'middleware' 
                      ? 'Add x402 protection to your existing API'
                      : 'Standalone proxy that wraps your API'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={!isConnected || !apiName.trim()}
                className="retro-button w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CodeIcon className="w-4 h-4" />
                GENERATE MIDDLEWARE CODE
              </button>
            </div>

            {/* Generated Code Display */}
            {showGeneratedCode && generatedCode && (
              <div className="retro-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold font-mono tracking-wide">
                    GENERATED CODE
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      className="retro-button text-sm px-3 py-1"
                    >
                      <DownloadIcon className="w-4 h-4 inline mr-1" />
                      DOWNLOAD ALL
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGeneratedCode(false)}
                      className="retro-button bg-gray-100 text-sm px-3 py-1"
                    >
                      HIDE
                    </button>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 border-2 border-gray-300">
                  <h3 className="font-mono font-bold text-sm mb-2">INSTRUCTIONS</h3>
                  <p className="text-sm font-mono text-gray-700 whitespace-pre-line">
                    {generatedCode.instructions}
                  </p>
                </div>

                <div className="space-y-4">
                  {generatedCode.files.map((file: any, index: number) => (
                    <div key={index} className="border-2 border-black">
                      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b-2 border-black">
                        <div>
                          <div className="font-mono font-bold text-sm">{file.name}</div>
                          <div className="font-mono text-xs text-gray-600">{file.description}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(file.content, file.name)}
                            className="retro-button text-xs px-2 py-1"
                            title="Copy to clipboard"
                          >
                            {copiedFile === file.name ? '✓' : <CopyIcon className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(file.name, file.content)}
                            className="retro-button text-xs px-2 py-1"
                            title="Download file"
                          >
                            <DownloadIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <pre className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Configuration */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                PRICING CONFIGURATION
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    BASE PRICE (USDC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricing.basePrice}
                    onChange={(e) => setPricing({...pricing, basePrice: e.target.value})}
                    className="retro-input w-full"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    CURRENCY
                  </label>
                  <select
                    value={pricing.currency}
                    onChange={(e) => setPricing({...pricing, currency: e.target.value})}
                    className="retro-input w-full"
                  >
                    <option value="USDC">USDC</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    NETWORK <span className="text-xs text-gray-500 ml-2">(Popular: Base & Solana)</span>
                  </label>
                  <select
                    value={pricing.network}
                    onChange={(e) => setPricing({...pricing, network: e.target.value})}
                    className="retro-input w-full"
                  >
                    <optgroup label="Most Popular">
                      <option value="base">Base (Recommended)</option>
                      <option value="solana">Solana (Coming Soon)</option>
                    </optgroup>
                    <optgroup label="EVM Chains">
                      <option value="ethereum">Ethereum</option>
                      <option value="optimism">Optimism</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="polygon">Polygon</option>
                    </optgroup>
                    <optgroup label="Testnets">
                      <option value="base-sepolia">Base Sepolia</option>
                      <option value="sepolia">Sepolia</option>
                    </optgroup>
                  </select>
                </div>
              </div>
              
              {/* Custom Token Configuration */}
              <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="useCustomToken"
                    checked={pricing.useCustomToken}
                    onChange={(e) => setPricing({...pricing, useCustomToken: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="useCustomToken" className="font-mono font-bold text-sm cursor-pointer">
                    USE CUSTOM ERC-20 TOKEN
                    <span className="text-xs text-gray-500 ml-2 font-normal">(Advanced)</span>
                  </label>
                </div>
                
                {pricing.useCustomToken && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        TOKEN CONTRACT ADDRESS <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pricing.customToken.address}
                        onChange={(e) => setPricing({
                          ...pricing,
                          customToken: {...pricing.customToken, address: e.target.value}
                        })}
                        placeholder="0x..."
                        className="retro-input w-full font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">ERC-20 token contract address on selected network</p>
                    </div>
                    
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        TOKEN SYMBOL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pricing.customToken.symbol}
                        onChange={(e) => setPricing({
                          ...pricing,
                          customToken: {...pricing.customToken, symbol: e.target.value}
                        })}
                        placeholder="e.g., WETH, DAI"
                        className="retro-input w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Token symbol for display</p>
                    </div>
                    
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        TOKEN NAME <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pricing.customToken.name}
                        onChange={(e) => setPricing({
                          ...pricing,
                          customToken: {...pricing.customToken, name: e.target.value}
                        })}
                        placeholder="e.g., Wrapped Ether, Dai Stablecoin"
                        className="retro-input w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Full token name (for EIP-712 signing)</p>
                    </div>
                    
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        DECIMALS <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="18"
                        value={pricing.customToken.decimals}
                        onChange={(e) => setPricing({
                          ...pricing,
                          customToken: {...pricing.customToken, decimals: parseInt(e.target.value) || 0}
                        })}
                        className="retro-input w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Token decimals (USDC=6, WETH=18)</p>
                    </div>
                    
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        EIP-712 VERSION
                      </label>
                      <input
                        type="text"
                        value={pricing.customToken.version}
                        onChange={(e) => setPricing({
                          ...pricing,
                          customToken: {...pricing.customToken, version: e.target.value}
                        })}
                        placeholder="2"
                        className="retro-input w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">{`EIP-712 domain version (default: "2")`}</p>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="bg-yellow-50 border-2 border-yellow-300 p-3 rounded">
                        <p className="text-sm font-mono text-yellow-800">
                          <strong>Important:</strong> Ensure the token contract is deployed on the selected network and supports EIP-3009 (TransferWithAuthorization) or has a standard ERC-20 transfer function.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isCreating || !isConnected}
                className="retro-button flex-1 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'CREATING...' : isConnected ? 'CREATE X402 API' : 'CONNECT WALLET FIRST'}
              </button>
              <Link
                href="/dashboard"
                className="retro-button bg-gray-100 flex-1 text-center text-lg py-4"
              >
                CANCEL
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
