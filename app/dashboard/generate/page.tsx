/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';
import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { generateMiddleware, type Language, type MiddlewareType } from '@/lib/middleware-templates';
import { userServiceManager } from '@/lib/user-services';
import Link from 'next/link';
import { ArrowLeftIcon, CopyIcon, DownloadIcon, AlertCircle, XIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GenerateMiddlewarePage() {
  const { address, isConnected } = useAppKitAccount();
  const [language, setLanguage] = useState<Language>('node');
  const [type, setType] = useState<MiddlewareType>('middleware');
  const [config, setConfig] = useState({
    price: '0.01',
    currency: 'USDC',
    network: 'base',
    payTo: address || '',
    excludedPaths: '/health,/metrics',
    excludedMethods: 'OPTIONS',
    timeout: '30',
  });
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  const handleGenerate = () => {
    if (!isConnected || !address) {
      setAlertMessage({ type: 'error', message: 'Please connect your wallet first' });
      return;
    }

    try {
      const middlewareConfig = {
        price: config.price,
        currency: config.currency,
        network: config.network,
        payTo: config.payTo || address,
        excludedPaths: config.excludedPaths.split(',').map(p => p.trim()).filter(Boolean),
        excludedMethods: config.excludedMethods.split(',').map(m => m.trim()).filter(Boolean),
        timeout: parseInt(config.timeout) * 1000,
      };

      const code = generateMiddleware(language, type, middlewareConfig);
      setGeneratedCode(code);
      setAlertMessage({ type: 'success', message: 'Code generated successfully!' });
    } catch (error) {
      console.error('Error generating code:', error);
      setAlertMessage({ type: 'error', message: 'Error generating code. Please check your configuration.' });
    }
  };

  const handleCopy = (content: string, fileName: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!generatedCode) return;

    generatedCode.files.forEach((file: any) => {
      handleDownload(file.name, file.content);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <nav className="mb-8">
            <Link href="/dashboard" className="text-blue-600 hover:underline font-mono flex items-center gap-2">
              <ArrowLeftIcon className="w-4 h-4" /> BACK TO DASHBOARD
            </Link>
          </nav>

          {/* Alert Message */}
          {alertMessage && (
            <Alert 
              className={`mb-6 ${
                alertMessage.type === 'error' ? 'bg-red-50 border-red-200' : 
                alertMessage.type === 'success' ? 'bg-green-50 border-green-200' : 
                'bg-blue-50 border-blue-200'
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${
                alertMessage.type === 'error' ? 'text-red-600' : 
                alertMessage.type === 'success' ? 'text-green-600' : 
                'text-blue-600'
              }`} />
              <AlertDescription className={`flex items-center justify-between ${
                alertMessage.type === 'error' ? 'text-red-800' : 
                alertMessage.type === 'success' ? 'text-green-800' : 
                'text-blue-800'
              }`}>
                <span className="font-mono">{alertMessage.message}</span>
                <button
                  onClick={() => setAlertMessage(null)}
                  className="ml-4 p-1 hover:bg-white/50 rounded"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-2">
              GENERATE X402 MIDDLEWARE
            </h1>
            <p className="text-gray-700 font-mono">
              Generate middleware or proxy code to convert your API to x402
            </p>
          </div>

          {!isConnected && (
            <div className="retro-card bg-yellow-100 border-yellow-500 mb-8">
              <p className="font-mono text-yellow-800">
                Please connect your wallet to generate middleware code
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <div className="retro-card">
                <h2 className="text-xl font-bold font-mono mb-4 tracking-wide">
                  CONFIGURATION
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      LANGUAGE
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="retro-input w-full"
                    >
                      <option value="node">Node.js (JavaScript/TypeScript)</option>
                      <option value="python">Python (Flask/FastAPI)</option>
                      <option value="java">Java (Spring Boot)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      TYPE
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as MiddlewareType)}
                      className="retro-input w-full"
                    >
                      <option value="middleware">Middleware (Add to existing API)</option>
                      <option value="proxy">Proxy (Standalone gateway)</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      {type === 'middleware' 
                        ? 'Add x402 protection to your existing API'
                        : 'Standalone proxy that wraps your API'}
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      PRICE PER REQUEST
                    </label>
                    <input
                      type="text"
                      value={config.price}
                      onChange={(e) => setConfig({ ...config, price: e.target.value })}
                      placeholder="0.01"
                      className="retro-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      CURRENCY
                    </label>
                    <select
                      value={config.currency}
                      onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                      className="retro-input w-full"
                    >
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      NETWORK <span className="text-xs text-gray-500 ml-2">(Popular: Base & Solana)</span>
                    </label>
                    <select
                      value={config.network}
                      onChange={(e) => setConfig({ ...config, network: e.target.value })}
                      className="retro-input w-full"
                    >
                      <optgroup label="Most Popular">
                        <option value="base">Base (Recommended)</option>
                        <option value="solana">Solana (Coming Soon)</option>
                      </optgroup>
                      <optgroup label="EVM Chains">
                        <option value="ethereum">Ethereum</option>
                        <option value="optimism">Optimism</option>
                        <option value="arbitrum">Arbitrum</option>
                        <option value="polygon">Polygon</option>
                      </optgroup>
                      <optgroup label="Testnets">
                        <option value="base-sepolia">Base Sepolia</option>
                        <option value="sepolia">Sepolia</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      PAY TO ADDRESS
                    </label>
                    <input
                      type="text"
                      value={config.payTo}
                      onChange={(e) => setConfig({ ...config, payTo: e.target.value })}
                      placeholder={address || "0x..."}
                      className="retro-input w-full font-mono text-sm"
                    />
                    {address && (
                      <button
                        onClick={() => setConfig({ ...config, payTo: address })}
                        className="text-xs text-blue-600 hover:underline font-mono mt-1"
                      >
                        Use connected wallet address
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      EXCLUDED PATHS (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={config.excludedPaths}
                      onChange={(e) => setConfig({ ...config, excludedPaths: e.target.value })}
                      placeholder="/health,/metrics"
                      className="retro-input w-full font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-sm mb-2">
                      EXCLUDED METHODS (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={config.excludedMethods}
                      onChange={(e) => setConfig({ ...config, excludedMethods: e.target.value })}
                      placeholder="OPTIONS"
                      className="retro-input w-full font-mono text-sm"
                    />
                  </div>

                  {type === 'proxy' && (
                    <div>
                      <label className="block font-mono font-bold text-sm mb-2">
                        TIMEOUT (seconds)
                      </label>
                      <input
                        type="number"
                        value={config.timeout}
                        onChange={(e) => setConfig({ ...config, timeout: e.target.value })}
                        className="retro-input w-full"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={!isConnected}
                    className="retro-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    GENERATE CODE
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Code Panel */}
            <div className="space-y-6">
              {generatedCode ? (
                <>
                  <div className="retro-card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold font-mono tracking-wide">
                        GENERATED CODE
                      </h2>
                      <button
                        onClick={handleDownloadAll}
                        className="retro-button text-sm px-3 py-1"
                      >
                        <DownloadIcon className="w-4 h-4 inline mr-1" />
                        DOWNLOAD ALL
                      </button>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 border-2 border-gray-300">
                      <h3 className="font-mono font-bold text-sm mb-2">INSTRUCTIONS</h3>
                      <p className="text-sm font-mono text-gray-700 whitespace-pre-line">
                        {generatedCode.instructions}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {generatedCode.files.map((file: any, index: number) => (
                        <div key={index} className="border-2 border-black">
                          <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b-2 border-black">
                            <div>
                              <div className="font-mono font-bold text-sm">{file.name}</div>
                              <div className="font-mono text-xs text-gray-600">{file.description}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCopy(file.content, file.name)}
                                className="retro-button text-xs px-2 py-1"
                                title="Copy to clipboard"
                              >
                                {copiedFile === file.name ? '✓' : <CopyIcon className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => handleDownload(file.name, file.content)}
                                className="retro-button text-xs px-2 py-1"
                                title="Download file"
                              >
                                <DownloadIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <pre className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                            <code>{file.content}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="retro-card text-center py-12">
                  <div className="h-16 w-16 bg-gray-200 mx-auto mb-4"></div>
                  <p className="font-mono text-gray-600">
                    {`Configure settings and click "GENERATE CODE" to see the middleware`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

