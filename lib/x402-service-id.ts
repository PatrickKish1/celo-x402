/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Service ID Utilities
 * Generate stable, URL-safe IDs for x402 services
 */

/**
 * Generate a hash from a string (simple hash function)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a service ID from a resource URL
 * Returns a short, URL-safe identifier
 */
export function generateServiceId(resource: string): string {
  if (!resource) return 'unknown';
  
  try {
    // Use a combination of domain and path for uniqueness
    const url = new URL(resource);
    const domain = url.hostname.replace(/\./g, '-');
    const path = url.pathname.replace(/\//g, '-').replace(/^-|-$/g, '');
    const combined = `${domain}-${path}`;
    
    // If too long, use hash
    if (combined.length > 50) {
      return simpleHash(resource);
    }
    
    // Make URL-safe
    return encodeURIComponent(combined)
      .replace(/%/g, '')
      .toLowerCase()
      .substring(0, 50);
  } catch {
    // Fallback to hash if URL parsing fails
    return simpleHash(resource);
  }
}

/**
 * Get service ID from a service object
 */
export function getServiceId(service: { resource: string }): string {
  return generateServiceId(service?.resource || '');
}

