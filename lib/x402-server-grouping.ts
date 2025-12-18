/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * Server/Origin Grouping Service
 * Groups x402 services by their origin/domain (server)
 * Similar to x402scan's architecture
 */

import { X402Service } from './x402-service';

export interface X402Server {
  id: string; // Domain-based ID
  domain: string;
  origin: string; // Full origin URL
  title?: string;
  description?: string;
  favicon?: string;
  resources: X402Service[];
  resourceCount: number;
  totalRevenue?: number;
  totalTransactions?: number;
  uniqueBuyers?: number;
  lastUpdated: string;
  metadata?: {
    category?: string;
    tags?: string[];
    websiteUrl?: string;
  };
}

/**
 * Extract origin/domain from a resource URL
 */
export function extractOrigin(resourceUrl: string): string {
  try {
    const url = new URL(resourceUrl);
    return url.origin;
  } catch {
    // Fallback: try to extract domain from string
    const match = resourceUrl.match(/https?:\/\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }
}

/**
 * Extract domain from a resource URL
 */
export function extractDomain(resourceUrl: string): string {
  try {
    const url = new URL(resourceUrl);
    return url.hostname;
  } catch {
    const match = resourceUrl.match(/https?:\/\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }
}

/**
 * Get favicon URL with smart fallback logic
 * Returns null if domain matches patterns that should use default fallback
 */
export function getFaviconUrl(domain: string): string | null {
  if (!domain || domain === 'unknown') {
    return null;
  }

  // If domain contains vercel.app, return null to trigger fallback
  if (domain.toLowerCase().includes('vercel.app')) {
    return null;
  }

  // Return the favicon URL
  return `https://${domain}/favicon.ico`;
}

/**
 * Group services by their origin/server
 */
export function groupServicesByServer(services: X402Service[]): X402Server[] {
  const serverMap = new Map<string, X402Server>();

  for (const service of services) {
    if (!service?.resource) continue;

    const origin = extractOrigin(service.resource);
    const domain = extractDomain(service.resource);
    const serverId = domain;

    if (!serverMap.has(serverId)) {
      // Create new server entry
      const server: X402Server = {
        id: serverId,
        domain,
        origin,
        title: service?.metadata?.name || domain,
        description: service?.metadata?.description,
        favicon: `${getFaviconUrl(domain)}`,
        resources: [],
        resourceCount: 0,
        lastUpdated: service.lastUpdated || new Date().toISOString(),
        metadata: {
          category: service?.metadata?.category,
          tags: service?.metadata?.tags || [],
          websiteUrl: origin,
        },
      };
      serverMap.set(serverId, server);
    }

    // Add resource to server
    const server = serverMap.get(serverId)!;
    server.resources.push(service);
    server.resourceCount = server.resources.length;

    // Update last updated if this service is newer
    if (service.lastUpdated && service.lastUpdated > server.lastUpdated) {
      server.lastUpdated = service.lastUpdated;
    }

    // Merge metadata
    if (service?.metadata) {
      if (service.metadata.name && !server.title) {
        server.title = service.metadata.name;
      }
      if (service.metadata.description && !server.description) {
        server.description = service.metadata.description;
      }
      if (service.metadata.tags) {
        const existingTags = server.metadata?.tags || [];
        server.metadata = {
          ...server.metadata,
          tags: [...new Set([...existingTags, ...service.metadata.tags])],
        };
      }
    }
  }

  return Array.from(serverMap.values()).sort((a, b) => {
    // Sort by resource count (most resources first)
    return b.resourceCount - a.resourceCount;
  });
}

/**
 * Get server by ID
 */
export function getServerById(servers: X402Server[], serverId: string): X402Server | null {
  return servers.find(s => s.id === serverId) || null;
}

/**
 * Get resources for a specific server
 */
export function getServerResources(servers: X402Server[], serverId: string): X402Service[] {
  const server = getServerById(servers, serverId);
  return server?.resources || [];
}

