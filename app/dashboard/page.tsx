'use client';

import { Header } from '../../components/ui/header';
import { useState } from 'react';
import Link from 'next/link';

// Mock data for demonstration
const mockServices = [
  {
    id: '1',
    name: 'Weather Data API',
    status: 'active',
    upstreamUrl: 'https://api.weather.com/v1',
    proxyUrl: 'https://x402.yourdomain.com/svc/weather',
    endpoints: 3,
    totalCalls: 15420,
    totalRevenue: 771.00,
    discoverable: true,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Financial Market Data',
    status: 'active',
    upstreamUrl: 'https://api.finance.com/v2',
    proxyUrl: 'https://x402.yourdomain.com/svc/finance',
    endpoints: 8,
    totalCalls: 89230,
    totalRevenue: 8923.00,
    discoverable: true,
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Internal Analytics API',
    status: 'inactive',
    upstreamUrl: 'https://internal.company.com/api',
    proxyUrl: 'https://x402.yourdomain.com/svc/analytics',
    endpoints: 5,
    totalCalls: 0,
    totalRevenue: 0.00,
    discoverable: false,
    createdAt: '2024-01-20'
  }
];

const mockStats = {
  totalServices: 3,
  activeServices: 2,
  totalCalls: 104650,
  totalRevenue: 9694.00,
  monthlyCalls: 15420,
  monthlyRevenue: 771.00
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold font-mono tracking-wider mb-2">
                DASHBOARD
              </h1>
              <p className="font-mono text-gray-600">
                Manage your x402 APIs and monitor performance
              </p>
            </div>
            <Link
              href="/dashboard/create"
              className="retro-button mt-4 md:mt-0"
            >
              CREATE NEW API
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {mockStats.totalServices}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL SERVICES
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {mockStats.totalCalls.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL CALLS
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                ${mockStats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL REVENUE
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                ${mockStats.monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                THIS MONTH
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b-2 border-black mb-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'OVERVIEW' },
                { id: 'services', label: 'SERVICES' },
                { id: 'analytics', label: 'ANALYTICS' },
                { id: 'settings', label: 'SETTINGS' }
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
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  RECENT ACTIVITY
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-mono font-bold">Weather API Call</div>
                      <div className="text-sm text-gray-600">0x742d...b6 called /weather/current</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">+0.05 USDC</div>
                      <div className="text-sm text-gray-600">2 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-mono font-bold">Finance API Call</div>
                      <div className="text-sm text-gray-600">0x8ba1...44 called /stocks/price</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">+0.10 USDC</div>
                      <div className="text-sm text-gray-600">15 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-mono font-bold">New Service Created</div>
                      <div className="text-sm text-gray-600">Internal Analytics API</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">-</div>
                      <div className="text-sm text-gray-600">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              {mockServices.map(service => (
                <div key={service.id} className="retro-card">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold font-mono tracking-wide">
                          {service.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-mono font-bold ${
                          service.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                        }`}>
                          {service.status.toUpperCase()}
                        </span>
                        {service.discoverable && (
                          <span className="px-2 py-1 text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            DISCOVERABLE
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-mono font-bold">UPSTREAM URL</div>
                          <div className="text-gray-600 font-mono">{service.upstreamUrl}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold">PROXY URL</div>
                          <div className="text-gray-600 font-mono">{service.proxyUrl}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right mt-4 md:mt-0">
                      <div className="text-2xl font-bold font-mono mb-1">
                        ${service.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 font-mono">
                        Total Revenue
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <div className="font-mono font-bold">ENDPOINTS</div>
                      <div className="text-gray-600">{service.endpoints}</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold">TOTAL CALLS</div>
                      <div className="text-gray-600">{service.totalCalls.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold">CREATED</div>
                      <div className="text-gray-600">{service.createdAt}</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold">AVG REVENUE</div>
                      <div className="text-gray-600">
                        ${service.totalCalls > 0 ? (service.totalRevenue / service.totalCalls).toFixed(4) : '0.00'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/services/${service.id}`}
                      className="retro-button flex-1 text-center"
                    >
                      MANAGE
                    </Link>
                    <Link
                      href={`/dashboard/services/${service.id}/analytics`}
                      className="retro-button flex-1 bg-gray-100 text-center"
                    >
                      ANALYTICS
                    </Link>
                    <Link
                      href={`/dashboard/services/${service.id}/edit`}
                      className="retro-button flex-1 bg-gray-100 text-center"
                    >
                      EDIT
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Analytics Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold font-mono tracking-wider mb-4">
                  ANALYTICS DASHBOARD
                </h2>
                <p className="text-xl font-mono text-gray-700">
                  Real-time metrics and performance insights for your x402 APIs
                </p>
              </div>

              {/* Health Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="retro-card text-center">
                  <div className="h-16 w-16 bg-green-100 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <div className="h-8 w-8 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-green-600 mb-2">
                    {mockStats.activeServices}
                  </div>
                  <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                    HEALTHY APIS
                  </div>
                </div>
                
                <div className="retro-card text-center">
                  <div className="h-16 w-16 bg-red-100 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <div className="h-8 w-8 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-red-600 mb-2">
                    {mockStats.totalServices - mockStats.activeServices}
                  </div>
                  <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                    FAILED/INACTIVE
                  </div>
                </div>
                
                <div className="retro-card text-center">
                  <div className="h-16 w-16 bg-blue-100 mx-auto mb-4 rounded-full flex items-center justify-center">
                    <div className="h-8 w-8 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-blue-600 mb-2">
                    {((mockStats.activeServices / mockStats.totalServices) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                    UPTIME RATE
                  </div>
                </div>
              </div>

              {/* Chart Placeholders with Animations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* API Calls Over Time */}
                <div className="retro-card">
                  <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                    API CALLS OVER TIME
                  </h3>
                  <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-16 w-16 bg-blue-200 mx-auto mb-4 rounded animate-bounce"></div>
                      <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                      <p className="text-sm text-gray-500">Real-time API call metrics</p>
                    </div>
                  </div>
                </div>

                {/* Revenue Trends */}
                <div className="retro-card">
                  <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                    REVENUE TRENDS
                  </h3>
                  <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-16 w-16 bg-green-200 mx-auto mb-4 rounded animate-pulse"></div>
                      <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                      <p className="text-sm text-gray-500">USDC revenue analytics</p>
                    </div>
                  </div>
                </div>

                {/* Service Performance */}
                <div className="retro-card">
                  <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                    SERVICE PERFORMANCE
                  </h3>
                  <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-16 w-16 bg-purple-200 mx-auto mb-4 rounded animate-spin"></div>
                      <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                      <p className="text-sm text-gray-500">Response time & reliability</p>
                    </div>
                  </div>
                </div>

                {/* Network Activity */}
                <div className="retro-card">
                  <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                    NETWORK ACTIVITY
                  </h3>
                  <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-16 w-16 bg-orange-200 mx-auto mb-4 rounded animate-ping"></div>
                      <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                      <p className="text-sm text-gray-500">Base network metrics</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  LIVE ACTIVITY FEED
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 py-2 border-b border-gray-200">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm">Weather API: 0x742d...b6 called /current</span>
                    <span className="text-xs text-gray-500 ml-auto">2s ago</span>
                  </div>
                  <div className="flex items-center space-x-3 py-2 border-b border-gray-200">
                    <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm">Finance API: 0x8ba1...44 called /stocks/price</span>
                    <span className="text-xs text-gray-500 ml-auto">15s ago</span>
                  </div>
                  <div className="flex items-center space-x-3 py-2">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm">Analytics API: Service status check</span>
                    <span className="text-xs text-gray-500 ml-auto">1m ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="retro-card">
              <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                ACCOUNT SETTINGS
              </h3>
              <p className="text-gray-600 font-mono">
                Account configuration and preferences will be available here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
