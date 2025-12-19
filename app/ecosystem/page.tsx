/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface EcosystemItem {
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
}

const ecosystemCategories = [
  'Client-Side Integrations',
  'Services/Endpoints',
  'Infrastructure & Tooling',
  'Learning & Community Resources',
  'Facilitators',
] as const;

type EcosystemCategory = typeof ecosystemCategories[number];

// Ecosystem data - synced from x402scan or Coinbase x402 repo
const ecosystemItems: EcosystemItem[] = [
  {
    name: 'Axios & Fetch Clients',
    description: 'Reference TypeScript clients for x402 using both Axios and Fetch. Easily integrate x402 payments into your own applications.',
    logoUrl: 'https://www.x402.org/logos/axios-fetch-clients.png',
    websiteUrl: 'https://github.com/coinbase/x402/tree/main/examples/typescript/clients',
    category: 'Client-Side Integrations',
  },
  {
    name: 'AEON',
    description: 'The omnichain settlement layer that enables AI agents to seamlessly pay millions of real-world merchants across SEA, LATAM, and Africa — powered by x402 and USDC.',
    logoUrl: 'https://www.x402.org/logos/aeon.png',
    websiteUrl: 'https://aeon.xyz/AIPayment',
    category: 'Services/Endpoints',
  },
  {
    name: 'AurraCloud',
    description: 'AI agents hosting and Tooling Platform, with MCP, smartWallets, OpenAI API compatibility and X402 support.',
    logoUrl: 'https://www.x402.org/logos/aurracloud.png',
    websiteUrl: 'https://aurracloud.com/x402',
    category: 'Services/Endpoints',
  },
  {
    name: '1Shot API',
    description: 'A general purpose facilitator to monetize any n8n workflow with your favorite ERC-20 token.',
    logoUrl: 'https://www.x402.org/logos/1shot-api.png',
    websiteUrl: 'https://docs.1shotapi.com/automation/n8n.html#monetize-n8n-workflows-with-x402',
    category: 'Infrastructure & Tooling',
  },
  {
    name: '402104',
    description: 'Generate expirable, paywalled links to private ANS-104 DataItems on Arweave. Compatible with both S3 and ANS-104 data standards.',
    logoUrl: 'https://www.x402.org/logos/402104.png',
    websiteUrl: 'https://402.load.network',
    category: 'Infrastructure & Tooling',
  },
  {
    name: 'Bonsai',
    description: 'Create, remix, and trade evolving media. Use our API to generate AI content using smart media protocol (SMP) templates.',
    logoUrl: 'https://www.x402.org/logos/bonsai.png',
    websiteUrl: 'https://bonsai.xyz',
    category: 'Services/Endpoints',
  },
  {
    name: 'CDP Facilitator',
    description: 'Coinbase Developer Platform facilitator for x402 payments. The official facilitator for x402 protocol.',
    logoUrl: 'https://www.x402.org/logos/cdp.png',
    websiteUrl: 'https://portal.cdp.coinbase.com/',
    category: 'Facilitators',
  },
  // Add more items as needed
];

export default function EcosystemPage() {
  const [selectedCategory, setSelectedCategory] = useState<EcosystemCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = ecosystemItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const itemsByCategory = ecosystemCategories.reduce((acc, category) => {
    acc[category] = ecosystemItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<EcosystemCategory, EcosystemItem[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold font-mono tracking-wide mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            X402 ECOSYSTEM
          </h1>
          <p className="text-xl text-gray-700 font-mono max-w-3xl mx-auto">
            Discover tools, services, and integrations in the x402 ecosystem
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search ecosystem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="retro-input flex-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as EcosystemCategory | 'All')}
              className="retro-input"
            >
              <option value="All">All Categories</option>
              {ecosystemCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`retro-button px-4 py-2 ${
              selectedCategory === 'All' ? 'bg-black text-white' : 'bg-gray-100'
            }`}
          >
            ALL ({ecosystemItems.length})
          </button>
          {ecosystemCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`retro-button px-4 py-2 ${
                selectedCategory === category ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            >
              {category} ({itemsByCategory[category]?.length || 0})
            </button>
          ))}
        </div>

        {/* Ecosystem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <Link
              key={index}
              href={item.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="retro-card hover:transform hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="flex items-start gap-4 mb-4">
                {item.logoUrl && (
                  <div className="w-16 h-16 flex-shrink-0 bg-white rounded border-2 border-black flex items-center justify-center overflow-hidden">
                    <Image
                      src={item.logoUrl}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="object-contain"
                      onError={(e) => {
                        // Hide image on error
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold font-mono mb-2 break-words">
                    {item.name}
                  </h3>
                  <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {item.category}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {item.description}
              </p>
              <div className="text-xs font-mono text-blue-600 hover:underline">
                Visit Website →
              </div>
            </Link>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 font-mono">No items found matching your criteria.</p>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="retro-card text-center p-4">
            <div className="text-3xl font-bold font-mono text-purple-600">
              {ecosystemItems.length}
            </div>
            <div className="text-sm text-gray-600 font-mono mt-2">Total Projects</div>
          </div>
          <div className="retro-card text-center p-4">
            <div className="text-3xl font-bold font-mono text-blue-600">
              {ecosystemCategories.length}
            </div>
            <div className="text-sm text-gray-600 font-mono mt-2">Categories</div>
          </div>
          <div className="retro-card text-center p-4">
            <div className="text-3xl font-bold font-mono text-cyan-600">
              {itemsByCategory['Services/Endpoints']?.length || 0}
            </div>
            <div className="text-sm text-gray-600 font-mono mt-2">Services</div>
          </div>
          <div className="retro-card text-center p-4">
            <div className="text-3xl font-bold font-mono text-green-600">
              {itemsByCategory['Infrastructure & Tooling']?.length || 0}
            </div>
            <div className="text-sm text-gray-600 font-mono mt-2">Tools</div>
          </div>
        </div>
      </main>

    </div>
  );
}

