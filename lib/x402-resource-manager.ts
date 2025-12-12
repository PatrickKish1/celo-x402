/* eslint-disable @typescript-eslint/no-explicit-any */
// x402 Resource Registration and Management System
// Based on x402scan implementation

import { X402Service } from './x402-service';

export interface ResourceRegistration {
  resource: string;
  type: string;
  x402Version: number;
  accepts: any[];
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
    author?: string;
    website?: string;
  };
  origin?: {
    domain: string;
    favicon?: string;
    title?: string;
    description?: string;
  };
}

export interface RegistrationResult {
  success: boolean;
  resource?: X402Service;
  error?: string;
  warnings?: string[];
}

export interface ResourceMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  tags?: string[];
}

export class X402ResourceManager {
  private static instance: X402ResourceManager;
  private resources: Map<string, X402Service> = new Map();

  static getInstance(): X402ResourceManager {
    if (!X402ResourceManager.instance) {
      X402ResourceManager.instance = new X402ResourceManager();
    }
    return X402ResourceManager.instance;
  }

  /**
   * Register a new x402 resource
   */
  async registerResource(url: string): Promise<RegistrationResult> {
    try {
      console.log('Registering x402 resource:', url);

      // Clean URL
      const cleanUrl = this.cleanUrl(url);

      // Check if already registered
      if (this.resources.has(cleanUrl)) {
        return {
          success: false,
          error: 'Resource already registered',
        };
      }

      // Fetch x402 response from the URL
      const x402Response = await this.fetchX402Response(cleanUrl);

      if (!x402Response) {
        return {
          success: false,
          error: 'Failed to fetch x402 response from URL',
        };
      }

      // Validate x402 response
      const validation = this.validateX402Response(x402Response);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Scrape metadata
      const metadata = await this.scrapeMetadata(cleanUrl);

      // Create resource object
      const resource: X402Service = {
        resource: cleanUrl,
        type: x402Response.type || 'http',
        x402Version: x402Response.x402Version || 1,
        lastUpdated: new Date().toISOString(),
        metadata: {
          ...metadata,
          ...x402Response.metadata,
        },
        accepts: x402Response.accepts || [],
      };

      // Store resource
      this.resources.set(cleanUrl, resource);

      console.log('Resource registered successfully:', cleanUrl);

      return {
        success: true,
        resource,
      };
    } catch (error) {
      console.error('Resource registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown registration error',
      };
    }
  }

  /**
   * Fetch x402 response from a URL
   */
  private async fetchX402Response(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      // x402 endpoints should return 402 status
      if (response.status !== 402) {
        console.warn('Expected 402 status, got:', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching x402 response:', error);
      return null;
    }
  }

  /**
   * Validate x402 response format
   */
  private validateX402Response(response: any): { valid: boolean; error?: string } {
    if (!response) {
      return { valid: false, error: 'Empty response' };
    }

    if (!response.accepts || !Array.isArray(response.accepts)) {
      return { valid: false, error: 'Missing or invalid "accepts" field' };
    }

    if (response.accepts.length === 0) {
      return { valid: false, error: 'At least one payment requirement must be specified' };
    }

    // Validate each payment requirement
    for (const accept of response.accepts) {
      if (!accept.scheme) {
        return { valid: false, error: 'Missing "scheme" in payment requirement' };
      }
      if (!accept.network) {
        return { valid: false, error: 'Missing "network" in payment requirement' };
      }
      if (!accept.maxAmountRequired) {
        return { valid: false, error: 'Missing "maxAmountRequired" in payment requirement' };
      }
      if (!accept.payTo) {
        return { valid: false, error: 'Missing "payTo" address in payment requirement' };
      }
    }

    return { valid: true };
  }

  /**
   * Scrape metadata from URL
   */
  private async scrapeMetadata(url: string): Promise<ResourceMetadata> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });

      const html = await response.text();

      // Simple HTML parsing for meta tags
      const metadata: ResourceMetadata = {};

      // Title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }

      // Description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (descMatch) {
        metadata.description = descMatch[1].trim();
      }

      // OG Image
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImageMatch) {
        metadata.ogImage = ogImageMatch[1].trim();
      }

      // Favicon
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
      if (faviconMatch) {
        metadata.favicon = new URL(faviconMatch[1].trim(), url).toString();
      }

      return metadata;
    } catch (error) {
      console.error('Error scraping metadata:', error);
      return {};
    }
  }

  /**
   * Clean and normalize URL
   */
  private cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.search = ''; // Remove query params
      urlObj.hash = ''; // Remove hash
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Get a registered resource
   */
  getResource(url: string): X402Service | null {
    const cleanUrl = this.cleanUrl(url);
    return this.resources.get(cleanUrl) || null;
  }

  /**
   * Get all registered resources
   */
  getAllResources(): X402Service[] {
    return Array.from(this.resources.values());
  }

  /**
   * Update a resource
   */
  async updateResource(url: string): Promise<RegistrationResult> {
    const cleanUrl = this.cleanUrl(url);
    
    // Remove existing
    this.resources.delete(cleanUrl);
    
    // Re-register
    return this.registerResource(cleanUrl);
  }

  /**
   * Delete a resource
   */
  deleteResource(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    return this.resources.delete(cleanUrl);
  }

  /**
   * Search resources
   */
  searchResources(query: string): X402Service[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllResources().filter(resource => {
      const searchText = `${resource.resource} ${resource.metadata?.title || ''} ${resource.metadata?.description || ''}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }

  /**
   * Get resources by network
   */
  getResourcesByNetwork(network: string): X402Service[] {
    return this.getAllResources().filter(resource =>
      resource.accepts.some(accept => accept.network === network)
    );
  }

  /**
   * Get resources by price range
   */
  getResourcesByPriceRange(minPrice: number, maxPrice: number): X402Service[] {
    return this.getAllResources().filter(resource =>
      resource.accepts.some(accept => {
        const price = parseInt(accept.maxAmountRequired) / 1000000; // USDC has 6 decimals
        return price >= minPrice && price <= maxPrice;
      })
    );
  }

  /**
   * Verify resource is still active
   */
  async verifyResource(url: string): Promise<boolean> {
    try {
      const response = await this.fetchX402Response(url);
      return !!response && this.validateX402Response(response).valid;
    } catch {
      return false;
    }
  }

  /**
   * Batch register multiple resources
   */
  async batchRegister(urls: string[]): Promise<RegistrationResult[]> {
    const results: RegistrationResult[] = [];
    
    for (const url of urls) {
      const result = await this.registerResource(url);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Export resources to JSON
   */
  exportResources(): string {
    const resources = this.getAllResources();
    return JSON.stringify(resources, null, 2);
  }

  /**
   * Import resources from JSON
   */
  importResources(json: string): number {
    try {
      const resources: X402Service[] = JSON.parse(json);
      let count = 0;
      
      for (const resource of resources) {
        this.resources.set(resource.resource, resource);
        count++;
      }
      
      return count;
    } catch (error) {
      console.error('Error importing resources:', error);
      return 0;
    }
  }

  /**
   * Get resource statistics
   */
  getStatistics() {
    const resources = this.getAllResources();
    const networks = new Set<string>();
    const types = new Set<string>();
    let totalAccepts = 0;

    resources.forEach(resource => {
      types.add(resource.type);
      resource.accepts.forEach(accept => {
        networks.add(accept.network);
        totalAccepts++;
      });
    });

    return {
      totalResources: resources.length,
      totalAccepts,
      networks: Array.from(networks),
      types: Array.from(types),
    };
  }
}

export const x402ResourceManager = X402ResourceManager.getInstance();

