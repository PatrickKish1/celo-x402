/* eslint-disable @typescript-eslint/no-unused-vars, prefer-const */
// Real CDP x402 Bazaar Discovery Service
import { X402Service, X402PaymentRequirement, X402BazaarResponse } from './x402-service';
import { rateLimiters } from './rate-limiter';

// Use local proxy to avoid CORS issues in development
const X402_BAZAAR_URL = typeof window !== 'undefined' 
  ? '/api/discovery' 
  : 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources';

export interface DiscoveryFilters {
  type?: string;
  limit?: number;
  offset?: number;
  network?: string;
  maxPrice?: number;
}

export interface FacilitatorConfig {
  url?: string;
  apiKey?: string;
  apiSecret?: string;
}

export class X402DiscoveryService {
  private static instance: X402DiscoveryService;
  private cache: Map<string, { data: X402Service[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly LOCALSTORAGE_KEY = 'x402_services_cache';

  static getInstance(): X402DiscoveryService {
    if (!X402DiscoveryService.instance) {
      X402DiscoveryService.instance = new X402DiscoveryService();
    }
    return X402DiscoveryService.instance;
  }

  /**
   * Get cached data from localStorage
   */
  private getLocalStorageCache(cacheKey: string): X402Service[] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`${this.LOCALSTORAGE_KEY}_${cacheKey}`);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
        console.log('Using localStorage cached services');
        return parsed.data;
      }
      
      // Expired, remove it
      localStorage.removeItem(`${this.LOCALSTORAGE_KEY}_${cacheKey}`);
      return null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Save data to localStorage
   */
  private setLocalStorageCache(cacheKey: string, data: X402Service[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(
        `${this.LOCALSTORAGE_KEY}_${cacheKey}`,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  /**
   * Fetch ALL services from CDP x402 Bazaar with pagination and localStorage caching
   */
  async fetchAllServices(filters?: Omit<DiscoveryFilters, 'limit' | 'offset'>): Promise<X402Service[]> {
    const cacheKey = `all_${JSON.stringify(filters || {})}`;
    
    try {
      // Check memory cache first
      const memCached = this.cache.get(cacheKey);
      if (memCached && Date.now() - memCached.timestamp < this.CACHE_DURATION) {
        console.log('Returning memory cached all x402 services');
        return memCached.data;
      }

      // Check localStorage cache
      const localCached = this.getLocalStorageCache(cacheKey);
      if (localCached && localCached.length > 0) {
        this.cache.set(cacheKey, { data: localCached, timestamp: Date.now() });
        return localCached;
      }

      // Fetch all pages
      let allItems: X402Service[] = [];
      let offset = 0;
      const limit = 100; // Max per page
      let hasMore = true;

      console.log('Fetching ALL x402 services from CDP Bazaar with pagination...');

      while (hasMore) {
        // Wait for rate limit token before making request
        await rateLimiters.cdp.waitForToken();
        
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        const url = `${X402_BAZAAR_URL}${params.toString() ? '?' + params.toString() : ''}`;
        
        console.log(`Fetching page ${Math.floor(offset / limit) + 1} with rate limiting (${rateLimiters.cdp.getTokenCount().toFixed(2)} tokens available)`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // If rate limited, wait and retry
          if (response.status === 429) {
            console.warn('Rate limited by server, waiting 2 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue; // Retry same page
          }
          throw new Error(`Failed to fetch x402 services: ${response.status} ${response.statusText}`);
        }

        const data: X402BazaarResponse = await response.json();
        const items = data.items || [];
        
        console.log(`Successfully fetched page ${Math.floor(offset / limit) + 1}: ${items.length} services`);
        
        allItems = [...allItems, ...items];
        
        // Check if there are more pages
        hasMore = items.length === limit;
        offset += limit;
        
        // Safety limit to prevent infinite loops
        if (offset > 1000) {
          console.warn('Reached safety limit of 1000 services');
          break;
        }
        
        // Add small delay between pages for safety (belt and suspenders)
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Successfully fetched ${allItems.length} total x402 services`);

      // Apply client-side filters
      let filteredItems = allItems;

      if (filters?.network) {
        filteredItems = filteredItems.filter(item =>
          item.accepts.some(accept => accept.network === filters.network)
        );
      }

      if (filters?.maxPrice) {
        filteredItems = filteredItems.filter(item =>
          item.accepts.some(accept => {
            const price = parseInt(accept.maxAmountRequired) / 1000000;
            return price <= filters.maxPrice!;
          })
        );
      }

      // Cache in memory and localStorage
      this.cache.set(cacheKey, { data: filteredItems, timestamp: Date.now() });
      this.setLocalStorageCache(cacheKey, filteredItems);

      return filteredItems;
    } catch (error) {
      console.error('Error fetching all x402 services:', error);
      
      // Try to return localStorage cache as fallback
      const fallback = this.getLocalStorageCache(cacheKey);
      if (fallback && fallback.length > 0) {
        console.log('Using stale localStorage cache as fallback');
        return fallback;
      }
      
      throw error;
    }
  }

  /**
   * Fetch live services from CDP x402 Bazaar with localStorage caching (single page)
   */
  async fetchLiveServices(filters?: DiscoveryFilters): Promise<X402Service[]> {
    // If no limit/offset specified, fetch all services
    if (!filters?.limit && !filters?.offset) {
      return this.fetchAllServices(filters);
    }

    const cacheKey = JSON.stringify(filters || {});
    
    try {
      // Check memory cache first
      const memCached = this.cache.get(cacheKey);
      if (memCached && Date.now() - memCached.timestamp < this.CACHE_DURATION) {
        console.log('Returning memory cached x402 services');
        return memCached.data;
      }

      // Check localStorage cache
      const localCached = this.getLocalStorageCache(cacheKey);
      if (localCached && localCached.length > 0) {
        this.cache.set(cacheKey, { data: localCached, timestamp: Date.now() });
        return localCached;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const url = `${X402_BAZAAR_URL}${params.toString() ? '?' + params.toString() : ''}`;
      
      console.log('Fetching live x402 services from CDP Bazaar:', url);

      // Wait for rate limit token before making request
      await rateLimiters.cdp.waitForToken();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch x402 services: ${response.status} ${response.statusText}`);
      }

      const data: X402BazaarResponse = await response.json();
      
      console.log(`Successfully fetched ${data.items?.length || 0} x402 services`);

      // Apply client-side filters
      let filteredItems = data.items || [];

      if (filters?.network) {
        filteredItems = filteredItems.filter(item =>
          item.accepts.some(accept => accept.network === filters.network)
        );
      }

      if (filters?.maxPrice) {
        filteredItems = filteredItems.filter(item =>
          item.accepts.some(accept => {
            const price = parseInt(accept.maxAmountRequired) / 1000000;
            return price <= filters.maxPrice!;
          })
        );
      }

      // Cache in memory and localStorage
      this.cache.set(cacheKey, { data: filteredItems, timestamp: Date.now() });
      this.setLocalStorageCache(cacheKey, filteredItems);

      return filteredItems;
    } catch (error) {
      console.error('Error fetching live x402 services:', error);
      
      // Try to return localStorage cache as fallback
      const fallback = this.getLocalStorageCache(cacheKey);
      if (fallback && fallback.length > 0) {
        console.log('Using stale localStorage cache as fallback');
        return fallback;
      }
      
      throw error;
    }
  }

  /**
   * Get a specific service by resource URL
   */
  async getServiceByResource(resourceUrl: string): Promise<X402Service | null> {
    try {
      const services = await this.fetchLiveServices();
      return services.find(s => s.resource === resourceUrl) || null;
    } catch (error) {
      console.error('Error fetching service details:', error);
      return null;
    }
  }

  /**
   * Search services with advanced filtering
   */
  async searchServices(
    query: string,
    filters?: Omit<DiscoveryFilters, 'limit' | 'offset'>
  ): Promise<X402Service[]> {
    try {
      const services = await this.fetchLiveServices();

      // Filter by search query
      let filtered = services.filter(service => {
        const searchText = `${service.resource} ${JSON.stringify(service.metadata)}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

      // Apply additional filters
      if (filters?.network) {
        filtered = filtered.filter(service =>
          service.accepts.some(accept => accept.network === filters.network)
        );
      }

      if (filters?.maxPrice) {
        filtered = filtered.filter(service =>
          service.accepts.some(accept => {
            const price = parseInt(accept.maxAmountRequired) / 1000000;
            return price <= filters.maxPrice!;
          })
        );
      }

      if (filters?.type) {
        filtered = filtered.filter(service => service.type === filters.type);
      }

      return filtered;
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  }

  /**
   * Get supported networks from all services
   */
  async getSupportedNetworks(): Promise<string[]> {
    try {
      const services = await this.fetchLiveServices();
      const networks = new Set<string>();
      
      services.forEach(service => {
        service.accepts.forEach(accept => {
          if (accept.network) {
            networks.add(accept.network);
          }
        });
      });

      return Array.from(networks);
    } catch (error) {
      console.error('Error fetching supported networks:', error);
      return [];
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStats() {
    try {
      const services = await this.fetchLiveServices();
      
      const networks = new Set<string>();
      const types = new Set<string>();
      let totalServices = services.length;
      let lowestPrice = Infinity;
      let highestPrice = 0;

      services.forEach(service => {
        types.add(service.type);
        service.accepts.forEach(accept => {
          networks.add(accept.network);
          const price = parseInt(accept.maxAmountRequired) / 1000000;
          if (price < lowestPrice) lowestPrice = price;
          if (price > highestPrice) highestPrice = price;
        });
      });

      return {
        totalServices,
        networks: Array.from(networks),
        types: Array.from(types),
        priceRange: {
          lowest: lowestPrice === Infinity ? 0 : lowestPrice,
          highest: highestPrice,
        },
      };
    } catch (error) {
      console.error('Error fetching service stats:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Refresh cache for a specific filter set
   */
  async refreshCache(filters?: DiscoveryFilters) {
    const cacheKey = JSON.stringify(filters || {});
    this.cache.delete(cacheKey);
    return this.fetchLiveServices(filters);
  }
}

export const x402Discovery = X402DiscoveryService.getInstance();

