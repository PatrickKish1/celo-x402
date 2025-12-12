'use client';

import { Header } from '../../../../components/ui/header';
import { Footer } from '../../../../components/ui/footer';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { X402Service, x402Service } from '../../../../lib/x402-service';
import Link from 'next/link';

interface TestRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  params: Record<string, string>;
}

interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  error?: string;
}

export default function ApiTestPage() {
  const params = useParams();
  const serviceId = decodeURIComponent(params.id as string);
  const [service, setService] = useState<X402Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [testRequest, setTestRequest] = useState<TestRequest>({
    method: 'GET',
    url: '',
    headers: {},
    body: '',
    params: {}
  });
  const [testResponse, setTestResponse] = useState<TestResponse | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showParams, setShowParams] = useState(false);

  useEffect(() => {
    async function fetchServiceDetails() {
      try {
        setLoading(true);
        const serviceData = await x402Service.getServiceDetails(serviceId);
        if (serviceData) {
          setService(serviceData);
          // Pre-populate the test request with service details
          const primaryPayment = serviceData.accepts[0];
          const schema = primaryPayment.outputSchema.input;
          
          // Pre-populate headers and params from schema if available
          const defaultHeaders: Record<string, string> = {};
          const defaultBody: Record<string, any> = {};
          const defaultParams: Record<string, string> = {};
          
          if (schema.headerFields) {
            Object.entries(schema.headerFields).forEach(([key, field]: [string, any]) => {
              if (!field.required) {
                defaultHeaders[key] = field.description || '';
              }
            });
          }
          
          if (schema.bodyFields) {
            Object.entries(schema.bodyFields).forEach(([key, field]: [string, any]) => {
              if (field.default !== undefined) {
                defaultBody[key] = field.default;
              }
            });
          }
          
          setTestRequest(prev => ({
            ...prev,
            method: schema.method,
            url: primaryPayment.resource,
            headers: defaultHeaders,
            body: Object.keys(defaultBody).length > 0 ? JSON.stringify(defaultBody, null, 2) : '',
            params: defaultParams
          }));
          
          // Auto-show headers/params if schema defines them
          if (schema.headerFields && Object.keys(schema.headerFields).length > 0) {
            setShowHeaders(true);
          }
        }
      } catch (err) {
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false);
      }
    }

    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  const addHeader = () => {
    setTestRequest(prev => ({
      ...prev,
      headers: { ...prev.headers, '': '' }
    }));
  };

  const updateHeader = (key: string, value: string, oldKey?: string) => {
    setTestRequest(prev => {
      const newHeaders = { ...prev.headers };
      if (oldKey && oldKey !== key) {
        delete newHeaders[oldKey];
      }
      newHeaders[key] = value;
      return { ...prev, headers: newHeaders };
    });
  };

  const removeHeader = (key: string) => {
    setTestRequest(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const addParam = () => {
    setTestRequest(prev => ({
      ...prev,
      params: { ...prev.params, '': '' }
    }));
  };

  const updateParam = (key: string, value: string, oldKey?: string) => {
    setTestRequest(prev => {
      const newParams = { ...prev.params };
      if (oldKey && oldKey !== key) {
        delete newParams[oldKey];
      }
      newParams[key] = value;
      return { ...prev, params: newParams };
    });
  };

  const removeParam = (key: string) => {
    setTestRequest(prev => {
      const newParams = { ...prev.params };
      delete newParams[key];
      return { ...prev, params: newParams };
    });
  };

  const executeTest = async () => {
    if (!service) return;

    setIsTesting(true);
    setTestResponse(null);

    try {
      const startTime = Date.now();
      
      // Build URL with query parameters
      let url = testRequest.url;
      if (Object.keys(testRequest.params).length > 0) {
        const urlParams = new URLSearchParams();
        Object.entries(testRequest.params).forEach(([key, value]) => {
          if (key && value) urlParams.append(key, value);
        });
        url += `?${urlParams.toString()}`;
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...testRequest.headers
      };

      // Remove empty header keys
      Object.keys(headers).forEach(key => {
        if (!key.trim()) delete headers[key];
      });

      // Make the request
      const response = await fetch(url, {
        method: testRequest.method,
        headers,
        body: testRequest.method !== 'GET' ? testRequest.body : undefined
      });

      const responseTime = Date.now() - startTime;
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get response body
      let responseBody = '';
      try {
        responseBody = await response.text();
        // Try to format JSON
        try {
          const jsonBody = JSON.parse(responseBody);
          responseBody = JSON.stringify(jsonBody, null, 2);
        } catch {
          // Not JSON, keep as is
        }
      } catch {
        responseBody = 'Unable to read response body';
      }

      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: responseTime
      });

    } catch (error) {
      setTestResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        time: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <div className="h-16 w-16 bg-gray-200 mx-auto mb-4 animate-pulse"></div>
            <h2 className="text-xl font-bold font-mono mb-2">LOADING API TESTER</h2>
            <p className="text-gray-600 font-mono">Preparing testing interface...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <div className="h-16 w-16 bg-red-200 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold font-mono mb-2 text-red-600">SERVICE NOT FOUND</h2>
            <p className="text-gray-600 font-mono mb-6">Unable to load service details</p>
            <Link href="/discover" className="retro-button">
              BACK TO DISCOVERY
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tags = x402Service.getServiceTags(service);
  const primaryPayment = service.accepts[0];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href={`/discover/${encodeURIComponent(serviceId)}`} className="text-blue-600 hover:underline font-mono">
              ← BACK TO SERVICE DETAILS
            </Link>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
              API TESTER
            </h1>
            <p className="text-xl font-mono text-gray-700 mb-4">
              Test the {service.metadata.name || service.resource.split('/').pop()} API directly
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-sm font-mono border border-gray-300"
                >
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Request Panel */}
            <div className="space-y-6">
              <div className="retro-card">
                <h2 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  REQUEST CONFIGURATION
                </h2>
                
                {/* Method and URL */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <select
                    value={testRequest.method}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, method: e.target.value }))}
                    className="retro-input"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  <input
                    type="text"
                    value={testRequest.url}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="API Endpoint URL"
                    className="retro-input col-span-2"
                  />
                </div>

                {/* Headers */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowHeaders(!showHeaders)}
                      className="font-mono font-bold text-sm"
                    >
                      {showHeaders ? 'HIDE' : 'SHOW'} HEADERS
                    </button>
                    <button
                      onClick={addHeader}
                      className="text-blue-600 hover:underline font-mono text-sm"
                    >
                      + ADD HEADER
                    </button>
                  </div>
                  
                  {showHeaders && (
                    <div className="space-y-2">
                      {Object.entries(testRequest.headers).map(([key, value], index) => (
                        <div key={index} className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => updateHeader(e.target.value, value, key)}
                            placeholder="Header name"
                            className="retro-input text-sm"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateHeader(key, e.target.value)}
                            placeholder="Header value"
                            className="retro-input text-sm"
                          />
                          <button
                            onClick={() => removeHeader(key)}
                            className="text-red-600 hover:underline font-mono text-sm"
                          >
                            REMOVE
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Query Parameters */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowParams(!showParams)}
                      className="font-mono font-bold text-sm"
                    >
                      {showParams ? 'HIDE' : 'SHOW'} QUERY PARAMETERS
                    </button>
                    <button
                      onClick={addParam}
                      className="text-blue-600 hover:underline font-mono text-sm"
                    >
                      + ADD PARAM
                    </button>
                  </div>
                  
                  {showParams && (
                    <div className="space-y-2">
                      {Object.entries(testRequest.params).map(([key, value], index) => (
                        <div key={index} className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => updateParam(e.target.value, value, key)}
                            placeholder="Parameter name"
                            className="retro-input text-sm"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateParam(key, e.target.value)}
                            placeholder="Parameter value"
                            className="retro-input text-sm"
                          />
                          <button
                            onClick={() => removeParam(key)}
                            className="text-red-600 hover:underline font-mono text-sm"
                          >
                            REMOVE
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schema-based Body Fields */}
                {testRequest.method !== 'GET' && service && service.accepts[0].outputSchema.input.bodyFields && (
                  <div className="mb-4">
                    <label className="block font-mono font-bold text-sm mb-2">
                      REQUEST BODY FIELDS
                    </label>
                    <div className="space-y-3 p-3 border-2 border-gray-300 bg-gray-50">
                      {Object.entries(service.accepts[0].outputSchema.input.bodyFields).map(([fieldName, fieldSchema]: [string, any]) => (
                        <div key={fieldName}>
                          <label className="block text-xs font-mono mb-1">
                            {fieldName.toUpperCase()}
                            {fieldSchema.required && <span className="text-red-600">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={fieldSchema.description || fieldName}
                            defaultValue={fieldSchema.default || ''}
                            onChange={(e) => {
                              try {
                                const bodyObj = testRequest.body ? JSON.parse(testRequest.body) : {};
                                bodyObj[fieldName] = e.target.value;
                                setTestRequest(prev => ({ ...prev, body: JSON.stringify(bodyObj, null, 2) }));
                              } catch {
                                const bodyObj: Record<string, any> = {};
                                bodyObj[fieldName] = e.target.value;
                                setTestRequest(prev => ({ ...prev, body: JSON.stringify(bodyObj, null, 2) }));
                              }
                            }}
                            className="retro-input w-full text-sm"
                          />
                          {fieldSchema.description && (
                            <p className="text-xs text-gray-600 mt-1">{fieldSchema.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Request Body (Advanced) */}
                {testRequest.method !== 'GET' && (
                  <div className="mb-4">
                    <label className="block font-mono font-bold text-sm mb-2">
                      RAW REQUEST BODY (Advanced)
                    </label>
                    <textarea
                      value={testRequest.body}
                      onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Enter JSON request body..."
                      rows={6}
                      className="retro-input w-full text-xs font-mono"
                    />
                  </div>
                )}

                {/* Execute Button */}
                <button
                  onClick={executeTest}
                  disabled={isTesting || !testRequest.url}
                  className="retro-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? 'EXECUTING...' : 'EXECUTE REQUEST'}
                </button>
              </div>

              {/* Service Info */}
              <div className="retro-card">
                <h3 className="font-mono font-bold mb-2">SERVICE INFORMATION</h3>
                <div className="text-sm space-y-1">
                  <div><span className="font-bold">Price:</span> {x402Service.formatUSDCAmount(primaryPayment.maxAmountRequired)} USDC</div>
                  <div><span className="font-bold">Network:</span> {primaryPayment.network}</div>
                  <div><span className="font-bold">Timeout:</span> {primaryPayment.maxTimeoutSeconds}s</div>
                </div>
              </div>
            </div>

            {/* Response Panel */}
            <div className="space-y-6">
              <div className="retro-card">
                <h2 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  RESPONSE
                </h2>
                
                {testResponse ? (
                  <div className="space-y-4">
                    {/* Response Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-mono font-bold ${
                          testResponse.status >= 200 && testResponse.status < 300
                            ? 'bg-green-100 text-green-800'
                            : testResponse.status >= 400
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {testResponse.status} {testResponse.statusText}
                        </span>
                        <span className="text-sm text-gray-600">
                          {testResponse.time}ms
                        </span>
                      </div>
                    </div>

                    {/* Response Headers */}
                    <div>
                      <h4 className="font-mono font-bold text-sm mb-2">RESPONSE HEADERS</h4>
                      <div className="bg-gray-100 border border-gray-300 p-2 max-h-32 overflow-y-auto">
                        {Object.entries(testResponse.headers).map(([key, value]) => (
                          <div key={key} className="text-xs font-mono">
                            <span className="font-bold">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Response Body */}
                    <div>
                      <h4 className="font-mono font-bold text-sm mb-2">RESPONSE BODY</h4>
                      <pre className="bg-gray-100 border border-gray-300 p-3 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
                        {testResponse.error || testResponse.body}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="h-16 w-16 bg-gray-200 mx-auto mb-4"></div>
                    <p className="font-mono">No response yet</p>
                    <p className="text-sm">Execute a request to see the response here</p>
                  </div>
                )}
              </div>

              {/* x402 Payment Info */}
              <div className="retro-card">
                <h3 className="font-mono font-bold mb-2">X402 PAYMENT INFO</h3>
                <div className="text-sm space-y-1">
                  <div><span className="font-bold">Asset:</span> {primaryPayment.extra.name}</div>
                  <div><span className="font-bold">Scheme:</span> {primaryPayment.scheme}</div>
                  <div><span className="font-bold">Pay To:</span> {primaryPayment.payTo.slice(0, 6)}...{primaryPayment.payTo.slice(-4)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
