'use client';

import { Header } from '../../components/ui/header';
import { APINetwork3D } from '../../components/ui/api-network-3d';
import Link from 'next/link';

// Enhanced sample API data for realistic demonstration
const sampleAPIs = [
  {
    id: '1',
    name: 'Weather Data API',
    description: 'Real-time weather information and forecasts for global locations with historical data access',
    price: '0.05',
    category: 'weather'
  },
  {
    id: '2',
    name: 'Financial Market Data',
    description: 'Live stock prices, cryptocurrency data, and market analytics with millisecond precision',
    price: '0.10',
    category: 'finance'
  },
  {
    id: '3',
    name: 'News Aggregation Service',
    description: 'Curated news from multiple sources with sentiment analysis and trend detection',
    price: '0.08',
    category: 'news'
  },
  {
    id: '4',
    name: 'Social Media Analytics',
    description: 'Trend analysis and engagement metrics from social platforms with real-time monitoring',
    price: '0.15',
    category: 'social'
  },
  {
    id: '5',
    name: 'Data Processing Pipeline',
    description: 'ETL services for large-scale data transformation and analytics processing',
    price: '0.20',
    category: 'data'
  },
  {
    id: '6',
    name: 'Cryptocurrency Price Feed',
    description: 'Real-time crypto prices across multiple exchanges with historical data',
    price: '0.12',
    category: 'finance'
  },
  {
    id: '7',
    name: 'Geolocation Services',
    description: 'IP-based location and mapping services with reverse geocoding',
    price: '0.06',
    category: 'data'
  },
  {
    id: '8',
    name: 'Content Moderation API',
    description: 'AI-powered content filtering and moderation for user-generated content',
    price: '0.18',
    category: 'social'
  },
  {
    id: '9',
    name: 'Economic Indicators',
    description: 'GDP, inflation, and economic trend data with forecasting models',
    price: '0.14',
    category: 'finance'
  },
  {
    id: '10',
    name: 'Sports Statistics',
    description: 'Live scores, player stats, and historical data across all major sports',
    price: '0.09',
    category: 'data'
  },
  {
    id: '11',
    name: 'Language Translation',
    description: 'Multi-language translation with context awareness and cultural adaptation',
    price: '0.11',
    category: 'data'
  },
  {
    id: '12',
    name: 'E-commerce Analytics',
    description: 'Sales trends, inventory, and customer behavior analysis',
    price: '0.16',
    category: 'data'
  },
  {
    id: '13',
    name: 'Healthcare Data API',
    description: 'Medical research and health statistics with privacy compliance',
    price: '0.25',
    category: 'data'
  },
  {
    id: '14',
    name: 'Traffic Information',
    description: 'Real-time traffic data and route optimization for navigation',
    price: '0.07',
    category: 'data'
  },
  {
    id: '15',
    name: 'Energy Consumption',
    description: 'Power usage analytics and efficiency metrics for smart grids',
    price: '0.13',
    category: 'data'
  },
  {
    id: '16',
    name: 'Real Estate Data',
    description: 'Property valuations, market trends, and investment analytics',
    price: '0.22',
    category: 'finance'
  },
  {
    id: '17',
    name: 'Supply Chain Tracking',
    description: 'End-to-end supply chain visibility and logistics optimization',
    price: '0.19',
    category: 'data'
  },
  {
    id: '18',
    name: 'Cybersecurity Threat Intel',
    description: 'Real-time threat intelligence and security analytics',
    price: '0.28',
    category: 'data'
  },
  {
    id: '19',
    name: 'Environmental Monitoring',
    description: 'Air quality, pollution levels, and environmental impact data',
    price: '0.08',
    category: 'weather'
  },
  {
    id: '20',
    name: 'Digital Marketing Analytics',
    description: 'Campaign performance, ROI tracking, and audience insights',
    price: '0.17',
    category: 'social'
  }
];

export default function NetworkDemoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow">
        {/* Page Header */}
        <section className="py-8 px-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-black">
          <div className="container mx-auto">
            <nav className="mb-4">
              <Link href="/discover" className="text-blue-600 hover:underline font-mono">
                ← BACK TO DISCOVERY
              </Link>
            </nav>
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
              3D API NETWORK VISUALIZATION
            </h1>
            <p className="text-xl font-mono text-gray-700 max-w-4xl">
              Immersive exploration of the x402 API ecosystem. Each node represents an API service, 
              connected by their relationships and categories. Experience the future of API discovery.
            </p>
          </div>
        </section>

        {/* 3D Network Visualization */}
        <section className="h-[80vh] relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <APINetwork3D apis={sampleAPIs} />
        </section>

        {/* Enhanced Information Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Category Legend */}
              <div className="retro-card">
                <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                  API CATEGORIES
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-mono font-bold">Finance & Markets</div>
                      <div className="text-sm text-gray-600">Financial data, crypto, analytics</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-mono font-bold">Weather & Environment</div>
                      <div className="text-sm text-gray-600">Climate data, forecasts, monitoring</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-mono font-bold">News & Media</div>
                      <div className="text-sm text-gray-600">Content aggregation, sentiment analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <div>
                      <div className="font-mono font-bold">Data & Analytics</div>
                      <div className="text-sm text-gray-600">Processing, ETL, business intelligence</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="font-mono font-bold">Social & Communication</div>
                      <div className="text-sm text-gray-600">Social media, engagement, trends</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interaction Guide */}
              <div className="retro-card">
                <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                  INTERACTION GUIDE
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-mono font-bold">DRAG TO ROTATE</div>
                      <div className="text-sm text-gray-600">Click and drag to rotate the 3D network sphere</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <div className="font-mono font-bold">SCROLL TO ZOOM</div>
                      <div className="text-sm text-gray-600">Use mouse wheel to zoom in and out</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <div className="font-mono font-bold">HOVER FOR INFO</div>
                      <div className="text-sm text-gray-600">Hover over nodes to see API details</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <div className="font-mono font-bold">CLICK FOR DETAILS</div>
                      <div className="text-sm text-gray-600">Click nodes to see full information</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Features */}
              <div className="retro-card">
                <h2 className="text-2xl font-bold font-mono mb-6 tracking-wide">
                  NETWORK FEATURES
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      🔗
                    </div>
                    <div>
                      <div className="font-mono font-bold">Dynamic Connections</div>
                      <div className="text-sm text-gray-600">Smart linking based on proximity</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      🎯
                    </div>
                    <div>
                      <div className="font-mono font-bold">Real-time Interaction</div>
                      <div className="text-sm text-gray-600">Immediate response to user input</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      🌐
                    </div>
                    <div>
                      <div className="font-mono font-bold">3D Perspective</div>
                      <div className="text-sm text-gray-600">True depth and spatial awareness</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      ⚡
                    </div>
                    <div>
                      <div className="font-mono font-bold">Performance Optimized</div>
                      <div className="text-sm text-gray-600">Smooth 60fps animations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Stats */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="retro-card text-center">
                <div className="text-4xl font-bold font-mono mb-2 text-green-600">{sampleAPIs.length}</div>
                <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                  TOTAL APIS
                </div>
              </div>
              <div className="retro-card text-center">
                <div className="text-4xl font-bold font-mono mb-2 text-blue-600">5</div>
                <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                  CATEGORIES
                </div>
              </div>
              <div className="retro-card text-center">
                <div className="text-4xl font-bold font-mono mb-2 text-purple-600">$2.89</div>
                <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                  TOTAL VALUE
                </div>
              </div>
              <div className="retro-card text-center">
                <div className="text-4xl font-bold font-mono mb-2 text-red-600">∞</div>
                <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                  POSSIBILITIES
                </div>
              </div>
              <div className="retro-card text-center">
                <div className="text-4xl font-bold font-mono mb-2 text-orange-600">3D</div>
                <div className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                  IMMERSIVE
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <div className="retro-card max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold font-mono mb-4 tracking-wide">
                  READY TO EXPLORE THE FUTURE?
                </h3>
                <p className="text-gray-700 mb-6 font-mono">
                  This is just the beginning. The x402 ecosystem is growing every day with new APIs, 
                  services, and opportunities for developers and businesses.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/discover"
                    className="retro-button bg-blue-100 text-blue-800"
                  >
                    EXPLORE APIS
                  </Link>
                  <Link
                    href="/dashboard"
                    className="retro-button bg-green-100 text-green-800"
                  >
                    MANAGE YOUR APIS
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
