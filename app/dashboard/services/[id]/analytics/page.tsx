'use client';

import { Header } from '../../../../../components/ui/header';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Mock analytics data - in production this would come from API
const mockAnalytics = {
  serviceId: '1',
  serviceName: 'Weather Data API',
  timeRange: '30d',
  metrics: {
    totalCalls: 15420,
    totalRevenue: 771.00,
    avgResponseTime: 45,
    uptime: 99.8,
    errorRate: 0.2,
    uniqueUsers: 1247
  },
  callsByEndpoint: [
    { endpoint: '/current', calls: 8920, revenue: 446.00, avgTime: 42 },
    { endpoint: '/forecast', calls: 4680, revenue: 234.00, avgTime: 48 },
    { endpoint: '/historical', calls: 1820, revenue: 91.00, avgTime: 51 }
  ],
  callsOverTime: [
    { date: '2024-01-15', calls: 512, revenue: 25.60 },
    { date: '2024-01-16', calls: 498, revenue: 24.90 },
    { date: '2024-01-17', calls: 523, revenue: 26.15 },
    { date: '2024-01-18', calls: 489, revenue: 24.45 },
    { date: '2024-01-19', calls: 534, revenue: 26.70 },
    { date: '2024-01-20', calls: 521, revenue: 26.05 }
  ],
  topUsers: [
    { address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', calls: 1247, revenue: 62.35 },
    { address: '0x8ba1f109551bA432b026B4473A19798490eF6E44', calls: 892, revenue: 44.60 },
    { address: '0x1234567890abcdef1234567890abcdef12345678', calls: 567, revenue: 28.35 }
  ]
};

export default function ServiceAnalyticsPage() {
  const params = useParams();
  const serviceId = params.id as string;
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // In production, fetch analytics data based on serviceId and timeRange
  const analytics = mockAnalytics;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <nav className="mb-6">
              <Link href="/dashboard" className="text-blue-600 hover:underline font-mono">
                ← BACK TO DASHBOARD
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link href={`/dashboard/services/${serviceId}`} className="text-blue-600 hover:underline font-mono">
                SERVICE MANAGEMENT
              </Link>
            </nav>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-4xl font-bold font-mono tracking-wider mb-2">
                  {analytics.serviceName} - ANALYTICS
                </h1>
                <p className="font-mono text-gray-600">
                  Detailed performance metrics and usage analytics
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="retro-input"
                >
                  <option value="7d">LAST 7 DAYS</option>
                  <option value="30d">LAST 30 DAYS</option>
                  <option value="90d">LAST 90 DAYS</option>
                  <option value="1y">LAST YEAR</option>
                </select>
                <Link
                  href={`/dashboard/services/${serviceId}`}
                  className="retro-button bg-gray-100"
                >
                  BACK TO SERVICE
                </Link>
              </div>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {analytics.metrics.totalCalls.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL CALLS
              </div>
              <div className="text-xs text-green-600 font-mono mt-1">
                +12.5% from last period
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                ${analytics.metrics.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                TOTAL REVENUE
              </div>
              <div className="text-xs text-green-600 font-mono mt-1">
                +8.3% from last period
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {analytics.metrics.avgResponseTime}ms
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                AVG RESPONSE TIME
              </div>
              <div className="text-xs text-red-600 font-mono mt-1">
                +2.1% from last period
              </div>
            </div>
            
            <div className="retro-card text-center">
              <div className="text-3xl font-bold font-mono mb-2">
                {analytics.metrics.uptime}%
              </div>
              <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                UPTIME
              </div>
              <div className="text-xs text-green-600 font-mono mt-1">
                +0.2% from last period
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b-2 border-black mb-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'OVERVIEW' },
                { id: 'performance', label: 'PERFORMANCE' },
                { id: 'usage', label: 'USAGE PATTERNS' },
                { id: 'users', label: 'USER ANALYTICS' }
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
              {/* Calls Over Time Chart */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  API CALLS OVER TIME
                </h3>
                <div className="h-80 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-20 w-20 bg-blue-200 mx-auto mb-4 rounded animate-bounce"></div>
                    <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-500">Daily API call volume trends</p>
                    <div className="mt-4 text-xs text-gray-400">
                      {analytics.callsOverTime.length} data points available
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoint Performance */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  ENDPOINT PERFORMANCE
                </h3>
                <div className="space-y-4">
                  {analytics.callsByEndpoint.map((endpoint, index) => (
                    <div key={index} className="border-2 border-black p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">ENDPOINT</div>
                          <div className="font-mono text-sm">{endpoint.endpoint}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">CALLS</div>
                          <div className="font-mono text-sm">{endpoint.calls.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">REVENUE</div>
                          <div className="font-mono text-sm">${endpoint.revenue.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">AVG TIME</div>
                          <div className="font-mono text-sm">{endpoint.avgTime}ms</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(endpoint.calls / analytics.metrics.totalCalls) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-8">
              {/* Response Time Distribution */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  RESPONSE TIME DISTRIBUTION
                </h3>
                <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-purple-200 mx-auto mb-4 rounded animate-spin"></div>
                    <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-500">Response time histogram and percentiles</p>
                  </div>
                </div>
              </div>

              {/* Error Rate Trends */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  ERROR RATE TRENDS
                </h3>
                <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-red-200 mx-auto mb-4 rounded animate-pulse"></div>
                    <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-500">Error rate over time and by endpoint</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="retro-card">
                  <h4 className="font-mono font-bold mb-4">UPTIME METRICS</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Current Uptime</span>
                      <span className="font-mono font-bold">{analytics.metrics.uptime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Last 24h</span>
                      <span className="font-mono font-bold">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Last 7d</span>
                      <span className="font-mono font-bold">99.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Last 30d</span>
                      <span className="font-mono font-bold">{analytics.metrics.uptime}%</span>
                    </div>
                  </div>
                </div>

                <div className="retro-card">
                  <h4 className="font-mono font-bold mb-4">RESPONSE TIME METRICS</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">Average</span>
                      <span className="font-mono font-bold">{analytics.metrics.avgResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">P50 (Median)</span>
                      <span className="font-mono font-bold">43ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">P95</span>
                      <span className="font-mono font-bold">89ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">P99</span>
                      <span className="font-mono font-bold">156ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-8">
              {/* Usage Heatmap */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  USAGE HEATMAP
                </h3>
                <div className="h-80 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-20 w-20 bg-green-200 mx-auto mb-4 rounded animate-pulse"></div>
                    <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-500">Hourly and daily usage patterns</p>
                  </div>
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  GEOGRAPHIC DISTRIBUTION
                </h3>
                <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-blue-200 mx-auto mb-4 rounded animate-bounce"></div>
                    <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-500">API usage by geographic region</p>
                  </div>
                </div>
              </div>

              {/* Usage Patterns */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  USAGE PATTERNS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border-2 border-black">
                    <div className="text-2xl font-bold font-mono mb-2">Peak: 2-4 PM UTC</div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      BUSIEST HOURS
                    </div>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <div className="text-2xl font-bold font-mono mb-2">Tuesday</div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      BUSIEST DAY
                    </div>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <div className="text-2xl font-bold font-mono mb-2">Mobile: 68%</div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      DEVICE BREAKDOWN
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              {/* Top Users */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  TOP USERS
                </h3>
                <div className="space-y-4">
                  {analytics.topUsers.map((user, index) => (
                    <div key={index} className="border-2 border-black p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">RANK</div>
                          <div className="font-mono text-sm">#{index + 1}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">WALLET ADDRESS</div>
                          <div className="font-mono text-sm break-all">{user.address}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">TOTAL CALLS</div>
                          <div className="font-mono text-sm">{user.calls.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm mb-1">REVENUE GENERATED</div>
                          <div className="font-mono text-sm">${user.revenue.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(user.calls / analytics.metrics.totalCalls) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Growth */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  USER GROWTH
                </h3>
                <div className="h-64 bg-gray-50 border-2 border-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-orange-200 mx-auto mb-4 rounded animate-ping"></div>
                    <p className="font-mono text-gray-600">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-500">New user acquisition over time</p>
                  </div>
                </div>
              </div>

              {/* User Engagement */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  USER ENGAGEMENT METRICS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border-2 border-black">
                    <div className="text-2xl font-bold font-mono mb-2">{analytics.metrics.uniqueUsers}</div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      UNIQUE USERS
                    </div>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <div className="text-2xl font-bold font-mono mb-2">12.4</div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      AVG CALLS PER USER
                    </div>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <div className="text-2xl font-bold font-mono mb-2">78%</div>
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                      RETENTION RATE
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
