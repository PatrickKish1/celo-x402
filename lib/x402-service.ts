/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// x402 Service for live API integration
import { x402Discovery } from './x402-discovery';

export interface X402Service {
  resource: string;
  type: string;
  x402Version: number;
  lastUpdated: string;
  metadata: Record<string, any>;
  accepts: X402PaymentRequirement[];
}

export interface X402PaymentRequirement {
  asset: string;
  description: string;
  extra: {
    name: string;
    version: string;
  };
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  mimeType: string;
  network: string;
  outputSchema: {
    input: {
      method: string;
      type: string;
      bodyType?: string;
      headerFields?: Record<string, { type: string; required?: boolean; description?: string; default?: any }>;
      queryFields?: Record<string, { type: string; required?: boolean; description?: string; default?: any }>;
      bodyFields?: Record<string, { type: string; required?: boolean; description?: string; default?: any }>;
    };
    output: any;
  };
  payTo: string;
  resource: string;
  scheme: string;
}

export interface X402BazaarResponse {
  items: X402Service[];
  total: number;
}

export class X402ServiceManager {
  private static instance: X402ServiceManager;
  private cache: Map<string, { data: X402Service; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): X402ServiceManager {
    if (!X402ServiceManager.instance) {
      X402ServiceManager.instance = new X402ServiceManager();
    }
    return X402ServiceManager.instance;
  }

  /**
   * Fetch live services from CDP x402 Bazaar
   * Now uses the real discovery service
   */
  async fetchLiveServices(): Promise<X402Service[]> {
    try {
      // Use the real discovery service
      return await x402Discovery.fetchLiveServices();
    } catch (error) {
      console.error('Error fetching x402 services:', error);
      // Return empty array on error, UI will handle fallback
      return [];
    }
  }

  async getServiceDetails(serviceId: string): Promise<X402Service | null> {
    // serviceId can be either a hash ID or the full resource URL
    // First, try to find by resource URL (for backward compatibility)
    // Then try to find by hash ID
    
    // Check memory cache first
    const cached = this.cache.get(serviceId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      // console.log('Using memory cached service details');
      return cached.data;
    }

    // Import service ID utilities
    const { generateServiceId } = await import('./x402-service-id');
    
    // Check localStorage cache for all services
    if (typeof window !== 'undefined') {
      try {
        // Check all localStorage keys that match the pattern
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('x402_services_cache_')) {
            const stored = localStorage.getItem(key);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.data && Array.isArray(parsed.data)) {
                  // Try to find by resource URL first (backward compatibility)
                  let service = parsed.data.find((s: X402Service) => s?.resource === serviceId);
                  
                  // If not found, try to find by hash ID
                  if (!service) {
                    service = parsed.data.find((s: X402Service) => 
                      s?.resource && generateServiceId(s.resource) === serviceId
                    );
                  }
                  
                  if (service) {
                    // console.log(`Found service in localStorage cache (${key})`);
                    this.cache.set(serviceId, { data: service, timestamp: Date.now() });
                    return service;
                  }
                }
              } catch (e) {
                // Skip invalid entries
              }
            }
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }
    }

    // Only fetch all services if not found in cache
    try {
      // console.log('Service not in cache, fetching from discovery service...');
      const services = await x402Discovery.fetchAllServices();
      
      // Try to find by resource URL first
      let service = services.find(s => s?.resource === serviceId);
      
      // If not found, try to find by hash ID
      if (!service) {
        service = services.find(s => 
          s?.resource && generateServiceId(s.resource) === serviceId
        );
      }
      
      if (service) {
        this.cache.set(serviceId, { data: service, timestamp: Date.now() });
        return service;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching service details:', error);
      return null;
    }
  }

  /**
   * Search services with advanced filtering
   * Now uses the real discovery service
   */
  async searchServices(query: string, filters?: {
    maxPrice?: number;
    network?: string;
    type?: string;
  }): Promise<X402Service[]> {
    try {
      return await x402Discovery.searchServices(query, filters);
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  }

  // Helper method to format USDC amounts
  formatUSDCAmount(amount: string): string {
    const usdcAmount = parseInt(amount) / 1000000; // USDC has 6 decimals
    return usdcAmount.toFixed(6);
  }

  // Helper method to get service tags from metadata
  getServiceTags(service: X402Service | null | undefined): string[] {
    if (!service) return [];
    
    const tags: string[] = [];
    
    // Extract tags from metadata with optional chaining
    if (service?.metadata?.tags && Array.isArray(service.metadata.tags)) {
      tags.push(...service.metadata.tags);
    }
    
    // Extract tags from resource URL
    if (service?.resource) {
      const urlParts = service.resource.split('/');
      if (urlParts.length > 2) {
        const domain = urlParts[2] || '';
        if (domain.includes('weather')) tags.push('weather');
        if (domain.includes('finance') || domain.includes('stock')) tags.push('finance');
        if (domain.includes('ai') || domain.includes('nlp')) tags.push('ai');
        if (domain.includes('geo') || domain.includes('location')) tags.push('geolocation');
      }
    }
    
    // Add type-based tags with optional chaining
    if (service?.type) {
      tags.push(service.type);
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Helper method to get service rating (placeholder for future implementation)
  getServiceRating(service: X402Service | null | undefined): number {
    if (!service) return 0;
    
    // This would integrate with a rating system in the future
    // For now, return a mock rating based on service metadata
    const baseRating = 4.5;
    const randomVariation = (Math.random() - 0.5) * 0.4; // ±0.2
    return Math.max(4.0, Math.min(5.0, baseRating + randomVariation));
  }
}

export const x402Service = X402ServiceManager.getInstance();
