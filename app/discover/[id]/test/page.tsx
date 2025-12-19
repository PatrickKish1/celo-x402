/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { X402Service, x402Service } from '@/lib/x402-service';
import { x402Wallet } from '@/lib/x402-wallet';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { validateEndpointResponse, validateResponseAgainstSchema } from '@/lib/x402-response-validator';
import Link from 'next/link';
import { ArrowLeftIcon, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { CrossChainPaymentModal } from '@/components/cross-chain-payment-modal';
import { SquidSwapModal } from '@/components/squid-swap-modal';
import Image from 'next/image';
import { x402Payment } from '@/lib/x402-payment';

interface TestRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  params: Record<string, string>;
}

interface ResponseValidation {
  isValid: boolean;
  hasData: boolean;
  dataType?: string;
  error?: string;
  warnings?: string[];
}

interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  error?: string;
  validation?: ResponseValidation;
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
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [visualizeResponse, setVisualizeResponse] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSquidSwapModal, setShowSquidSwapModal] = useState(false);
  const [pendingPaymentRequirement, setPendingPaymentRequirement] = useState<any>(null);
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();

  useEffect(() => {
    // Initialize wallet service when wallet is connected
    if (isConnected && address) {
      x402Wallet.initializeFromWagmi(isConnected, address).catch(console.error);
    } else {
      // Clear wallet state when disconnected
      x402Wallet.disconnectWallet();
    }
  }, [isConnected, address]);

  useEffect(() => {
    async function fetchServiceDetails() {
      try {
        setLoading(true);
        const serviceData = await x402Service.getServiceDetails(serviceId);
        if (serviceData) {
          setService(serviceData);
          // Pre-populate the test request with service details
          const primaryPayment = serviceData?.accepts?.[0];
          if (!primaryPayment) return;
          const schema = primaryPayment?.outputSchema?.input;
          
          // Pre-populate headers and params from schema if available
          const defaultHeaders: Record<string, string> = {};
          const defaultBody: Record<string, any> = {};
          const defaultParams: Record<string, string> = {};
          const schemaInput = schema as any;
          
          if (schemaInput && typeof schemaInput === 'object' && 'headerFields' in schemaInput) {
            Object.entries(schemaInput.headerFields || {}).forEach(([key, field]: [string, any]) => {
              if (!field.required) {
                defaultHeaders[key] = field.description || '';
              }
            });
          }
          
          if (schemaInput && typeof schemaInput === 'object' && 'bodyFields' in schemaInput) {
            Object.entries(schemaInput.bodyFields || {}).forEach(([key, field]: [string, any]) => {
              if (field.default !== undefined) {
                defaultBody[key] = field.default;
              }
            });
          }
          
          // Smart method detection if schema doesn't specify
          let detectedMethod = schema?.method || 'GET';
          if (!schema?.method) {
            // Check URL patterns that typically indicate POST/PUT/DELETE
            const resourceUrl = (primaryPayment?.resource || '').toLowerCase();
            const description = (primaryPayment?.description || serviceData?.metadata?.description || '').toLowerCase();
            
            if (
              resourceUrl.includes('/create') || 
              resourceUrl.includes('/submit') || 
              resourceUrl.includes('/add') ||
              resourceUrl.includes('/register') ||
              resourceUrl.includes('/post') ||
              description.includes('create') ||
              description.includes('submit') ||
              description.includes('post data')
            ) {
              detectedMethod = 'POST';
            } else if (
              resourceUrl.includes('/update') || 
              resourceUrl.includes('/edit') ||
              resourceUrl.includes('/modify') ||
              description.includes('update') ||
              description.includes('modify')
            ) {
              detectedMethod = 'PUT';
            } else if (
              resourceUrl.includes('/delete') || 
              resourceUrl.includes('/remove') ||
              description.includes('delete') ||
              description.includes('remove')
            ) {
              detectedMethod = 'DELETE';
            }
          }
          
          setTestRequest(prev => ({
            ...prev,
            method: detectedMethod,
            url: primaryPayment?.resource || '',
            headers: defaultHeaders,
            body: Object.keys(defaultBody).length > 0 ? JSON.stringify(defaultBody, null, 2) : '',
            params: defaultParams
          }));
          
          // Auto-show headers/params if schema defines them
          if (schemaInput.headerFields && Object.keys(schemaInput.headerFields).length > 0) {
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

    // Check if wallet is connected
    if (!isConnected || !address) {
      setTestResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        time: 0,
        error: 'Wallet not connected. Please connect your wallet to make x402 payments.'
      });
      return;
    }

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

      // Prepare request options
      const requestOptions: RequestInit = {
        method: testRequest.method,
        headers,
        body: testRequest.method !== 'GET' ? testRequest.body : undefined
      };

      // Use proxy to bypass CORS restrictions
      // First, make initial request through proxy to get payment requirements
      const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method: testRequest.method,
          headers: requestOptions.headers,
          body: requestOptions.body,
          params: testRequest.params,
        }),
      });

      const proxyData = await proxyResponse.json();
      
      // If not 402, return the proxied response
      if (proxyData.status !== 402) {
        const nonPaymentResponseTime = Date.now() - startTime;
        
        // Get response body
        let responseBody = proxyData.body || '';
        let responseData: any = null;
        try {
          responseData = JSON.parse(responseBody);
          responseBody = JSON.stringify(responseData, null, 2);
        } catch {
          // Not JSON, keep as is
        }

        // Validate response
        let validationResult = null;
        if (proxyData.status === 200 && responseData) {
          const outputSchema = service?.accepts?.[0]?.outputSchema;
          if (outputSchema) {
            validationResult = validateResponseAgainstSchema(responseData, outputSchema);
          } else {
            const hasData = typeof responseData === 'object' 
              ? Object.keys(responseData).length > 0
              : responseBody.length > 10;
            validationResult = {
              isValid: hasData,
              hasData,
              dataType: typeof responseData === 'object' ? 'json' : 'text',
              error: hasData ? undefined : 'Response appears to be empty or invalid',
            };
          }
        } else if (proxyData.status === 200 && !responseData && responseBody) {
          validationResult = {
            isValid: responseBody.length > 10,
            hasData: responseBody.length > 10,
            dataType: 'text',
            error: responseBody.length <= 10 ? 'Response too small' : undefined,
          };
        }

        setTestResponse({
          status: proxyData.status,
          statusText: proxyData.statusText || 'OK',
          headers: proxyData.headers || {},
          body: responseBody,
          time: nonPaymentResponseTime,
          validation: validationResult || undefined,
        });
        return;
      }

      // Handle 402 payment flow
      // Parse payment requirements from proxy response
      let paymentRequirements: any;
      try {
        const responseData = typeof proxyData.body === 'string' ? JSON.parse(proxyData.body) : proxyData.body;
        if (responseData.accepts && Array.isArray(responseData.accepts) && responseData.accepts.length > 0) {
          const firstAccept = responseData.accepts[0];
          paymentRequirements = {
            x402Version: responseData.x402Version || 1,
            scheme: firstAccept.scheme || 'exact',
            network: firstAccept.network,
            maxAmountRequired: firstAccept.maxAmountRequired,
            resource: firstAccept.resource || url,
            description: firstAccept.description,
            mimeType: firstAccept.mimeType,
            payTo: firstAccept.payTo,
            maxTimeoutSeconds: firstAccept.maxTimeoutSeconds || 300,
            asset: firstAccept.asset,
            extra: firstAccept.extra || { name: 'USD Coin', version: '2' },
          };
        } else {
          paymentRequirements = responseData;
        }
      } catch (error) {
        throw new Error(`Failed to parse payment requirements from 402 response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Store payment requirement and show modal
      setPendingPaymentRequirement({ paymentRequirements, url, requestOptions });
      setShowPaymentModal(true);
      setIsTesting(false);
      return; // Exit here and let the modal handle the next step
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

  // Handle payment with native token (direct payment)
  const handleProceedWithNativePayment = async () => {
    if (!pendingPaymentRequirement || !address) return;

    setIsTesting(true);
    const startTime = Date.now();

    try {
      const { paymentRequirements, url, requestOptions } = pendingPaymentRequirement;

      // Sign payment using x402 wallet service
      const signedPayment = await x402Wallet.signPaymentAuthorization(paymentRequirements);
      const paymentHeader = Buffer.from(JSON.stringify(signedPayment.payload)).toString('base64');

      // Make paid request through proxy
      const paidProxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method: testRequest.method,
          headers: {
            ...requestOptions.headers,
            'X-PAYMENT': paymentHeader,
          },
          body: requestOptions.body,
          params: testRequest.params,
        }),
      });

      const paidProxyData = await paidProxyResponse.json();
      const responseTime = Date.now() - startTime;
      
      // Get response body
      let responseBody = paidProxyData.body || '';
      let responseData: any = null;
      try {
        responseData = JSON.parse(responseBody);
        responseBody = JSON.stringify(responseData, null, 2);
      } catch {
        // Not JSON, keep as is
      }

      // Validate response
      let validationResult = null;
      if (paidProxyData.status === 200 && responseData) {
        const outputSchema = service?.accepts?.[0]?.outputSchema;
        if (outputSchema) {
          validationResult = validateResponseAgainstSchema(responseData, outputSchema);
        } else {
          const hasData = typeof responseData === 'object' 
            ? Object.keys(responseData).length > 0
            : responseBody.length > 10;
          validationResult = {
            isValid: hasData,
            hasData,
            dataType: typeof responseData === 'object' ? 'json' : 'text',
            error: hasData ? undefined : 'Response appears to be empty or invalid',
          };
        }
      } else if (paidProxyData.status === 200 && !responseData && responseBody) {
        validationResult = {
          isValid: responseBody.length > 10,
          hasData: responseBody.length > 10,
          dataType: 'text',
          error: responseBody.length <= 10 ? 'Response too small' : undefined,
        };
      }

      setTestResponse({
        status: paidProxyData.status,
        statusText: paidProxyData.statusText || 'OK',
        headers: paidProxyData.headers || {},
        body: responseBody,
        time: responseTime,
        validation: validationResult || undefined,
      });

      // Clear pending payment
      setPendingPaymentRequirement(null);
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

  // Handle payment with swap (cross-chain)
  const handleProceedWithSwap = async () => {
    if (!pendingPaymentRequirement || !address) return;

    setIsTesting(true);
    
    try {
      // Close the cross-chain payment modal
      setShowPaymentModal(false);
      
      // Open Squid Swap Modal for cross-chain payment
      setShowSquidSwapModal(true);
      
    } catch (error) {
      setTestResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        time: 0,
        error: error instanceof Error ? error.message : 'Failed to initialize cross-chain swap'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle swap completion
  const handleSwapComplete = async (txHash: string) => {
    if (!pendingPaymentRequirement || !address) return;
    
    try {
      // console.log('Swap completed with tx hash:', txHash);
      
      // Close the swap modal
      setShowSquidSwapModal(false);
      
      // Show processing message
      setTestResponse({
        status: 200,
        statusText: 'Processing',
        headers: {},
        body: JSON.stringify({
          message: 'Swap completed! Processing x402 payment...',
          txHash,
          note: 'Please wait while we complete the payment and fetch the API response.',
        }, null, 2),
        time: 0
      });
      
      // Wait a moment for tokens to settle (same-chain swaps are usually instant)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now make the actual x402 payment and API request
      setIsTesting(true);
      const startTime = Date.now();
      
      const { paymentRequirements, url, requestOptions } = pendingPaymentRequirement;
      
      // console.log(' Retrying x402 payment after swap...');
      
      // Sign payment using x402 wallet service
      const payment = await x402Payment.executePayment({
        amount: paymentRequirements.maxAmountRequired,
        token: paymentRequirements.asset,
        recipient: paymentRequirements.payTo,
        network: paymentRequirements.network,
        userAddress: address,
      });
      
      // console.log(' Payment signed:', payment);
      
      // Make the paid request with payment proof
      const paidResponse = await fetch(url, {
        ...requestOptions,
        headers: {
          ...requestOptions.headers,
          'X-Payment-Signature': payment.signature,
          'X-Payment-Token': payment.token,
          'X-Payment-Amount': payment.amount,
        },
      });
      
      const responseTime = Date.now() - startTime;
      const responseBody = await paidResponse.text();
      
      // Try to parse JSON response
      let responseData: any;
      let validationResult: ResponseValidation | null = null;
      
      try {
        responseData = JSON.parse(responseBody);
        const hasData = responseData && Object.keys(responseData).length > 0;
        
        if (paidResponse.ok) {
          validationResult = {
            isValid: hasData,
            hasData,
            dataType: typeof responseData === 'object' ? 'json' : 'text',
            error: hasData ? undefined : 'Response appears to be empty or invalid',
          };
        }
      } catch (e) {
        // Not JSON, treat as text
        validationResult = {
          isValid: responseBody.length > 10,
          hasData: responseBody.length > 10,
          dataType: 'text',
          error: responseBody.length <= 10 ? 'Response too small' : undefined,
        };
      }
      
      // Show the actual API response
      setTestResponse({
        status: paidResponse.status,
        statusText: paidResponse.statusText || 'OK',
        headers: Object.fromEntries(paidResponse.headers.entries()),
        body: responseBody,
        time: responseTime,
        validation: validationResult || undefined,
      });
      
      // Clear pending payment
      setPendingPaymentRequirement(null);
      
    } catch (error) {
      console.error('Error completing payment after swap:', error);
      setTestResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        time: 0,
        error: error instanceof Error ? error.message : 'Failed to complete payment after swap'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: 'headers' | 'body') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'headers') {
        setCopiedHeaders(true);
        setTimeout(() => setCopiedHeaders(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Parse JSON response and detect visualizable content
  const parseResponseForVisualization = (body: string) => {
    try {
      const parsed = JSON.parse(body);
      return parsed;
    } catch {
      return null;
    }
  };

  // Check if URL is likely an image
  const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  };

  // Check if a key name suggests it's a URL/link
  const isLikelyUrlKey = (key: string): boolean => {
    const urlKeys = ['url', 'link', 'href', 'uri', 'website', 'source'];
    return urlKeys.some(k => key.toLowerCase().includes(k));
  };

  // Render visualized response
  const renderVisualizedResponse = (data: any) => {
    if (!data) return null;

    // Handle nested result/payload structure
    let actualData = data;
    if (data.result && typeof data.result === 'object') {
      actualData = data.result;
    }
    if (actualData.payload && typeof actualData.payload === 'object') {
      actualData = actualData.payload;
    }

    // Check if it's an array of objects
    if (Array.isArray(actualData) || (actualData.results && Array.isArray(actualData.results))) {
      const items = Array.isArray(actualData) ? actualData : actualData.results;
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-mono font-bold text-sm">
              {items.length} ITEM{items.length !== 1 ? 'S' : ''} FOUND
            </h5>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto">
            {items.map((item: any, index: number) => (
              <div key={index} className="border-2 border-gray-300 p-3 bg-white hover:bg-gray-50 transition-colors">
                {Object.entries(item).map(([key, value]: [string, any]) => {
                  // Skip empty values
                  if (value === null || value === undefined || value === '') return null;

                  // Check if it's a URL/link
                  const isUrl = isLikelyUrlKey(key) && typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
                  const isImage = isUrl && isImageUrl(value as string);

                  return (
                    <div key={key} className="mb-2 last:mb-0">
                      <div className="text-xs font-mono font-bold text-gray-600 uppercase mb-0.5">
                        {key.replace(/_/g, ' ')}
                      </div>
                      {isImage ? (
                        <Image
                          width={100}
                          height={100}
                          src={value as string} 
                          alt={key} 
                          className="max-w-full h-auto max-h-48 object-contain border border-gray-300"
                          onError={(e) => {
                            // Fallback to link if image fails to load
                            (e.target as HTMLElement).style.display = 'none';
                            const link = document.createElement('a');
                            link.href = value as string;
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            link.className = 'text-blue-600 hover:underline text-sm break-all';
                            link.textContent = value as string;
                            (e.target as HTMLElement).parentNode?.appendChild(link);
                          }}
                        />
                      ) : isUrl ? (
                        <Link 
                          href={value as string} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {value as string}
                        </Link>
                      ) : typeof value === 'object' ? (
                        <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                          {String(value)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Handle single object
    if (typeof actualData === 'object') {
      return (
        <div className="border-2 border-gray-300 p-4 bg-white max-h-[600px] overflow-y-auto">
          {Object.entries(actualData).map(([key, value]: [string, any]) => {
            if (value === null || value === undefined) return null;

            const isUrl = isLikelyUrlKey(key) && typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
            const isImage = isUrl && isImageUrl(value as string);

            return (
              <div key={key} className="mb-3 last:mb-0">
                <div className="text-xs font-mono font-bold text-gray-600 uppercase mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                {isImage ? (
                  <Image
                    width={100}
                    height={100}
                    src={value as string} 
                    alt={key} 
                    className="max-w-full h-auto max-h-64 object-contain border border-gray-300"
                    onError={(e) => {
                      // Fallback to link if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                      const link = document.createElement('a');
                      link.href = value as string;
                      link.target = '_blank';
                      link.rel = 'noopener noreferrer';
                      link.className = 'text-blue-600 hover:underline text-sm break-all';
                      link.textContent = value as string;
                      (e.target as HTMLElement).parentNode?.appendChild(link);
                    }}
                  />
                ) : isUrl ? (
                  <Link 
                    href={value as string} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {value as string}
                  </Link>
                ) : typeof value === 'object' ? (
                  <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {String(value)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
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
      </div>
    );
  }

  const tags = x402Service.getServiceTags(service);
  const primaryPayment = service?.accepts?.[0];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href={`/discover/${serviceId}`} className="text-blue-600 hover:underline font-mono text-nowrap">
              <ArrowLeftIcon className="w-4 h-4" /> BACK TO SERVICE DETAILS
            </Link>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
              API TESTER
            </h1>
            <p className="text-xl font-mono text-gray-700 mb-4">
              Test the {service?.metadata?.name || service?.resource?.split('/').pop() || 'API'} API directly
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
                {testRequest.method !== 'GET' && service && service?.accepts?.[0]?.outputSchema?.input && (service.accepts[0]?.outputSchema?.input as any)?.bodyFields && (
                  <div className="mb-4">
                    <label className="block font-mono font-bold text-sm mb-2">
                      REQUEST BODY FIELDS
                    </label>
                    <div className="space-y-3 p-3 border-2 border-gray-300 bg-gray-50">
                      {Object.entries((service.accepts[0]?.outputSchema?.input as any)?.bodyFields || {}).map(([fieldName, fieldSchema]: [string, any]) => (
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

                {/* Request Body for POST/PUT/PATCH/DELETE */}
                {testRequest.method !== 'GET' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-mono font-bold text-sm">
                        REQUEST BODY (JSON) {testRequest.method === 'POST' && <span className="text-red-600">*</span>}
                      </label>
                      <button
                        onClick={() => {
                          const exampleBody = testRequest.method === 'POST' 
                            ? '{\n  "example": "value",\n  "key": "data"\n}'
                            : testRequest.method === 'PUT'
                            ? '{\n  "id": "123",\n  "updatedField": "new value"\n}'
                            : '{\n  "data": "value"\n}';
                          setTestRequest(prev => ({ ...prev, body: exampleBody }));
                        }}
                        className="text-blue-600 hover:underline font-mono text-xs"
                      >
                        INSERT EXAMPLE
                      </button>
                    </div>
                    <textarea
                      value={testRequest.body}
                      onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                      placeholder={`Enter JSON request body for ${testRequest.method} request...\n\nExample:\n{\n  "field1": "value1",\n  "field2": "value2"\n}`}
                      rows={8}
                      className="retro-input w-full text-xs font-mono"
                    />
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      {`Tip: ${testRequest.method} requests typically require a JSON body with the data to send`}
                    </p>
                    {!testRequest.body && testRequest.method === 'POST' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded">
                        <p className="text-xs font-mono text-yellow-800">
                          {`POST requests usually require a request body. Click "INSERT EXAMPLE" or enter your JSON data above.`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Execute/Connect Button - Single button that handles both states */}
                <button
                  onClick={() => {
                    if (!isConnected) {
                      // Open wallet connection modal
                      open();
                    } else {
                      // Execute the request
                      executeTest();
                    }
                  }}
                  disabled={isTesting || !testRequest.url || (isConnected && isTesting)}
                  className={`retro-button w-full disabled:opacity-50 disabled:cursor-not-allowed ${
                    !isConnected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                  }`}
                >
                  {isTesting 
                    ? 'EXECUTING WITH PAYMENT...' 
                    : !isConnected 
                    ? 'CONNECT WALLET' 
                    : 'EXECUTE REQUEST'}
                </button>
              </div>

              {/* Service Info */}
              {primaryPayment && (
                <div className="retro-card">
                  <h3 className="font-mono font-bold mb-2">SERVICE INFORMATION</h3>
                  <div className="text-sm space-y-1">
                    {primaryPayment.maxAmountRequired && (
                      <div><span className="font-bold">Price:</span> {x402Service.formatUSDCAmount(primaryPayment.maxAmountRequired)} USDC</div>
                    )}
                    {primaryPayment.network && (
                      <div><span className="font-bold">Network:</span> {primaryPayment.network}</div>
                    )}
                    {primaryPayment.maxTimeoutSeconds && (
                      <div><span className="font-bold">Timeout:</span> {primaryPayment.maxTimeoutSeconds}s</div>
                    )}
                  </div>
                </div>
              )}
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
                        {testResponse.validation && (
                          <span className={`px-2 py-1 text-xs font-mono font-bold ${
                            testResponse.validation.isValid && testResponse.validation.hasData
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {testResponse.validation.isValid && testResponse.validation.hasData
                              ? '✓ VALID DATA'
                              : testResponse.validation.error
                              ? '⚠ ' + testResponse.validation.error
                              : '⚠ NO DATA'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Validation Warnings */}
                    {testResponse.validation?.warnings && testResponse.validation.warnings.length > 0 && (
                      <div className="bg-yellow-50 border-2 border-yellow-500 p-3">
                        <h5 className="font-mono font-bold text-sm mb-1">VALIDATION WARNINGS</h5>
                        {testResponse.validation.warnings.map((warning, idx) => (
                          <p key={idx} className="text-xs text-yellow-800 font-mono">{warning}</p>
                        ))}
                      </div>
                    )}

                    {/* Response Headers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-mono font-bold text-sm">RESPONSE HEADERS</h4>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(testResponse.headers, null, 2), 'headers')}
                          className="flex items-center gap-1 text-xs font-mono text-blue-600 hover:text-blue-800"
                        >
                          {copiedHeaders ? (
                            <>
                              <Check className="w-3 h-3" />
                              COPIED
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              COPY
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-100 border border-gray-300 p-2 overflow-y-auto" style={{ maxHeight: '200px', minHeight: '60px', height: 'auto' }}>
                        {Object.entries(testResponse.headers).map(([key, value]) => (
                          <div key={key} className="text-xs font-mono">
                            <span className="font-bold">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Response Body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-mono font-bold text-sm">RESPONSE BODY</h4>
                        <div className="flex items-center gap-2">
                          {!testResponse.error && parseResponseForVisualization(testResponse.body) && (
                            <button
                              onClick={() => setVisualizeResponse(!visualizeResponse)}
                              className="flex items-center gap-1 text-xs font-mono text-purple-600 hover:text-purple-800"
                            >
                              {visualizeResponse ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  RAW
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  VISUALIZE
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(testResponse.error || testResponse.body, 'body')}
                            className="flex items-center gap-1 text-xs font-mono text-blue-600 hover:text-blue-800"
                          >
                            {copiedBody ? (
                              <>
                                <Check className="w-3 h-3" />
                                COPIED
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                COPY
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {visualizeResponse && !testResponse.error ? (
                        renderVisualizedResponse(parseResponseForVisualization(testResponse.body))
                      ) : (
                        <pre className="bg-gray-100 border border-gray-300 p-3 text-xs font-mono overflow-y-auto whitespace-pre-wrap" style={{ maxHeight: '500px', minHeight: '100px', height: 'auto' }}>
                          {testResponse.error || testResponse.body}
                        </pre>
                      )}
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
              {primaryPayment && (
                <div className="retro-card">
                  <h3 className="font-mono font-bold mb-2">X402 PAYMENT INFO</h3>
                  <div className="text-sm space-y-1">
                      {primaryPayment?.extra?.name && (
                      <div><span className="font-bold">Asset:</span> {primaryPayment.extra.name}</div>
                    )}
                    {primaryPayment?.scheme && (
                      <div><span className="font-bold">Scheme:</span> {primaryPayment.scheme}</div>
                    )}
                    {primaryPayment?.payTo && primaryPayment.payTo.length >= 10 && (
                      <div><span className="font-bold">Pay To:</span> {primaryPayment.payTo.slice(0, 6)}...{primaryPayment.payTo.slice(-4)}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      

      {/* Cross-Chain Payment Modal */}
      {pendingPaymentRequirement && address && (
        <CrossChainPaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          paymentRequirement={pendingPaymentRequirement.paymentRequirements}
          userAddress={address}
          onProceedWithNative={handleProceedWithNativePayment}
          onProceedWithSwap={handleProceedWithSwap}
        />
      )}

      {/* Squid Swap Modal */}
      {pendingPaymentRequirement && (
        <SquidSwapModal
          isOpen={showSquidSwapModal}
          onClose={() => {
            setShowSquidSwapModal(false);
            setPendingPaymentRequirement(null);
          }}
          targetAmount={pendingPaymentRequirement.paymentRequirements?.maxAmountRequired || '0'}
          targetToken={pendingPaymentRequirement.paymentRequirements?.asset || ''}
          targetChain={pendingPaymentRequirement.paymentRequirements?.network || 'base'}
          onSwapComplete={handleSwapComplete}
        />
      )}
    </div>
  );
}
