/**
 * Backend Configuration
 * Defines URLs for backend services (gateway, APIs, etc.)
 */

export const BACKEND_CONFIG = {
  // Backend base URL
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 
           (process.env.NODE_ENV === 'production' 
             ? 'https://x402-manager-backend.vercel.app' 
             : 'http://localhost:3001'),
  
  // Gateway URL (for proxying API requests with payment)
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || 
              (process.env.NODE_ENV === 'production' 
                ? 'https://x402-manager-backend.vercel.app' 
                : 'https://x402-manager-backend.vercel.app/api/gateway'),
  
  // API endpoints
  endpoints: {
    health: '/api/health',
    userServices: '/api/user-services',
    analytics: '/api/analytics',
    discovery: '/api/discovery',
    nonces: '/api/nonces',
  },
};

/**
 * Get full backend URL for an endpoint
 */
export function getBackendUrl(endpoint: string): string {
  return `${BACKEND_CONFIG.baseUrl}${endpoint}`;
}

/**
 * Get full gateway URL
 */
export function getGatewayUrl(userId: string, serviceId: string, endpoint: string): string {
  return `${BACKEND_CONFIG.gatewayUrl}/${userId}/${serviceId}${endpoint}`;
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(getBackendUrl(BACKEND_CONFIG.endpoints.health));
    return response.ok;
  } catch (error) {
    console.error('[Backend] Health check failed:', error);
    return false;
  }
}

