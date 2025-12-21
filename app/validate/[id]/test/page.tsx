/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { X402Service, x402Service } from '@/lib/x402-service';
import { x402Wallet } from '@/lib/x402-wallet';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { validateResponseAgainstSchema } from '@/lib/x402-response-validator';
import Link from 'next/link';
import { ArrowLeftIcon, Copy, Check, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { CrossChainPaymentModal } from '@/components/cross-chain-payment-modal';
import { SquidSwapModal } from '@/components/squid-swap-modal';
import Image from 'next/image';
import { x402Payment } from '@/lib/x402-payment';
import { generateServiceId } from '@/lib/x402-service-id';

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

// Helper to check if service is on testnet
function isTestnetService(service: any): boolean {
  if (!service?.accepts || !Array.isArray(service.accepts)) return false;
  
  for (const accept of service.accepts) {
    const network = accept.network?.toLowerCase() || '';
    if (network.includes('sepolia') || network.includes('mumbai') || 
        network.includes('devnet') || network.includes('testnet') ||
        network === 'base-sepolia' || network === 'solana-devnet') {
      return true;
    }
  }
  return false;
}

export default function ValidationTestPage() {
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
  const [isMarkingValidated, setIsMarkingValidated] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();

  useEffect(() => {
    // Initialize wallet service when wallet is connected
    if (isConnected && address) {
      x402Wallet.initializeFromWagmi(isConnected, address).catch((err) => {
        // Silently handle wallet initialization errors (expected when not connected)
        if (err?.message?.includes('Connector not connected')) {
          // This is expected, ignore it
          return;
        }
        console.error('Wallet initialization error:', err);
      });
    } else {
      // Clear wallet state when disconnected
      x402Wallet.disconnectWallet();
    }
  }, [isConnected, address]);

  useEffect(() => {
    async function loadServiceFromCache() {
      try {
        setLoading(true);
        
        console.log('[Validation Test] Loading service with ID:', serviceId);
        
        // First, try to load from sessionStorage (stored when clicking Validate button)
        let foundService: any = null;
        try {
          const sessionService = sessionStorage.getItem('x402_validation_service');
          if (sessionService) {
            const parsed = JSON.parse(sessionService);
            const sessionServiceId = generateServiceId(parsed.resource || '');
            if (sessionServiceId === serviceId) {
              foundService = parsed;
              console.log('[Validation Test] Found service in sessionStorage');
            }
          }
        } catch (e) {
          console.error('[Validation Test] Error reading sessionStorage:', e);
        }
        
        // If not in sessionStorage, try localStorage (from validate page)
        let cacheKeys: string[] = [];
        if (!foundService) {
          cacheKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('x402_services_cache_')
          );
          
          console.log('[Validation Test] Found cache keys:', cacheKeys.length);
          
          for (const key of cacheKeys) {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(cached)) {
              console.log(`[Validation Test] Checking ${cached.length} services in ${key}`);
              
              // Try exact match first
              foundService = cached.find((s: any) => {
                const sId = generateServiceId(s.resource || '');
                return sId === serviceId;
              });
              
              // If not found, try without encoding/decoding issues
              if (!foundService) {
                foundService = cached.find((s: any) => {
                  const sId = generateServiceId(s.resource || '');
                  // Try comparing decoded versions
                  return decodeURIComponent(sId) === decodeURIComponent(serviceId) ||
                         sId === decodeURIComponent(serviceId) ||
                         decodeURIComponent(sId) === serviceId;
                });
              }
              
              // If still not found, try matching by resource URL directly
              if (!foundService) {
                foundService = cached.find((s: any) => {
                  // Check if the serviceId matches any part of the resource
                  const resource = s.resource || '';
                  const sId = generateServiceId(resource);
                  console.log(`[Validation Test] Comparing: "${sId}" === "${serviceId}"`);
                  return sId === serviceId;
                });
              }
              
              if (foundService) {
                console.log('[Validation Test] Found service:', foundService);
                break;
              }
            }
          } catch (e) {
            console.error('Error parsing cache:', e);
          }
          }
        }
        
        // If still not found, try fetching all services from discovery and find by ID
        if (!foundService) {
          console.log('[Validation Test] Service not in cache, trying to fetch from discovery...');
          try {
            const { x402Service } = await import('@/lib/x402-service');
            const allServices = await x402Service.fetchLiveServices();
            if (allServices && Array.isArray(allServices)) {
              foundService = allServices.find((s: any) => {
                const sId = generateServiceId(s.resource || '');
                return sId === serviceId || 
                       decodeURIComponent(sId) === decodeURIComponent(serviceId) ||
                       sId === decodeURIComponent(serviceId) ||
                       decodeURIComponent(sId) === serviceId;
              });
              if (foundService) {
                console.log('[Validation Test] Found service from discovery API');
              }
            }
          } catch (e) {
            console.error('[Validation Test] Error fetching from discovery:', e);
          }
        }

        if (foundService) {
          setService(foundService);
          
          // Pre-populate the test request with service details
          const primaryPayment = foundService?.accepts?.[0];
          if (primaryPayment) {
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
            
            // Smart method detection
            let detectedMethod = schema?.method || 'GET';
            if (!schema?.method) {
              const resourceUrl = (primaryPayment?.resource || '').toLowerCase();
              const description = (primaryPayment?.description || foundService?.metadata?.description || '').toLowerCase();
              
              if (resourceUrl.includes('/create') || resourceUrl.includes('/submit') || 
                  resourceUrl.includes('/add') || description.includes('create') || description.includes('submit')) {
                detectedMethod = 'POST';
              } else if (resourceUrl.includes('/update') || resourceUrl.includes('/edit') || 
                         description.includes('update') || description.includes('modify')) {
                detectedMethod = 'PUT';
              } else if (resourceUrl.includes('/delete') || resourceUrl.includes('/remove') || 
                         description.includes('delete') || description.includes('remove')) {
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
            if (schemaInput?.headerFields && Object.keys(schemaInput.headerFields).length > 0) {
              setShowHeaders(true);
            }
          }
        } else {
          console.error('[Validation Test] Service not found in cache. ServiceId:', serviceId);
          console.error('[Validation Test] Available cache keys:', cacheKeys);
          // Log all services in cache for debugging
          for (const key of cacheKeys) {
            try {
              const cached = JSON.parse(localStorage.getItem(key) || '[]');
              if (Array.isArray(cached) && cached.length > 0) {
                console.log(`[Validation Test] Services in ${key}:`, cached.map((s: any) => ({
                  resource: s.resource,
                  generatedId: generateServiceId(s.resource || '')
                })));
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (err) {
        console.error('Error loading service:', err);
      } finally {
        setLoading(false);
      }
    }

    if (serviceId) {
      loadServiceFromCache();
    }
  }, [serviceId]);

  // ... (keeping all the existing helper functions: addHeader, updateHeader, removeHeader, addParam, updateParam, removeParam, copyToClipboard, parseResponseForVisualization, isImageUrl, isLikelyUrlKey, renderVisualizedResponse)
  // These are identical to the discover test page, so I'll include them all

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
    setValidationError(null);

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
      
      // Check if response is a 402 payment response (x402 payment info)
      const is402Response = proxyData.status === 402 || 
                           (proxyData.body && typeof proxyData.body === 'string' && 
                            (proxyData.body.includes('"x402Version"') || 
                             proxyData.body.includes('"accepts"') ||
                             proxyData.body.includes('"payTo"')));
      
      // If not 402, return the proxied response
      if (!is402Response && proxyData.status !== 402) {
        const nonPaymentResponseTime = Date.now() - startTime;
        
        // Get Content-Type from headers and mimeType from service
        const contentType = (proxyData.headers || {})['content-type'] || 
                           (proxyData.headers || {})['Content-Type'] || '';
        const mimeType = service?.accepts?.[0]?.mimeType;
        const isBinary = isBinaryContent(proxyData.body || '', contentType, mimeType);
        const isImage = contentType.startsWith('image/') || (mimeType && mimeType.startsWith('image/'));
        const isJson = contentType.includes('application/json') && !isBinary;
        
        let responseBody = proxyData.body || '';
        let responseData: any = null;
        
        // Handle binary/media responses (images, videos, audio, octet-stream)
        if (isBinary || isImage) {
          responseBody = convertBinaryToDataUri(responseBody, contentType || mimeType || 'image/png');
        } else if (isJson) {
          // Try to parse as JSON
          try {
            responseData = JSON.parse(responseBody);
            responseBody = JSON.stringify(responseData, null, 2);
          } catch {
            // Not valid JSON, keep as is
          }
        }

        // Validate response
        let validationResult = null;
        if (proxyData.status === 200) {
          const outputSchema = service?.accepts?.[0]?.outputSchema;
          
          if (isImage) {
            // For images, check that we have image data
            validationResult = {
              isValid: responseBody.length > 100 || responseBody.startsWith('data:') || responseBody.startsWith('http'),
              hasData: responseBody.length > 100 || responseBody.startsWith('data:') || responseBody.startsWith('http'),
              dataType: 'binary',
              error: responseBody.length <= 100 && !responseBody.startsWith('data:') && !responseBody.startsWith('http') 
                ? 'Image data appears to be invalid or too small' 
                : undefined,
            };
          } else if (responseData && outputSchema) {
            // Validate JSON response against schema (check keys, not values)
            validationResult = validateResponseAgainstSchema(responseData, outputSchema);
          } else if (responseData) {
            const hasData = typeof responseData === 'object' 
              ? Object.keys(responseData).length > 0
              : responseBody.length > 10;
            validationResult = {
              isValid: hasData,
              hasData,
              dataType: 'json',
              error: hasData ? undefined : 'Response appears to be empty or invalid',
            };
          } else if (responseBody) {
            validationResult = {
              isValid: responseBody.length > 10,
              hasData: responseBody.length > 10,
              dataType: 'text',
              error: responseBody.length <= 10 ? 'Response too small' : undefined,
            };
          }
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
      return;
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
      
      // Get Content-Type from headers and mimeType from service
      const contentType = (paidProxyData.headers || {})['content-type'] || 
                         (paidProxyData.headers || {})['Content-Type'] || '';
      const mimeType = service?.accepts?.[0]?.mimeType;
      const isBinary = isBinaryContent(paidProxyData.body || '', contentType, mimeType);
      const isImage = contentType.startsWith('image/') || (mimeType && mimeType.startsWith('image/'));
      const isJson = contentType.includes('application/json') && !isBinary;
      
      // Get response body
      let responseBody = paidProxyData.body || '';
      let responseData: any = null;
      
      // Handle binary/media responses (images, videos, audio, octet-stream)
      if (isBinary || isImage) {
        responseBody = convertBinaryToDataUri(responseBody, contentType || mimeType || 'image/png');
      } else if (isJson) {
        // Try to parse as JSON
        try {
          responseData = JSON.parse(responseBody);
          responseBody = JSON.stringify(responseData, null, 2);
        } catch {
          // Not valid JSON, keep as is
        }
      }

      // Validate response
      let validationResult = null;
      if (paidProxyData.status === 200) {
        const outputSchema = service?.accepts?.[0]?.outputSchema;
        
        if (isImage) {
          // For images, check that we have image data
          validationResult = {
            isValid: responseBody.length > 100 || responseBody.startsWith('data:') || responseBody.startsWith('http'),
            hasData: responseBody.length > 100 || responseBody.startsWith('data:') || responseBody.startsWith('http'),
            dataType: 'binary',
            error: responseBody.length <= 100 && !responseBody.startsWith('data:') && !responseBody.startsWith('http') 
              ? 'Image data appears to be invalid or too small' 
              : undefined,
          };
        } else if (responseData && outputSchema) {
          // Validate JSON response against schema (check keys, not values)
          validationResult = validateResponseAgainstSchema(responseData, outputSchema);
        } else if (responseData) {
          const hasData = typeof responseData === 'object' 
            ? Object.keys(responseData).length > 0
            : responseBody.length > 10;
          validationResult = {
            isValid: hasData,
            hasData,
            dataType: 'json',
            error: hasData ? undefined : 'Response appears to be empty or invalid',
          };
        } else if (responseBody) {
          validationResult = {
            isValid: responseBody.length > 10,
            hasData: responseBody.length > 10,
            dataType: 'text',
            error: responseBody.length <= 10 ? 'Response too small' : undefined,
          };
        }
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
      setShowPaymentModal(false);
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
      setShowSquidSwapModal(false);
      
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
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsTesting(true);
      const startTime = Date.now();
      
      const { paymentRequirements, url, requestOptions } = pendingPaymentRequirement;
      
      const payment = await x402Payment.executePayment({
        amount: paymentRequirements.maxAmountRequired,
        token: paymentRequirements.asset,
        recipient: paymentRequirements.payTo,
        network: paymentRequirements.network,
        userAddress: address,
      });
      
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
      
      // Get Content-Type from headers and mimeType from service
      const contentType = paidResponse.headers.get('content-type') || '';
      const mimeType = service?.accepts?.[0]?.mimeType;
      
      // For binary data, we need to get it as blob first, then convert
      let responseBody: string;
      let isBinary = false;
      let isImage = false;
      let isJson = false;
      
      if (contentType.startsWith('image/') || 
          contentType.startsWith('video/') || 
          contentType.startsWith('audio/') ||
          contentType === 'application/octet-stream' ||
          (mimeType && (mimeType.startsWith('image/') || mimeType === 'application/octet-stream'))) {
        // Get as blob and convert to base64
        const blob = await paidResponse.blob();
        isBinary = true;
        isImage = Boolean(contentType.startsWith('image/') || (mimeType && mimeType.startsWith('image/')));
        
        // Convert blob to base64 data URI
        const reader = new FileReader();
        responseBody = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Get as text for JSON/text responses
        responseBody = await paidResponse.text();
        isJson = contentType.includes('application/json');
      }
      
      let responseData: any = null;
      
      if (isJson) {
        // Try to parse as JSON
        try {
          responseData = JSON.parse(responseBody);
          responseBody = JSON.stringify(responseData, null, 2);
        } catch {
          // Not valid JSON, keep as is
        }
      }
      
      // Validate response
      let validationResult: ResponseValidation | null = null;
      if (paidResponse.ok) {
        const outputSchema = service?.accepts?.[0]?.outputSchema;
        
        if (isImage) {
          // For images, check that we have image data
          validationResult = {
            isValid: responseBody.length > 100 || responseBody.startsWith('data:') || responseBody.startsWith('http'),
            hasData: responseBody.length > 100 || responseBody.startsWith('data:') || responseBody.startsWith('http'),
            dataType: 'binary',
            error: responseBody.length <= 100 && !responseBody.startsWith('data:') && !responseBody.startsWith('http') 
              ? 'Image data appears to be invalid or too small' 
              : undefined,
          };
        } else if (responseData && outputSchema) {
          // Validate JSON response against schema (check keys, not values)
          validationResult = validateResponseAgainstSchema(responseData, outputSchema);
        } else if (responseData) {
          const hasData = responseData && Object.keys(responseData).length > 0;
          validationResult = {
            isValid: hasData,
            hasData,
            dataType: 'json',
            error: hasData ? undefined : 'Response appears to be empty or invalid',
          };
        } else {
          validationResult = {
            isValid: responseBody.length > 10,
            hasData: responseBody.length > 10,
            dataType: 'text',
            error: responseBody.length <= 10 ? 'Response too small' : undefined,
          };
        }
      }
      
      setTestResponse({
        status: paidResponse.status,
        statusText: paidResponse.statusText || 'OK',
        headers: Object.fromEntries(paidResponse.headers.entries()),
        body: responseBody,
        time: responseTime,
        validation: validationResult || undefined,
      });
      
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

  // Mark service as valid or invalid
  const handleMarkValidation = async (vote: 'valid' | 'invalid') => {
    if (!service || !address || !testResponse) return;

    // For invalid votes, we need a reason
    if (vote === 'invalid' && !testResponse.validation?.error && testResponse.status === 200) {
      setValidationError('Please provide a reason for marking as invalid');
      return;
    }

    setIsMarkingValidated(true);
    setValidationError(null);

    try {
      const isTestnet = isTestnetService(service);
      const validationMode = isTestnet ? 'free' : 'user-paid';

      // Determine testnet chain
      let testnetChain: string | undefined;
      if (isTestnet && service?.accepts) {
        for (const accept of service.accepts) {
          const network = accept.network?.toLowerCase() || '';
          if (network.includes('sepolia') || network.includes('testnet') || network.includes('devnet')) {
            testnetChain = network;
            break;
          }
        }
      }

      // Get reason for invalid vote
      const reason = vote === 'invalid' 
        ? (testResponse.validation?.error || 
           (testResponse.status !== 200 ? `Response status: ${testResponse.status}` : 'Validation failed') ||
           'Service does not match expected output schema')
        : null;

        const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${BACKEND_API_URL}/api/validate/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: generateServiceId(service.resource || ''),
          service,
          userAddress: address,
          vote,
          reason,
          validationMode,
          testResponse,
          testnetChain,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to mark service as ${vote}`);
      }

      const result = await response.json();
      setIsValidated(true);
      setValidationError(null);
      
      // Show success message
      console.log(`Service marked as ${vote}:`, result);
    } catch (error) {
      console.error(`Error marking service as ${vote}:`, error);
      setValidationError(error instanceof Error ? error.message : `Failed to mark service as ${vote}`);
    } finally {
      setIsMarkingValidated(false);
    }
  };

  // Helper to detect if content is binary/media
  const isBinaryContent = (body: string, contentType: string, mimeType?: string): boolean => {
    // Check Content-Type header
    if (contentType.startsWith('image/') || 
        contentType.startsWith('video/') || 
        contentType.startsWith('audio/') ||
        contentType === 'application/octet-stream') {
      return true;
    }
    
    // Check mimeType from accepts array
    if (mimeType && (
        mimeType.startsWith('image/') ||
        mimeType.startsWith('video/') ||
        mimeType.startsWith('audio/') ||
        mimeType === 'application/octet-stream'
    )) {
      return true;
    }
    
    // Check if body contains binary data (non-printable characters or very large)
    if (body.length > 1000) {
      // Check for PNG signature
      if (body.includes('PNG') && body.includes('IHDR')) {
        return true;
      }
      // Check for JPEG signature
      if (body.includes('/9j/') || body.includes('JFIF')) {
        return true;
      }
      // Check for GIF signature
      if (body.includes('GIF89a') || body.includes('GIF87a')) {
        return true;
      }
    }
    
    return false;
  };

  // Helper to convert binary string to base64 data URI
  const convertBinaryToDataUri = (body: string, contentType: string): string => {
    // If already a data URI or URL, return as is
    if (body.startsWith('data:') || body.startsWith('http://') || body.startsWith('https://')) {
      return body;
    }
    
    // Try to detect image format from content
    let detectedType = contentType;
    if (!detectedType || detectedType === 'application/octet-stream') {
      // Check for PNG signature (starts with PNG magic bytes)
      if (body.includes('PNG') && (body.indexOf('PNG') < 100 || body.includes('IHDR'))) {
        detectedType = 'image/png';
      } 
      // Check for JPEG signature
      else if (body.includes('/9j/') || body.includes('JFIF') || body.includes('ÿØÿ')) {
        detectedType = 'image/jpeg';
      } 
      // Check for GIF signature
      else if (body.includes('GIF89a') || body.includes('GIF87a')) {
        detectedType = 'image/gif';
      } 
      // Check for WEBP signature
      else if (body.includes('WEBP') || body.includes('RIFF')) {
        detectedType = 'image/webp';
      }
      // Default to image/png if we detected it's likely an image
      else if (body.length > 1000) {
        detectedType = 'image/png'; // Default assumption for large binary
      }
    }
    
    // Check if body is already base64 encoded (common pattern)
    // Base64 strings only contain A-Z, a-z, 0-9, +, /, = and whitespace
    const cleanBody = body.replace(/[\s\n\r\t]/g, '');
    const base64Pattern = /^[A-Za-z0-9+/=]+$/;
    
    if (base64Pattern.test(cleanBody) && cleanBody.length > 100) {
      // It's likely base64, just add the data URI prefix
      return `data:${detectedType || 'image/png'};base64,${cleanBody}`;
    }
    
    // If body contains binary characters (non-printable), it's raw binary
    // Check for common binary indicators
    const hasBinaryChars = /[\x00-\x08\x0E-\x1F]/.test(body);
    const hasImageSignatures = body.includes('PNG') || body.includes('JFIF') || body.includes('GIF') || body.includes('RIFF');
    
    if (hasBinaryChars || (hasImageSignatures && body.length > 1000)) {
      // This is raw binary data that came through as a string
      // We need to convert it properly
      try {
        // Method 1: If it's a string representation of binary, try to convert each char
        // This is a fallback - ideally the proxy should send base64
        let binaryString = '';
        for (let i = 0; i < body.length; i++) {
          const charCode = body.charCodeAt(i);
          if (charCode > 255) {
            // Invalid for binary, might be corrupted
            console.warn('Binary data may be corrupted during text conversion');
            break;
          }
          binaryString += String.fromCharCode(charCode);
        }
        
        // Convert to base64
        const base64 = btoa(binaryString);
        return `data:${detectedType || 'image/png'};base64,${base64}`;
      } catch (error) {
        console.error('Error converting binary to data URI:', error);
        // Last resort: return as-is and let the browser try
        return body;
      }
    }
    
    // If we get here, it might be text that looks like binary
    // Try one more time with base64 assumption
    if (body.length > 100) {
      try {
        const base64 = btoa(unescape(encodeURIComponent(body)));
        return `data:${detectedType || 'application/octet-stream'};base64,${base64}`;
      } catch {
        return body;
      }
    }
    
    return body;
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

  // Render visualized response (same as discover test page)
  const renderVisualizedResponse = (data: any) => {
    if (!data) return null;

    let actualData = data;
    if (data.result && typeof data.result === 'object') {
      actualData = data.result;
    }
    if (actualData.payload && typeof actualData.payload === 'object') {
      actualData = actualData.payload;
    }

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
                  if (value === null || value === undefined || value === '') return null;

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
            <h2 className="text-xl font-bold font-mono mb-2">LOADING VALIDATION TEST</h2>
            <p className="text-gray-600 font-mono">Preparing validation interface...</p>
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
            <Link href="/validate" className="retro-button">
              BACK TO VALIDATION
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const primaryPayment = service?.accepts?.[0];
  const isTestnet = isTestnetService(service);
  const outputSchema = primaryPayment?.outputSchema;
  
  // Check if response is a 402 payment response (x402 payment info)
  const is402Response = testResponse?.status === 402 || 
                       (testResponse?.body && typeof testResponse.body === 'string' && 
                        (testResponse.body.includes('"x402Version"') || 
                         testResponse.body.includes('"accepts"') ||
                         testResponse.body.includes('"payTo"')));
  
  // Check validation details
  const hasError = testResponse?.validation?.error; // Missing required keys or complete mismatch
  const hasOnlyWarnings = testResponse?.validation?.warnings && 
                          testResponse.validation.warnings.length > 0 && 
                          !hasError &&
                          testResponse.validation.isValid; // Only extra keys (warnings like "paid")
  const schemaMatches = outputSchema && testResponse?.validation?.isValid !== false;
  const hasData = testResponse?.validation?.hasData;
  const isValidResponse = testResponse?.status === 200 && hasData;
  
  // Determine button visibility based on validation results:
  // 1. Only extra keys (warnings) → Only "Mark as Valid" button
  // 2. Missing required keys (error) → Both buttons
  // 3. Complete mismatch/invalid → Only "Mark as Invalid" button
  // 4. Perfect match → Only "Mark as Valid" button
  // 5. 402 response → No buttons (allow retry)
  
  const canMarkAsValid = !is402Response &&
                         testResponse && 
                         isValidResponse && 
                         (hasOnlyWarnings || // Extra keys are fine - only show valid button
                          (schemaMatches || !outputSchema)) && // Schema matches or no schema
                         !isValidated;
  
  const canMarkAsInvalid = !is402Response &&
                           testResponse && 
                           ((isValidResponse && hasError) || // Has data but missing required keys - show both
                            (isValidResponse && !hasData) || // No data
                            (testResponse.status !== 200 && testResponse.status !== 402)) && // Wrong status (not 402)
                           !isValidated;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/validate" className="text-blue-600 hover:underline font-mono text-nowrap">
              <ArrowLeftIcon className="w-4 h-4 inline mr-1" /> BACK TO VALIDATION
            </Link>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
              VALIDATION TEST
            </h1>
            <p className="text-xl font-mono text-gray-700 mb-4">
              Test and validate the {service?.metadata?.name || service?.resource?.split('/').pop() || 'API'} API
            </p>
            <div className="flex items-center gap-2">
              {isTestnet ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-mono border border-green-300">
                  TESTNET
                </span>
              ) : (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-mono border border-blue-300">
                  MAINNET
                </span>
              )}
              {isValidated && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-mono border border-green-300 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  VALIDATED
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Request Panel - Same as discover test page */}
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
                      placeholder={`Enter JSON request body for ${testRequest.method} request...`}
                      rows={8}
                      className="retro-input w-full text-xs font-mono"
                    />
                  </div>
                )}

                {/* Execute/Connect Button */}
                <button
                  onClick={() => {
                    if (!isConnected) {
                      open();
                    } else {
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
                  </div>
                </div>
              )}

              {/* Output Schema Display */}
              {primaryPayment?.outputSchema && (
                <div className="retro-card">
                  <h3 className="font-mono font-bold mb-2">EXPECTED OUTPUT SCHEMA</h3>
                  <p className="text-xs text-gray-600 mb-2 font-mono">
                    Compare the response below with the expected output structure. The validation checks that response keys match the schema.
                  </p>
                  <div className="bg-gray-100 border border-gray-300 p-3 overflow-y-auto" style={{ maxHeight: '300px' }}>
                    {(() => {
                      const schema = primaryPayment.outputSchema;
                      const outputSection = schema.output || schema;
                      const hasInput = schema.input && schema.output;
                      
                      return (
                        <div>
                          {hasInput && (
                            <div className="mb-3">
                              <p className="text-xs font-mono font-bold text-gray-700 mb-1">
                                Full Schema (Input + Output):
                              </p>
                              <pre className="text-xs font-mono whitespace-pre-wrap opacity-75">
                                {JSON.stringify(schema, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div className={hasInput ? 'border-t-2 border-gray-400 pt-3' : ''}>
                            <p className="text-xs font-mono font-bold text-blue-700 mb-1">
                              {hasInput ? 'Output Section (Validated Against):' : 'Output Schema:'}
                            </p>
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {JSON.stringify(outputSection, null, 2)}
                            </pre>
                            {outputSection.properties && (
                              <div className="mt-2 text-xs font-mono text-gray-600">
                                <p className="font-bold">Expected Keys:</p>
                                <ul className="list-disc list-inside ml-2">
                                  {Object.keys(outputSection.properties).map(key => (
                                    <li key={key}>
                                      <span className={outputSection.required?.includes(key) ? 'text-red-600 font-bold' : ''}>
                                        {key}
                                        {outputSection.required?.includes(key) && ' (required)'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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

                    {/* 402 Response Notice */}
                    {is402Response && (
                      <div className="bg-blue-50 border-2 border-blue-500 p-4 rounded">
                        <h4 className="font-mono font-bold text-sm text-blue-800 mb-2">
                          402 PAYMENT RESPONSE DETECTED
                        </h4>
                        <p className="text-xs text-blue-700 mb-3 font-mono">
                          The API returned a 402 payment response. This might be a one-off issue. Please try executing the request again.
                        </p>
                      </div>
                    )}

                    {/* Validation Action Buttons */}
                    {!is402Response && (canMarkAsValid || canMarkAsInvalid) && (
                      <div className={`border-2 p-4 rounded ${
                        canMarkAsValid && !canMarkAsInvalid 
                          ? 'bg-green-50 border-green-500' 
                          : canMarkAsInvalid && !canMarkAsValid
                          ? 'bg-red-50 border-red-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-mono font-bold text-sm ${
                            canMarkAsValid && !canMarkAsInvalid 
                              ? 'text-green-800' 
                              : canMarkAsInvalid && !canMarkAsValid
                              ? 'text-red-800'
                              : 'text-yellow-800'
                          }`}>
                            {canMarkAsValid && !canMarkAsInvalid 
                              ? 'VALIDATION READY' 
                              : canMarkAsInvalid && !canMarkAsValid
                              ? 'VALIDATION FAILED'
                              : 'VALIDATION ISSUES DETECTED'}
                          </h4>
                        </div>
                        {canMarkAsValid && !canMarkAsInvalid ? (
                          <div className="text-xs mb-3 font-mono">
                            {hasOnlyWarnings ? (
                              <p className="text-green-700">
                                Response contains extra keys not in schema (this is acceptable). The service is working correctly.
                              </p>
                            ) : (
                              <p className="text-green-700">
                                The API response is valid and matches the expected schema. Mark this service as validated.
                              </p>
                            )}
                          </div>
                        ) : canMarkAsInvalid && !canMarkAsValid ? (
                          <div className="text-xs mb-3 font-mono">
                            {testResponse.validation?.error && (
                              <p className="text-red-700 mb-1">
                                <span className="font-bold">Error:</span> {testResponse.validation.error}
                              </p>
                            )}
                            <p className="text-red-700">
                              The response does not match the expected schema or has critical issues. Mark as invalid to report this problem.
                            </p>
                          </div>
                        ) : (
                          <div className="text-xs mb-3 font-mono">
                            {testResponse.validation?.error && (
                              <p className="text-red-700 mb-1">
                                <span className="font-bold">Error:</span> {testResponse.validation.error}
                              </p>
                            )}
                            {testResponse.validation?.warnings && testResponse.validation.warnings.length > 0 && (
                              <div className="text-yellow-700 mb-1">
                                <span className="font-bold">Warnings:</span>
                                <ul className="list-disc list-inside ml-2">
                                  {testResponse.validation.warnings.map((warning: string, idx: number) => (
                                    <li key={idx}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p className="text-yellow-700 mt-2">
                              Response has some issues but contains data. You can mark as valid if acceptable, or invalid to report problems.
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {canMarkAsValid && (
                            <button
                              onClick={() => handleMarkValidation('valid')}
                              disabled={isMarkingValidated}
                              className="retro-button bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                            >
                              {isMarkingValidated ? 'PROCESSING...' : 'MARK AS VALID'}
                            </button>
                          )}
                          {canMarkAsInvalid && (
                            <button
                              onClick={() => handleMarkValidation('invalid')}
                              disabled={isMarkingValidated}
                              className="retro-button bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                            >
                              {isMarkingValidated ? 'PROCESSING...' : 'MARK AS INVALID'}
                            </button>
                          )}
                        </div>
                        {validationError && (
                          <p className="text-xs text-red-600 mt-2 font-mono">{validationError}</p>
                        )}
                      </div>
                    )}

                    {isValidated && (
                      <div className="bg-green-50 border-2 border-green-500 p-4 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <p className="font-mono font-bold text-sm text-green-800">
                            SERVICE MARKED AS VALIDATED
                          </p>
                        </div>
                        <p className="text-xs text-green-700 mt-2 font-mono">
                          This service has been successfully validated and added to the registry.
                        </p>
                      </div>
                    )}

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
                      
                      {/* Check if response is media (image, video, audio) */}
                      {(() => {
                        const contentType = testResponse.headers['content-type'] || testResponse.headers['Content-Type'] || '';
                        const mimeType = primaryPayment?.mimeType;
                        const isImage = contentType.startsWith('image/') || 
                                      (mimeType && mimeType.startsWith('image/')) ||
                                      testResponse.body.startsWith('data:image/') ||
                                      (testResponse.body.startsWith('http://') && /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(testResponse.body)) ||
                                      (testResponse.body.startsWith('https://') && /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(testResponse.body));
                        const isVideo = contentType.startsWith('video/') || (mimeType && mimeType.startsWith('video/'));
                        const isAudio = contentType.startsWith('audio/') || (mimeType && mimeType.startsWith('audio/'));
                        const isMedia = isImage || isVideo || isAudio || 
                                       contentType === 'application/octet-stream' ||
                                       mimeType === 'application/octet-stream';
                        
                        if (isMedia && !testResponse.error) {
                          const mediaType = isImage ? 'Image' : isVideo ? 'Video' : isAudio ? 'Audio' : 'Media';
                          const detectedType = contentType || mimeType || 'application/octet-stream';
                          
                          return (
                            <div className="bg-gray-100 border border-gray-300 p-3">
                              <div className="mb-2">
                                <span className="text-xs font-mono text-gray-600">
                                  {mediaType} detected ({detectedType})
                                </span>
                              </div>
                              <div className="flex justify-center items-center bg-white p-4 rounded border-2 border-dashed border-gray-300">
                                {isImage ? (
                                  <Image
                                    src={testResponse.body} 
                                    alt="API Response Image" 
                                    width={100}
                                    height={100}
                                    className="max-w-full max-h-96 object-contain"
                                    onError={(e: any) => {
                                      // If image fails to load, try to convert again or show error
                                      const target = e.target as HTMLImageElement;
                                      const parent = target.parentElement;
                                      if (parent) {
                                        // Try to fix the data URI
                                        let fixedBody = testResponse.body;
                                        if (!fixedBody.startsWith('data:')) {
                                          fixedBody = convertBinaryToDataUri(testResponse.body, detectedType);
                                        }
                                        if (fixedBody !== testResponse.body) {
                                          target.src = fixedBody;
                                        } else {
                                          target.style.display = 'none';
                                          parent.innerHTML = `
                                            <div class="text-center p-4">
                                              <p class="text-xs font-mono text-red-600 mb-2">Failed to render image</p>
                                              <p class="text-xs font-mono text-gray-500">Content-Type: ${detectedType}</p>
                                              <p class="text-xs font-mono text-gray-500 mt-2">Body length: ${testResponse.body.length} characters</p>
                                            </div>
                                          `;
                                        }
                                      }
                                    }}
                                  />
                                ) : isVideo ? (
                                  <video 
                                    src={testResponse.body} 
                                    controls
                                    className="max-w-full max-h-96"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                ) : isAudio ? (
                                  <audio 
                                    src={testResponse.body} 
                                    controls
                                    className="w-full"
                                  >
                                    Your browser does not support the audio tag.
                                  </audio>
                                ) : (
                                  <div className="text-center p-4">
                                    <p className="text-xs font-mono text-gray-600 mb-2">
                                      Binary media content ({detectedType})
                                    </p>
                                    <p className="text-xs font-mono text-gray-500">
                                      Size: {testResponse.body.length} characters
                                    </p>
                                    <p className="text-xs font-mono text-gray-500 mt-2">
                                      Use download or copy to access the file
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        
                        // Not an image, render normally
                        if (visualizeResponse && !testResponse.error) {
                          return renderVisualizedResponse(parseResponseForVisualization(testResponse.body));
                        }
                        
                        return (
                          <pre className="bg-gray-100 border border-gray-300 p-3 text-xs font-mono overflow-y-auto whitespace-pre-wrap" style={{ maxHeight: '500px', minHeight: '100px', height: 'auto' }}>
                            {testResponse.error || testResponse.body}
                          </pre>
                        );
                      })()}
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

