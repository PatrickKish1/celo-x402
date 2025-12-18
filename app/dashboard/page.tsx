'use client';

import { Header } from '@/components/ui/header';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppKitAccount } from '@reown/appkit/react';
import { x402Dashboard, type DashboardStats, type ServiceData, type ActivityItem } from '@/lib/x402-dashboard';

export default function DashboardPage() {
  const { address, isConnected } = useAppKitAccount();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
    activeServices: 0,
    userServices: 0,
    totalCalls: 0,
    totalRevenue: 0,
    monthlyCalls: 0,
    monthlyRevenue: 0,
  });
  const [services, setServices] = useState<ServiceData[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const userAddress = isConnected && address ? address : undefined;
      const [statsData, servicesData, activityData] = await Promise.all([
        x402Dashboard.getDashboardStats(userAddress),
        x402Dashboard.getServices(userAddress),
        x402Dashboard.getActivity(),
      ]);
      
      setStats(statsData);
      setServices(servicesData);
      setActivity(activityData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  
  useEffect(() => {
    loadDashboardData();
  }, [address, isConnected, loadDashboardData]);


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
            <div className="flex gap-2 mt-4 md:mt-0">
              <Link
                href="/dashboard/create"
                className="retro-button"
              >
                CREATE NEW API
              </Link>
              {/* <Link
                href="/dashboard/generate"
                className="retro-button bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                GENERATE MIDDLEWARE
              </Link> */}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {loading ? '...' : stats.totalServices}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL SERVICES
              </div>
            </div>
            
            {isConnected && address && (
              <div className="retro-card text-center bg-blue-50 border-blue-300">
                <div className="text-3xl font-bold font-mono mb-2 text-blue-600">
                  {loading ? '...' : stats.userServices}
                </div>
                <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                  YOUR SERVICES
                </div>
              </div>
            )}
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {loading ? '...' : stats.totalCalls.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL CALLS
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                ${loading ? '...' : stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL REVENUE
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                ${loading ? '...' : stats.monthlyRevenue.toLocaleString()}
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
                {loading ? (
                  <div className="text-center py-8 text-gray-600 font-mono">Loading...</div>
                ) : activity.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 font-mono">
                    No recent activity. Start using your APIs to see activity here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activity.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                        <div>
                          <div className="font-mono font-bold">
                            {item.type === 'call' ? `${item.serviceName} API Call` : 
                             item.type === 'create' ? 'New Service Created' : 
                             'Service Updated'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.address && item.endpoint ? 
                              `${item.address.slice(0, 8)}...${item.address.slice(-4)} called ${item.endpoint}` :
                              item.serviceName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">
                            {item.revenue ? `+${item.revenue.toFixed(6)} USDC` : '-'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              {loading ? (
                <div className="retro-card text-center py-8 text-gray-600 font-mono">
                  Loading services...
                </div>
              ) : services.length === 0 ? (
                <div className="retro-card text-center py-12">
                  <h3 className="text-xl font-bold font-mono mb-4">No Services Yet</h3>
                  <p className="text-gray-600 font-mono mb-6">
                    Create your first x402-enabled API to get started
                  </p>
                  <Link href="/dashboard/create" className="retro-button">
                    CREATE NEW API
                  </Link>
                </div>
              ) : (
                <>
                  {services.map(service => (
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
                </>
              )}
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
                    {stats.activeServices}
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
                    {stats.totalServices - stats.activeServices}
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
                    {stats.totalServices > 0 ? ((stats.activeServices / stats.totalServices) * 100).toFixed(1) : '0'}%
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
