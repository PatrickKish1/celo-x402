export const mockAnalytics = {
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