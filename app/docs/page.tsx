'use client';

import Link from 'next/link';
import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';
import { useState } from 'react';

const documentationSections = [
  {
    id: 'getting-started',
    title: 'GETTING STARTED',
    content: [
      {
        subtitle: 'What is x402?',
        text: 'x402 is an open payment protocol that lets you monetize APIs with micropayments. Accept USDC payments for API access without building payment infrastructure. Your users pay per request, you get paid instantly.',
        code: null
      },
      {
        subtitle: 'Why use x402?',
        text: ' 0% platform fees - Keep 100% of your earnings (competitors charge 3-10%). No subscription management. No payment processor integration. No user accounts to manage. Just connect your API and start earning. Users pay only for what they use, with instant stablecoin settlements.',
        code: `Comparison:
x402:          0% fee → You keep $100 from $100
g402:          3% fee → You keep $97 from $100
Others:     5-10% fee → You keep $90-95 from $100

More transparent. More profitable. More fair.`
      },
      {
        subtitle: 'Quick start',
        text: '1) Connect your wallet 2) Register your API URL 3) Set your price (e.g., 0.05 USDC per call) 4) Get your gateway URL 5) Share it and start earning. That\'s it - no code changes needed.',
        code: null
      },
      {
        subtitle: 'Supported networks',
        text: 'Base (Recommended for low fees) • Solana (Coming Soon) • Ethereum • Optimism • Arbitrum • Polygon. We accept USDC on all networks. Users can pay from any supported chain using cross-chain swaps.',
        code: null
      }
    ]
  },
  {
    id: 'api-integration',
    title: 'MONETIZE YOUR API',
    content: [
      {
        subtitle: 'How to get started',
        text: 'Connect your wallet on the dashboard, click "Create API", enter your API URL and set your price. We generate a gateway URL for you. Share that URL with users - all payments are handled automatically.',
        code: `Example:
Your API: https://api.yoursite.com/weather
Your Price: 0.05 USDC per call

We give you: https://gateway.x402.io/you/weather-api
Share this URL with your users!`
      },
      {
        subtitle: 'How users pay',
        text: 'Users visit your gateway URL. For GET requests in a browser, they see a payment page. For API calls (POST/PUT/DELETE), they get a 402 response with payment instructions. After paying, they can access your API.',
        code: `// User makes request
GET https://gateway.x402.io/you/weather-api/current

// Without payment → User sees payment page
// After payment → Request forwarded to your API
// Your API response → Returned to user`
      },
      {
        subtitle: 'Your revenue - 100% yours!',
        text: '🎉 You keep 100% of every payment. No platform fees. No hidden charges. We charge 0% compared to competitors who take 3-10%. Payments settle instantly in USDC directly to your wallet.',
        code: `You set: 0.05 USDC per call
You earn: 0.05 USDC per call (100%) 
Platform: 0.00 USDC per call (0%)

No fees. No middleman. All yours!`
      },
      {
        subtitle: 'Cross-chain payments',
        text: 'Users can pay from any blockchain. If they have ETH on Optimism but your API accepts USDC on Base, we handle the swap automatically. You just get paid in USDC.',
        code: null
      }
    ]
  },
  {
    id: 'client-usage',
    title: 'USING PAID APIs',
    content: [
      {
        subtitle: 'Discover APIs',
        text: 'Browse the marketplace to find APIs. Filter by category, price, or functionality. Each API shows pricing, documentation, and a test interface. Try before you buy!',
        code: null
      },
      {
        subtitle: 'Pay and access',
        text: 'Connect your wallet (MetaMask, Coinbase Wallet, etc). When you access a paid API, you\'ll see the payment page showing the price. Click pay, approve in your wallet, and instantly access the API.',
        code: `Example:
1. Visit: https://gateway.x402.io/bob/weather-api
2. See: "0.05 USDC per call"
3. Click: "Connect Wallet & Pay"
4. Access granted!`
      },
      {
        subtitle: 'Pay from any chain',
        text: 'Have ETH on Ethereum but API wants USDC on Base? No problem. We automatically swap your tokens across chains. You pay in whatever you have, API gets what they want.',
        code: null
      },
      {
        subtitle: 'For developers (programmatic access)',
        text: 'Use x402 client libraries to integrate paid APIs into your app. Libraries handle payments automatically so your users never leave your application.',
        code: `import { x402Fetch } from "@x402/client";

// Automatically handles payment
const data = await x402Fetch(
  "https://gateway.x402.io/bob/weather-api/current",
  { wallet: userWallet }
);`
      }
    ]
  },
  {
    id: 'platform-features',
    title: 'FEATURES & BENEFITS',
    content: [
      {
        subtitle: 'Dashboard & analytics',
        text: 'Track your revenue, API usage, and performance in real-time. See which endpoints are most popular, who your top users are, and how much you\'re earning. Export data for accounting.',
        code: null
      },
      {
        subtitle: 'Marketplace discovery',
        text: 'List your API in the x402 Bazaar where thousands of developers discover new APIs. Add descriptions, tags, and pricing to attract users. Test interfaces help users try before they buy.',
        code: null
      },
      {
        subtitle: 'Flexible pricing',
        text: 'Set different prices for different endpoints. Charge 0.01 USDC for simple queries, 0.50 USDC for complex operations. Update pricing anytime without code changes.',
        code: `Example pricing:
GET /weather/current → 0.01 USDC
GET /weather/forecast → 0.05 USDC  
POST /weather/alerts → 0.10 USDC`
      },
      {
        subtitle: 'Multi-chain support',
        text: 'Accept payments on Base for low fees, or offer Ethereum for users who prefer it. We support 6+ blockchains. Users can pay from any chain via automatic cross-chain swaps.',
        code: null
      },
      {
        subtitle: 'No infrastructure needed',
        text: 'We handle payment processing, security, cross-chain swaps, and gateway infrastructure. You just focus on building great APIs. We handle everything else.',
        code: null
      }
    ]
  },
  {
    id: 'faq',
    title: 'FREQUENTLY ASKED QUESTIONS',
    content: [
      {
        subtitle: 'Do I need to modify my API code?',
        text: 'No! Your API stays exactly as it is. You just register your API URL with us, and we provide a gateway URL that handles payments. No code changes required.',
        code: null
      },
      {
        subtitle: 'What if a user refuses to pay?',
        text: 'They can\'t access your API without paying. The gateway blocks all unpaid requests. Your API only receives paid, verified requests.',
        code: null
      },
      {
        subtitle: 'How do I get paid?',
        text: 'Instantly! Every payment settles in USDC to your wallet immediately. No waiting for payouts, no minimum balance. You get paid as you earn.',
        code: null
      },
      {
        subtitle: 'What about API keys and rate limiting?',
        text: 'Payment becomes your authentication. Each paid request is rate-limited by cost. Spam attacks are too expensive to sustain. You can also add custom headers if needed.',
        code: null
      },
      {
        subtitle: 'Can I use this for free/public endpoints?',
        text: 'Yes! Set the price to 0.00 USDC for free endpoints. The gateway still works, providing analytics and discovery without charging users.',
        code: null
      },
      {
        subtitle: 'What about refunds?',
        text: 'All payments are final. Make sure to test your API thoroughly before listing. We provide a test interface for users to try endpoints before paying.',
        code: null
      }
    ]
  }
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold font-mono tracking-wider mb-6">
              DOCUMENTATION
            </h1>
            <p className="text-xl font-mono text-gray-700 max-w-3xl mx-auto">
              Comprehensive guide to using the x402 platform. Learn how to integrate, manage, and monetize your APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="retro-card sticky top-8">
                <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-4">
                  CONTENTS
                </h3>
                <nav className="space-y-2">
                  {documentationSections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`block w-full text-left px-3 py-2 text-sm font-mono transition-colors ${
                        activeSection === section.id
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {documentationSections.map(section => (
                <div
                  key={section.id}
                  className={`${activeSection === section.id ? 'block' : 'hidden'}`}
                >
                  <div className="retro-card mb-8">
                    <h2 className="text-3xl font-bold font-mono tracking-wider mb-6">
                      {section.title}
                    </h2>
                    
                    <div className="space-y-8">
                      {section.content.map((item, index) => (
                        <div key={index}>
                          <h3 className="text-xl font-bold font-mono mb-3 tracking-wide">
                            {item.subtitle}
                          </h3>
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {item.text}
                          </p>
                          {item.code && (
                            <div className="bg-gray-100 border-2 border-black p-4 font-mono text-sm overflow-x-auto">
                              <pre className="whitespace-pre-wrap">{item.code}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick Links */}
              <div className="retro-card">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  QUICK LINKS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-mono font-bold mb-2">FOR SELLERS</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a href="/dashboard" className="text-blue-600 hover:underline font-mono">
                          • Create your first API service
                        </a>
                      </li>
                      <li>
                        <a href="https://github.com/coinbase/x402" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">
                          • x402 protocol specification
                        </a>
                      </li>
                      <li>
                        <a href="https://onchainkit.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">
                          • OnchainKit documentation
                        </a>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-mono font-bold mb-2">FOR BUYERS</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link href="/discover" className="text-blue-600 hover:underline font-mono">
                          • Browse available APIs
                        </Link>
                      </li>
                      <li>
                        <a href="https://github.com/coinbase/x402/tree/main/packages/typescript" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">
                          • Client libraries
                        </a>
                      </li>
                      <li>
                        <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">
                          • Base network information
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Support Section */}
              <div className="retro-card mt-8">
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  NEED HELP?
                </h3>
                <p className="text-gray-700 mb-4">
                  If you need assistance with the platform or have questions about x402 integration, we&apos;re here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://discord.com/invite/cdp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-button text-center"
                  >
                    JOIN DISCORD
                  </a>
                  <a
                    href="https://github.com/coinbase/x402"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-button bg-gray-100 text-center"
                  >
                    GITHUB REPO
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
