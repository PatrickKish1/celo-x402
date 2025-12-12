// x402 API Proxy Service
// Handles proxying requests to upstream x402-protected APIs

export interface ProxyConfig {
  upstreamUrl: string;
  targetPath: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  paymentHeader?: string;
}

export interface ProxyResponse {
  success: boolean;
  status: number;
  data?: any;
  headers?: Record<string, string>;
  error?: string;
}

export class X402ProxyService {
  private static instance: X402ProxyService;

  static getInstance(): X402ProxyService {
    if (!X402ProxyService.instance) {
      X402ProxyService.instance = new X402ProxyService();
    }
    return X402ProxyService.instance;
  }

  /**
   * Proxy a request to an upstream x402 API
   */
  async proxyRequest(config: ProxyConfig): Promise<ProxyResponse> {
    try {
      const url = `${config.upstreamUrl}${config.targetPath}`;
      
      console.log(`Proxying ${config.method} request to:`, url);

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      // Add payment header if provided
      if (config.paymentHeader) {
        headers['X-PAYMENT'] = config.paymentHeader;
      }

      // Make request to upstream API
      const response = await fetch(url, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        success: response.ok,
        status: response.status,
        data,
        headers: responseHeaders,
      };
    } catch (error) {
      console.error('Proxy request error:', error);
      return {
        success: false,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown proxy error',
      };
    }
  }

  /**
   * Proxy a GET request
   */
  async proxyGet(
    upstreamUrl: string,
    targetPath: string,
    paymentHeader?: string
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      upstreamUrl,
      targetPath,
      method: 'GET',
      paymentHeader,
    });
  }

  /**
   * Proxy a POST request
   */
  async proxyPost(
    upstreamUrl: string,
    targetPath: string,
    body: any,
    paymentHeader?: string
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      upstreamUrl,
      targetPath,
      method: 'POST',
      body,
      paymentHeader,
    });
  }

  /**
   * Test if an upstream API supports x402
   */
  async testX402Support(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      // x402 APIs should return 402 status
      if (response.status === 402) {
        const data = await response.json();
        return !!(data.accepts && Array.isArray(data.accepts) && data.accepts.length > 0);
      }

      return false;
    } catch (error) {
      console.error('x402 support test error:', error);
      return false;
    }
  }

  /**
   * Get payment requirements from upstream API
   */
  async getPaymentRequirements(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.status !== 402) {
        throw new Error('Endpoint does not require payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment requirements:', error);
      throw error;
    }
  }

  /**
   * Make a paid request to upstream API
   */
  async makePaidRequest(
    url: string,
    method: string,
    paymentHeader: string,
    body?: any
  ): Promise<ProxyResponse> {
    return this.proxyRequest({
      upstreamUrl: url,
      targetPath: '',
      method,
      paymentHeader,
      body,
    });
  }

  /**
   * Stream data from upstream API
   * Useful for long-running requests or large responses
   */
  async streamRequest(
    config: ProxyConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const url = `${config.upstreamUrl}${config.targetPath}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (config.paymentHeader) {
        headers['X-PAYMENT'] = config.paymentHeader;
      }

      const response = await fetch(url, {
        method: config.method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } catch (error) {
      console.error('Stream request error:', error);
      throw error;
    }
  }

  /**
   * Batch proxy multiple requests
   */
  async batchProxy(configs: ProxyConfig[]): Promise<ProxyResponse[]> {
    const promises = configs.map(config => this.proxyRequest(config));
    return Promise.all(promises);
  }

  /**
   * Proxy with retry logic
   */
  async proxyWithRetry(
    config: ProxyConfig,
    maxRetries: number = 3
  ): Promise<ProxyResponse> {
    let lastError: string | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.proxyRequest(config);
        if (response.success) {
          return response;
        }
        lastError = response.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    return {
      success: false,
      status: 500,
      error: `Failed after ${maxRetries} retries: ${lastError}`,
    };
  }

  /**
   * Transform upstream response
   * Useful for adapting different API formats
   */
  async proxyWithTransform<T>(
    config: ProxyConfig,
    transformer: (data: any) => T
  ): Promise<T> {
    const response = await this.proxyRequest(config);
    
    if (!response.success) {
      throw new Error(response.error || 'Proxy request failed');
    }

    return transformer(response.data);
  }

  /**
   * Proxy with caching
   */
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async proxyWithCache(config: ProxyConfig): Promise<ProxyResponse> {
    const cacheKey = `${config.method}:${config.upstreamUrl}${config.targetPath}:${JSON.stringify(config.body)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached proxy response');
      return {
        success: true,
        status: 200,
        data: cached.data,
      };
    }

    // Make request
    const response = await this.proxyRequest(config);

    // Cache successful responses
    if (response.success) {
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    return response;
  }

  /**
   * Clear proxy cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const x402Proxy = X402ProxyService.getInstance();

