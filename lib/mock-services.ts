/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Mock Service Data
 * This module provides mock data for development and testing.
 * In production, this data should come from the backend API.
 */

export interface MockService {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  upstreamUrl: string;
  proxyUrl: string;
  description?: string;
  endpoints: Array<{
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    price: string;
    description: string;
    calls?: number;
    revenue?: number;
  }>;
  headers: Array<{
    id: string;
    key: string;
    value: string;
    required: boolean;
  }>;
  discoverable: boolean;
  network: string;
  currency: string;
  docsType: 'swagger' | 'link' | 'manual';
  docsUrl: string;
  healthEndpoint: string;
  totalCalls?: number;
  totalRevenue?: number;
  createdAt?: string;
  lastUpdated?: string;
  healthStatus?: string;
  responseTime?: string;
  uptime?: string;
}

// Default mock service for development
export const DEFAULT_MOCK_SERVICE: MockService = {
  id: '1',
  name: 'Weather Data API',
  status: 'active',
  upstreamUrl: 'https://api.weather.com/v1',
  proxyUrl: 'https://x402.yourdomain.com/svc/weather',
  description: 'Real-time weather information and forecasts for global locations with historical data access.',
  endpoints: [
    { id: '1', path: '/current', method: 'GET', price: '0.05', description: 'Current weather data', calls: 15420, revenue: 771.00 },
    { id: '2', path: '/forecast', method: 'GET', price: '0.10', description: 'Weather forecast data', calls: 8920, revenue: 892.00 },
    { id: '3', path: '/historical', method: 'GET', price: '0.15', description: 'Historical weather data', calls: 4680, revenue: 702.00 }
  ],
  headers: [
    { id: '1', key: 'X-API-Version', value: 'v1', required: true },
    { id: '2', key: 'X-Client-ID', value: 'weather-app', required: false }
  ],
  discoverable: true,
  network: 'base',
  currency: 'USDC',
  docsType: 'swagger',
  docsUrl: 'https://api.weather.com/v1/swagger.json',
  healthEndpoint: '/health',
  totalCalls: 15420,
  totalRevenue: 771.00,
  createdAt: '2024-01-15',
  lastUpdated: '2024-01-20',
  healthStatus: 'healthy',
  responseTime: '45ms',
  uptime: '99.8%'
};

/**
 * Fetch a service by ID
 * In production, this should call the backend API
 */
export async function fetchServiceById(serviceId: string): Promise<MockService | null> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-services/${serviceId}`);
  // const data = await response.json();
  // return data.service;
  
  // For now, return mock data
  if (serviceId === '1') {
    return DEFAULT_MOCK_SERVICE;
  }
  return null;
}

/**
 * Fetch all services for a user
 * In production, this should call the backend API
 */
export async function fetchUserServices(userId: string): Promise<MockService[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-services?userId=${userId}`);
  // const data = await response.json();
  // return data.services;
  
  // For now, return mock data
  return [DEFAULT_MOCK_SERVICE];
}

