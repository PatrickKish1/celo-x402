/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EnhancedEndpoint {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  
  // Endpoint-level pricing (null = use service default)
  pricePerRequest: string | null;
  network: string | null;
  currency: string | null;
  tokenAddress: string | null;
  tokenDecimals: number | null;
  tokenName: string | null;
  tokenVersion: string | null;
  tokenSymbol: string | null;
  
  // Request configuration
  pathParams?: Record<string, { type: string; description?: string }>;
  queryParams?: Record<string, { type: string; required?: boolean; description?: string }>;
  headers?: Record<string, string>;
  requestBody?: any;
  
  // Response configuration
  outputSchema?: any;
  expectedStatusCode?: number;
  
  // Testing state
  isTesting?: boolean;
  testResponse?: any;
  testError?: string;
  testResponseTime?: number;
  testStatus?: number;
  
  // For x402 APIs - comparison
  x402Response?: any;
  responseMatch?: boolean;
  responseDifferences?: string[];
}

