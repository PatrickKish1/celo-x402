/* eslint-disable @typescript-eslint/no-unused-vars */
// Dashboard Service - Live data with localStorage caching
import { x402Discovery } from './x402-discovery';
import { x402ResourceManager } from './x402-resource-manager';

export interface DashboardStats {
  totalServices: number;
  activeServices: number;
  userServices: number; // Services owned by current user
  totalCalls: number;
  totalRevenue: number;
  monthlyCalls: number;
  monthlyRevenue: number;
}

export interface ServiceData {
  id: string;
  name: string;
  resource?: string; // API resource URL
  status: 'active' | 'inactive' | 'pending';
  upstreamUrl: string;
  proxyUrl: string;
  endpoints: number;
  totalCalls: number;
  totalRevenue: number;
  discoverable: boolean;
  createdAt: string;
}

export interface ActivityItem {
  type: 'call' | 'create' | 'update';
  serviceName: string;
  address?: string;
  endpoint?: string;
  revenue?: number;
  timestamp: string;
}

export class X402DashboardService {
  private static instance: X402DashboardService;
  private readonly STATS_KEY = 'x402_dashboard_stats';
  private readonly ACTIVITY_KEY = 'x402_dashboard_activity';

  static getInstance(): X402DashboardService {
    if (!X402DashboardService.instance) {
      X402DashboardService.instance = new X402DashboardService();
    }
    return X402DashboardService.instance;
  }

  private getFromStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setToStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  async getDashboardStats(userAddress?: string): Promise<DashboardStats> {
    try {
      const registeredServices = x402ResourceManager.getAllResources();
      const discoveredServices = await x402Discovery.fetchLiveServices();

      const cachedStats = this.getFromStorage<DashboardStats>(this.STATS_KEY);
      
      // Import user service manager
      const { userServiceManager } = await import('./user-services');
      
      const totalServices = registeredServices.length + discoveredServices.length;
      const activeServices = registeredServices.length;
      const userServices = userAddress 
        ? userServiceManager.getUserServiceCount(userAddress)
        : 0;
      
      const stats: DashboardStats = {
        totalServices,
        activeServices,
        userServices,
        totalCalls: cachedStats?.totalCalls || 0,
        totalRevenue: cachedStats?.totalRevenue || 0,
        monthlyCalls: cachedStats?.monthlyCalls || 0,
        monthlyRevenue: cachedStats?.monthlyRevenue || 0,
      };

      this.setToStorage(this.STATS_KEY, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return this.getFromStorage<DashboardStats>(this.STATS_KEY) || {
        totalServices: 0,
        activeServices: 0,
        userServices: 0,
        totalCalls: 0,
        totalRevenue: 0,
        monthlyCalls: 0,
        monthlyRevenue: 0,
      };
    }
  }

  async getServices(userAddress?: string): Promise<ServiceData[]> {
    try {
      // If user address provided, get user-specific services
      if (userAddress) {
        const { userServiceManager } = await import('./user-services');
        const userServices = userServiceManager.getUserServices(userAddress);
        
        return userServices.map(service => ({
          id: service.id,
          name: service.name,
          resource: service.resource,
          status: service.status as 'active' | 'inactive' | 'pending',
          upstreamUrl: service.upstreamUrl || service.resource,
          proxyUrl: service.proxyUrl || `/api/x402/${service.resource}`,
          endpoints: 1, // Default, can be enhanced
          totalCalls: 0,
          totalRevenue: 0,
          discoverable: service.discoverable,
          createdAt: service.createdAt.split('T')[0],
        }));
      }

      // Otherwise return all registered services
      const registeredServices = x402ResourceManager.getAllResources();
      
      const services: ServiceData[] = registeredServices.map((service, index) => {
        const primaryAccept = service.accepts[0];
        const priceUSDC = primaryAccept ? 
          (parseInt(primaryAccept.maxAmountRequired) / 1000000).toFixed(2) : '0.00';

        return {
          id: `service-${index}`,
          name: service.metadata?.title || service.resource.split('/').pop() || 'Unnamed Service',
          resource: service.resource,
          status: 'active' as 'active' | 'inactive' | 'pending',
          upstreamUrl: service.resource,
          proxyUrl: `/api/x402/${service.resource}`,
          endpoints: service.accepts.length,
          totalCalls: 0,
          totalRevenue: 0,
          discoverable: true,
          createdAt: service.lastUpdated.split('T')[0],
        };
      });

      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async getActivity(): Promise<ActivityItem[]> {
    const cached = this.getFromStorage<ActivityItem[]>(this.ACTIVITY_KEY);
    return cached || [];
  }

  addActivity(activity: ActivityItem): void {
    const current = this.getFromStorage<ActivityItem[]>(this.ACTIVITY_KEY) || [];
    current.unshift(activity);
    
    const limited = current.slice(0, 50);
    this.setToStorage(this.ACTIVITY_KEY, limited);
  }

  recordApiCall(serviceName: string, address: string, endpoint: string, revenue: number): void {
    this.addActivity({
      type: 'call',
      serviceName,
      address,
      endpoint,
      revenue,
      timestamp: new Date().toISOString(),
    });

    const stats = this.getFromStorage<DashboardStats>(this.STATS_KEY);
    if (stats) {
      stats.totalCalls += 1;
      stats.monthlyCalls += 1;
      stats.totalRevenue += revenue;
      stats.monthlyRevenue += revenue;
      this.setToStorage(this.STATS_KEY, stats);
    }
  }
}

export const x402Dashboard = X402DashboardService.getInstance();

