'use client';

import { Header } from '../components/ui/header';
import { Footer } from '../components/ui/footer';
import { Hero3D } from '../components/ui/hero-3d';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section with 3D Background */}
        <section className="relative py-20 px-4 overflow-hidden">
          <Hero3D />
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-bold font-mono tracking-wider mb-8">
                X402
                <br />
                MANAGER
              </h1>
              <p className="text-xl md:text-2xl font-mono text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                Professional platform for managing and discovering x402 APIs. 
                Seamless integration with comprehensive analytics and zero-code deployment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="retro-button text-lg px-8 py-4">
                  GET STARTED
                </Link>
                <Link href="/discover" className="retro-button text-black text-lg px-8 py-4 bg-gray-100">
                  EXPLORE APIS
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold font-mono text-center mb-16 tracking-wider">
              PLATFORM FEATURES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="retro-card text-center">
                <div className="h-16 w-16 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-full h-full text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  API DISCOVERY
                </h3>
                <p className="font-mono text-gray-700 leading-relaxed">
                  Browse and discover available x402 APIs with detailed documentation, pricing, and usage examples.
                </p>
              </div>
              
              <div className="retro-card text-center">
                <div className="h-16 w-16 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-full h-full text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  ZERO-CODE DEPLOYMENT
                </h3>
                <p className="font-mono text-gray-700 leading-relaxed">
                  Transform existing APIs into x402-compatible services without modifying your codebase.
                </p>
              </div>
              
              <div className="retro-card text-center">
                <div className="h-16 w-16 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-full h-full text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  COMPREHENSIVE ANALYTICS
                </h3>
                <p className="font-mono text-gray-700 leading-relaxed">
                  Monitor usage, revenue, and performance with detailed analytics and reporting tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold font-mono text-center mb-16 tracking-wider">
              HOW IT WORKS
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div className="retro-border bg-black text-white font-mono font-bold text-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-mono mb-2 tracking-wide">
                      REGISTER YOUR API
                    </h3>
                    <p className="font-mono text-gray-700 leading-relaxed">
                      Add your existing API endpoint and configure pricing. No code changes required.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6">
                  <div className="retro-border bg-black text-white font-mono font-bold text-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-mono mb-2 tracking-wide">
                      AUTOMATIC X402 INTEGRATION
                    </h3>
                    <p className="font-mono text-gray-700 leading-relaxed">
                      Our platform automatically handles payment challenges and verification via the x402 protocol.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6">
                  <div className="retro-border bg-black text-white font-mono font-bold text-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-mono mb-2 tracking-wide">
                      MONITOR AND SCALE
                    </h3>
                    <p className="font-mono text-gray-700 leading-relaxed">
                      Track usage, revenue, and performance. Scale your API business with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-black text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold font-mono mb-8 tracking-wider">
              READY TO MONETIZE YOUR API?
            </h2>
            <p className="text-xl font-mono text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the future of programmatic payments. Start accepting x402 payments in minutes, not days.
            </p>
            <Link href="/dashboard" className="retro-button bg-white text-black text-lg px-8 py-4">
              START BUILDING
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
