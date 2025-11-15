'use client';

import { Header } from '../../../components/ui/header';
import { useState } from 'react';
import Link from 'next/link';

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
    network: 'base'
  });

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
      
      const responseText = await response.text();
      setHealthResponse(`Status: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
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

  // Create API
  const createApi = async () => {
    // TODO: Implement API creation logic
    console.log('Creating API:', {
      apiType,
      baseUrl,
      healthEndpoint,
      apiName,
      apiDescription,
      endpoints,
      headers,
      docsType,
      docsUrl,
      docsContent,
      pricing
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <nav className="mb-6">
              <Link href="/dashboard" className="text-blue-600 hover:underline font-mono">
                ← BACK TO DASHBOARD
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
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-mono text-sm whitespace-pre-wrap">{healthResponse}</div>
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
                    NETWORK
                  </label>
                  <select
                    value={pricing.network}
                    onChange={(e) => setPricing({...pricing, network: e.target.value})}
                    className="retro-input w-full"
                  >
                    <option value="base">Base</option>
                    <option value="base-sepolia">Base Sepolia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="retro-button flex-1 text-lg py-4"
              >
                CREATE X402 API
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
