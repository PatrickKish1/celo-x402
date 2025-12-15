/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock service data - in production this would come from API
const mockService = {
  id: '1',
  name: 'Weather Data API',
  status: 'active',
  upstreamUrl: 'https://api.weather.com/v1',
  proxyUrl: 'https://x402.yourdomain.com/svc/weather',
  endpoints: [
    { path: '/current', method: 'GET', price: '0.05', calls: 15420, revenue: 771.00 },
    { path: '/forecast', method: 'GET', price: '0.10', calls: 8920, revenue: 892.00 },
    { path: '/historical', method: 'GET', price: '0.15', calls: 4680, revenue: 702.00 }
  ],
  totalCalls: 15420,
  totalRevenue: 771.00,
  discoverable: true,
  createdAt: '2024-01-15',
  lastUpdated: '2024-01-20',
  network: 'base',
  currency: 'USDC',
  healthStatus: 'healthy',
  responseTime: '45ms',
  uptime: '99.8%'
};

export default function ServiceManagementPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // In production, fetch service data based on serviceId
  const service = mockService;

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-bold font-mono mb-4">SERVICE NOT FOUND</h1>
            <Link href="/dashboard" className="retro-button">
              BACK TO DASHBOARD
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mb-8">
            <nav className="mb-6">
              <Link href="/dashboard" className="text-blue-600 hover:underline font-mono">
                ← BACK TO DASHBOARD
              </Link>
            </nav>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-4xl font-bold font-mono tracking-wider mb-2">
                  {service.name}
                </h1>
                <p className="font-mono text-gray-600">
                  Service ID: {service.id} • Created: {service.createdAt}
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Link
                  href={`/dashboard/services/${service.id}/edit`}
                  className="retro-button bg-gray-100"
                >
                  EDIT SERVICE
                </Link>
                <Link
                  href={`/dashboard/services/${service.id}/analytics`}
                  className="retro-button"
                >
                  VIEW ANALYTICS
                </Link>
              </div>
            </div>
          </div>

          {/* Service Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {service.status === 'active' ? '✓' : '✗'}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                STATUS
              </div>
              <div className={`text-sm font-mono font-bold ${
                service.status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {service.status.toUpperCase()}
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {service.totalCalls.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL CALLS
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                ${service.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL REVENUE
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {service.uptime}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                UPTIME
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b-2 border-black mb-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'OVERVIEW' },
                { id: 'endpoints', label: 'ENDPOINTS' },
                { id: 'configuration', label: 'CONFIGURATION' },
                { id: 'monitoring', label: 'MONITORING' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 font-mono font-bold text-sm tracking-wide border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Service Information */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  SERVICE INFORMATION
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-mono font-bold text-sm mb-2">UPSTREAM URL</div>
                    <div className="text-gray-600 font-mono text-sm break-all">{service.upstreamUrl}</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm mb-2">PROXY URL</div>
                    <div className="text-gray-600 font-mono text-sm break-all">{service.proxyUrl}</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm mb-2">NETWORK</div>
                    <div className="text-gray-600 font-mono text-sm">{service.network.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm mb-2">CURRENCY</div>
                    <div className="text-gray-600 font-mono text-sm">{service.currency}</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm mb-2">DISCOVERABLE</div>
                    <div className="text-gray-600 font-mono text-sm">
                      {service.discoverable ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm mb-2">LAST UPDATED</div>
                    <div className="text-gray-600 font-mono text-sm">{service.lastUpdated}</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  PERFORMANCE METRICS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-green-600 mb-2">
                      {service.healthStatus.toUpperCase()}
                    </div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      HEALTH STATUS
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono mb-2">
                      {service.responseTime}
                    </div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      AVG RESPONSE TIME
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono mb-2">
                      {service.endpoints.length}
                    </div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      ACTIVE ENDPOINTS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  API ENDPOINTS
                </h3>
                <div className="space-y-4">
                  {service.endpoints.map((endpoint, index) => (
                    <div key={index} className="border-2 border-black p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">ENDPOINT</div>
                          <div className="font-mono text-sm">{endpoint.path}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">METHOD</div>
                          <div className="font-mono text-sm">{endpoint.method}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">PRICE</div>
                          <div className="font-mono text-sm">${endpoint.price} USDC</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">CALLS</div>
                          <div className="font-mono text-sm">{endpoint.calls.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">REVENUE</div>
                          <div className="font-mono text-sm">${endpoint.revenue.toFixed(2)}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="retro-button bg-gray-100 text-sm px-3 py-1">
                            TEST
                          </button>
                          <button className="retro-button bg-gray-100 text-sm px-3 py-1">
                            LOGS
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'configuration' && (
            <div className="space-y-6">
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  SERVICE CONFIGURATION
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        SERVICE NAME
                      </label>
                      <input
                        type="text"
                        value={service.name}
                        className="retro-input w-full"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        STATUS
                      </label>
                      <select className="retro-input w-full">
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                        <option value="maintenance">MAINTENANCE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        DISCOVERABLE
                      </label>
                      <select className="retro-input w-full">
                        <option value="true">YES</option>
                        <option value="false">NO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        NETWORK
                      </label>
                      <select className="retro-input w-full">
                        <option value="base">BASE</option>
                        <option value="base-sepolia">BASE SEPOLIA</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button className="retro-button">
                      SAVE CHANGES
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  REAL-TIME MONITORING
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border-2 border-black">
                      <div className="text-2xl font-bold font-mono text-green-600 mb-2">✓</div>
                      <div className="font-mono font-bold text-sm">HEALTHY</div>
                      <div className="text-xs text-gray-600">Last check: 2s ago</div>
                    </div>
                    <div className="text-center p-4 border-2 border-black">
                      <div className="text-2xl font-bold font-mono mb-2">45ms</div>
                      <div className="font-mono font-bold text-sm">RESPONSE TIME</div>
                      <div className="text-xs text-gray-600">Average</div>
                    </div>
                    <div className="text-center p-4 border-2 border-black">
                      <div className="text-2xl font-bold font-mono mb-2">99.8%</div>
                      <div className="font-mono font-bold text-sm">UPTIME</div>
                      <div className="text-xs text-gray-600">This month</div>
                    </div>
                  </div>
                  
                  <div className="border-2 border-black p-4">
                    <h4 className="font-mono font-bold mb-3">RECENT ACTIVITY</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-mono">0x742d...b6 called /current</span>
                        <span className="text-gray-600">2s ago</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-mono">0x8ba1...44 called /forecast</span>
                        <span className="text-gray-600">15s ago</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-mono">Health check completed</span>
                        <span className="text-gray-600">1m ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
