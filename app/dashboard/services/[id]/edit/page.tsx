/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { Header } from '@/components/ui/header';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { DEFAULT_MOCK_SERVICE, fetchServiceById, type MockService } from '@/lib/mock-services';

export default function ServiceEditPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  
  const [service, setService] = useState<MockService>(DEFAULT_MOCK_SERVICE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch service data on mount
  useEffect(() => {
    const loadService = async () => {
      setIsLoading(true);
      try {
        const serviceData = await fetchServiceById(serviceId);
        if (serviceData) {
          setService(serviceData);
        }
      } catch (error) {
        console.error('Error loading service:', error);
        setSaveMessage('Error loading service data');
      } finally {
        setIsLoading(false);
      }
    };
    loadService();
  }, [serviceId]);

  // Update service field
  const updateService = (field: string, value: any) => {
    setService(prev => ({ ...prev, [field]: value }));
  };

  // Update endpoint
  const updateEndpoint = (id: string, field: string, value: string) => {
    setService(prev => ({
      ...prev,
      endpoints: prev.endpoints.map(ep => 
        ep.id === id ? { ...ep, [field]: value } : ep
      )
    }));
  };

  // Remove endpoint
  const removeEndpoint = (id: string) => {
    setService(prev => ({
      ...prev,
      endpoints: prev.endpoints.filter(ep => ep.id !== id)
    }));
  };

  // Add endpoint
  const addEndpoint = () => {
    const newEndpoint = {
      id: Date.now().toString(),
      path: '',
      method: 'GET' as const,
      price: '0.05',
      description: ''
    };
    setService(prev => ({
      ...prev,
      endpoints: [...prev.endpoints, newEndpoint]
    }));
  };

  // Update header
  const updateHeader = (id: string, field: string, value: string | boolean) => {
    setService(prev => ({
      ...prev,
      headers: prev.headers.map(h => 
        h.id === id ? { ...h, [field]: value } : h
      )
    }));
  };

  // Remove header
  const removeHeader = (id: string) => {
    setService(prev => ({
      ...prev,
      headers: prev.headers.filter(h => h.id !== id)
    }));
  };

  // Add header
  const addHeader = () => {
    const newHeader = {
      id: Date.now().toString(),
      key: '',
      value: '',
      required: false
    };
    setService(prev => ({
      ...prev,
      headers: [...prev.headers, newHeader]
    }));
  };

  // Save changes
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Get backend URL from environment or use default
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/user-services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          upstreamUrl: service.upstreamUrl,
          proxyUrl: service.proxyUrl,
          status: service.status,
          network: service.network,
          currency: service.currency,
          discoverable: service.discoverable,
          healthEndpoint: service.healthEndpoint,
          docsType: service.docsType,
          docsUrl: service.docsUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to save changes');
      }
      
      setSaveMessage('Changes saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
      // Optionally update local state with returned data
      if (data.service) {
        setService(prev => ({
          ...prev,
          ...data.service,
        }));
      }
    } catch (error: any) {
      console.error('Error saving changes:', error);
      setSaveMessage(`Error saving changes: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <nav className="mb-6">
              <Link href="/dashboard" className="text-blue-600 hover:underline font-mono text-nowrap">
                <ArrowLeftIcon className="w-4 h-4" /> BACK TO DASHBOARD
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link href={`/dashboard/services/${serviceId}`} className="text-blue-600 hover:underline font-mono">
                SERVICE MANAGEMENT
              </Link>
            </nav>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-4xl font-bold font-mono tracking-wider mb-2">
                  EDIT SERVICE
                </h1>
                <p className="font-mono text-gray-600">
                  Modify configuration for {service.name}
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Link
                  href={`/dashboard/services/${serviceId}`}
                  className="retro-button bg-gray-100"
                >
                  CANCEL
                </Link>
                <button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="retro-button disabled:opacity-50"
                >
                  {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </div>
            
            {saveMessage && (
              <div className={`mt-4 p-3 border-2 font-mono text-sm ${
                saveMessage.includes('successfully') 
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); saveChanges(); }} className="space-y-8">
            {/* Basic Information */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                BASIC INFORMATION
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    SERVICE NAME
                  </label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService('name', e.target.value)}
                    className="retro-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    STATUS
                  </label>
                  <select
                    value={service.status}
                    onChange={(e) => updateService('status', e.target.value)}
                    className="retro-input w-full"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                    <option value="maintenance">MAINTENANCE</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <label className="block font-mono font-bold text-sm mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  value={service.description}
                  onChange={(e) => updateService('description', e.target.value)}
                  rows={3}
                  className="retro-input w-full"
                  required
                />
              </div>
            </div>

            {/* URLs and Configuration */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                URLS AND CONFIGURATION
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    UPSTREAM URL
                  </label>
                  <input
                    type="url"
                    value={service.upstreamUrl}
                    onChange={(e) => updateService('upstreamUrl', e.target.value)}
                    className="retro-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    PROXY URL
                  </label>
                  <input
                    type="url"
                    value={service.proxyUrl}
                    onChange={(e) => updateService('proxyUrl', e.target.value)}
                    className="retro-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    HEALTH ENDPOINT
                  </label>
                  <input
                    type="text"
                    value={service.healthEndpoint}
                    onChange={(e) => updateService('healthEndpoint', e.target.value)}
                    placeholder="/health"
                    className="retro-input w-full"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-sm mb-2">
                    NETWORK
                  </label>
                  <select
                    value={service.network}
                    onChange={(e) => updateService('network', e.target.value)}
                    className="retro-input w-full"
                  >
                    <option value="base">BASE</option>
                    <option value="base-sepolia">BASE SEPOLIA</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={service.discoverable}
                    onChange={(e) => updateService('discoverable', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="font-mono font-bold text-sm">MAKE SERVICE DISCOVERABLE</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Allow other users to discover and use this service
                </p>
              </div>
            </div>

            {/* Endpoints */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                API ENDPOINTS
              </h2>
              <div className="space-y-4">
                {service.endpoints.map((endpoint) => (
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
                          onChange={(e) => updateEndpoint(endpoint.id, 'method', e.target.value)}
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

            {/* Headers */}
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                CUSTOM HEADERS
              </h2>
              <p className="text-gray-600 mb-4 font-mono text-sm">
                Note: x402 handles payments, so API keys are not required. Add any other custom headers your API needs.
              </p>
              <div className="space-y-4">
                {service.headers.map((header) => (
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
                    value={service.docsType}
                    onChange={(e) => updateService('docsType', e.target.value)}
                    className="retro-input w-full"
                  >
                    <option value="swagger">Swagger/OpenAPI</option>
                    <option value="link">Documentation Link</option>
                    <option value="manual">Manual Documentation</option>
                  </select>
                </div>
                
                {service.docsType === 'swagger' && (
                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      SWAGGER URL
                    </label>
                    <input
                      type="url"
                      value={service.docsUrl}
                      onChange={(e) => updateService('docsUrl', e.target.value)}
                      placeholder="https://api.example.com/swagger.json"
                      className="retro-input w-full"
                    />
                  </div>
                )}
                
                {service.docsType === 'link' && (
                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      DOCUMENTATION URL
                    </label>
                    <input
                      type="url"
                      value={service.docsUrl}
                      onChange={(e) => updateService('docsUrl', e.target.value)}
                      placeholder="https://docs.example.com"
                      className="retro-input w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="retro-card border-red-300">
              <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide text-red-600">
                DANGER ZONE
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded">
                  <h3 className="font-mono font-bold text-red-800 mb-2">DELETE SERVICE</h3>
                  <p className="text-red-700 text-sm mb-4">
                    This action cannot be undone. This will permanently delete the service and all associated data.
                  </p>
                  <button
                    type="button"
                    className="retro-button bg-red-600 text-white hover:bg-red-700"
                  >
                    DELETE SERVICE
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
