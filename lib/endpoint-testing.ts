/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TestRequest {
  endpoint: string;
  method: string;
  baseUrl: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
  isX402?: boolean;
  x402Config?: {
    amount: string;
    recipient: string;
    token: string;
    network: string;
    userAddress: string;
    userSignature?: string;
  };
}

export interface TestResponse {
  success: boolean;
  statusCode: number;
  responseTime: number;
  data: any;
  error?: string;
  headers: Record<string, string>;
}

/**
 * Test an API endpoint
 */
export async function testEndpoint(request: TestRequest): Promise<TestResponse> {
  const startTime = Date.now();

  try {
    // Build URL with path parameters
    let url = request.endpoint;
    if (request.pathParams) {
      for (const [key, value] of Object.entries(request.pathParams)) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    // Add query parameters
    if (request.queryParams && Object.keys(request.queryParams).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(request.queryParams)) {
        if (value) {
          params.append(key, value);
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Build full URL
    const fullUrl = request.baseUrl.replace(/\/$/, '') + url;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...request.headers,
    };

    // Add x402 payment header if needed
    if (request.isX402 && request.x402Config) {
      const paymentProof = {
        amount: request.x402Config.amount,
        recipient: request.x402Config.recipient,
        token: request.x402Config.token,
        network: request.x402Config.network,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        from: request.x402Config.userAddress,
        signature: request.x402Config.userSignature || '',
      };
      headers['X-Payment'] = Buffer.from(JSON.stringify(paymentProof)).toString('base64');
    }

    // Make request
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    const response = await fetch(fullUrl, fetchOptions);
    const responseTime = Date.now() - startTime;

    // Parse response
    let data: any;
    const contentType = response.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch {
      data = null;
    }

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      data,
      headers: responseHeaders,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      statusCode: 0,
      responseTime,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      headers: {},
    };
  }
}

/**
 * Compare two responses for validation
 */
export function compareResponses(
  testResponse: any,
  x402Response: any,
  outputSchema?: any
): {
  match: boolean;
  differences: string[];
  schemaValid: boolean;
} {
  const differences: string[] = [];
  let match = true;
  let schemaValid = true;

  // Basic structure comparison
  if (typeof testResponse !== typeof x402Response) {
    match = false;
    differences.push(`Type mismatch: test is ${typeof testResponse}, x402 is ${typeof x402Response}`);
  } else if (typeof testResponse === 'object' && testResponse !== null && x402Response !== null) {
    // Compare objects
    const testKeys = Object.keys(testResponse);
    const x402Keys = Object.keys(x402Response);

    // Check for missing keys
    for (const key of testKeys) {
      if (!(key in x402Response)) {
        match = false;
        differences.push(`Missing key in x402 response: ${key}`);
      } else if (JSON.stringify(testResponse[key]) !== JSON.stringify(x402Response[key])) {
        match = false;
        differences.push(`Value mismatch for key "${key}"`);
      }
    }

    // Check for extra keys in x402 response
    for (const key of x402Keys) {
      if (!(key in testResponse)) {
        match = false;
        differences.push(`Extra key in x402 response: ${key}`);
      }
    }
  } else if (testResponse !== x402Response) {
    match = false;
    differences.push('Values do not match');
  }

  // Schema validation (basic)
  if (outputSchema && typeof testResponse === 'object') {
    schemaValid = validateAgainstSchema(testResponse, outputSchema);
    if (!schemaValid) {
      differences.push('Response does not match expected schema');
    }
  }

  return {
    match,
    differences,
    schemaValid,
  };
}

/**
 * Basic schema validation
 */
function validateAgainstSchema(data: any, schema: any): boolean {
  if (!schema || !data) return true;

  if (schema.type === 'object' && typeof data === 'object' && !Array.isArray(data)) {
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (schema.required?.includes(key) && !(key in data)) {
          return false;
        }
        if (key in data) {
          const prop = propSchema as any;
          if (prop.type === 'string' && typeof data[key] !== 'string') return false;
          if (prop.type === 'number' && typeof data[key] !== 'number') return false;
          if (prop.type === 'boolean' && typeof data[key] !== 'boolean') return false;
          if (prop.type === 'array' && !Array.isArray(data[key])) return false;
          if (prop.type === 'object' && typeof data[key] !== 'object') return false;
        }
      }
    }
    return true;
  }

  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items && data.length > 0) {
      return validateAgainstSchema(data[0], schema.items);
    }
    return true;
  }

  return typeof data === schema.type;
}

