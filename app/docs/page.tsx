'use client';

import Link from 'next/link';
import { Header } from '@/components/ui/header';
import { useState } from 'react';
import { documentationSections } from '@/lib/data/docs';



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
      
    </div>
  );
}
