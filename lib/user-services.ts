/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * User Service Tracking
 * Tracks which x402 services belong to which user (by address)
 */

export interface UserService {
  id: string;
  resource: string;
  ownerAddress: string;
  name: string;
  description?: string;
  upstreamUrl?: string; // For proxy mode
  proxyUrl?: string; // Generated proxy URL
  middlewareType?: 'proxy' | 'middleware';
  language?: 'node' | 'python' | 'java' | 'go' | 'rust';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'pending';
  discoverable: boolean;
  pricing: {
    amount: string;
    currency: string;
    network: string;
  };
  tokenConfig?: {
    address: string;
    decimals: number;
    name: string;
    version: string;
    symbol: string;
  };
}

const USER_SERVICES_KEY = 'x402_user_services';
const USER_SERVICES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class UserServiceManager {
  private static instance: UserServiceManager;
  private services: Map<string, UserService> = new Map();

  static getInstance(): UserServiceManager {
    if (!UserServiceManager.instance) {
      UserServiceManager.instance = new UserServiceManager();
    }
    return UserServiceManager.instance;
  }

  /**
   * Load services from localStorage
   */
  loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(USER_SERVICES_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.services && Array.isArray(data.services)) {
          this.services = new Map(
            data.services.map((s: UserService) => [s.id, s])
          );
        }
      }
    } catch (error) {
      console.error('Error loading user services from storage:', error);
    }
  }

  /**
   * Save services to localStorage
   */
  saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        services: Array.from(this.services.values()),
        timestamp: Date.now(),
      };
      localStorage.setItem(USER_SERVICES_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user services to storage:', error);
    }
  }

  /**
   * Get all services for a user
   */
  getUserServices(userAddress: string): UserService[] {
    this.loadFromStorage();
    return Array.from(this.services.values()).filter(
      (service) => service.ownerAddress.toLowerCase() === userAddress.toLowerCase()
    );
  }

  /**
   * Add a service for a user
   */
  addUserService(service: Omit<UserService, 'id' | 'createdAt' | 'updatedAt'>): UserService {
    this.loadFromStorage();

    const newService: UserService = {
      ...service,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.services.set(newService.id, newService);
    this.saveToStorage();

    // Also sync with backend if available
    this.syncToBackend(newService).catch(console.error);

    return newService;
  }

  /**
   * Update a user service
   */
  updateUserService(serviceId: string, updates: Partial<UserService>): UserService | null {
    this.loadFromStorage();

    const service = this.services.get(serviceId);
    if (!service) return null;

    const updated: UserService = {
      ...service,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.services.set(serviceId, updated);
    this.saveToStorage();

    // Sync with backend
    this.syncToBackend(updated).catch(console.error);

    return updated;
  }

  /**
   * Delete a user service
   */
  deleteUserService(serviceId: string, userAddress: string): boolean {
    this.loadFromStorage();

    const service = this.services.get(serviceId);
    if (!service) return false;

    // Verify ownership
    if (service.ownerAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return false;
    }

    this.services.delete(serviceId);
    this.saveToStorage();

    // Sync with backend
    this.syncToBackendDelete(serviceId).catch(console.error);

    return true;
  }

  /**
   * Get service by ID
   */
  getServiceById(serviceId: string): UserService | null {
    this.loadFromStorage();
    return this.services.get(serviceId) || null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `svc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Sync service to backend
   */
  private async syncToBackend(service: UserService): Promise<void> {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!backendUrl) return;

      await fetch(`${backendUrl}/api/user-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
    } catch (error) {
      console.error('Error syncing service to backend:', error);
    }
  }

  /**
   * Sync service deletion to backend
   */
  private async syncToBackendDelete(serviceId: string): Promise<void> {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!backendUrl) return;

      await fetch(`${backendUrl}/api/user-services/${serviceId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error syncing service deletion to backend:', error);
    }
  }

  /**
   * Get count of services for a user
   */
  getUserServiceCount(userAddress: string): number {
    return this.getUserServices(userAddress).length;
  }
}

export const userServiceManager = UserServiceManager.getInstance();

