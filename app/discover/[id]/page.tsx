'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { X402Service, x402Service } from '@/lib/x402-service';
import { DocumentationModal } from '@/components/documentation-modal';
import { IntegrationModal } from '@/components/integration-modal';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';



export default function ServiceDetailsPage() {
  const params = useParams();
  const serviceId = decodeURIComponent(params.id as string);
  const [service, setService] = useState<X402Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);

  useEffect(() => {
    async function fetchServiceDetails() {
      try {
        setLoading(true);
        const serviceData = await x402Service.getServiceDetails(serviceId);
        if (serviceData) {
          setService(serviceData);
        } else {
          setError('Service not found');
        }
      } catch (err) {
        setError('Failed to fetch service details');
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false);
      }
    }

    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <div className="h-16 w-16 bg-gray-200 mx-auto mb-4 animate-pulse"></div>
            <h2 className="text-xl font-bold font-mono mb-2">LOADING SERVICE DETAILS</h2>
            <p className="text-gray-600 font-mono">Fetching live data from x402 Bazaar...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto text-center">
            <div className="h-16 w-16 bg-red-200 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold font-mono mb-2 text-red-600">ERROR LOADING SERVICE</h2>
            <p className="text-gray-600 font-mono mb-6">{error || 'Service not found'}</p>
            <Link href="/discover" className="retro-button">
              BACK TO DISCOVERY
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tags = x402Service.getServiceTags(service);
  const primaryPayment = service?.accepts?.[0];
  const price = x402Service.formatUSDCAmount(primaryPayment?.maxAmountRequired || '0');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/discover" className="text-blue-600 hover:underline font-mono text-nowrap">
              <ArrowLeftIcon className="w-4 h-4" /> BACK TO DISCOVERY
            </Link>
          </nav>

          {/* Service Header */}
          <div className="retro-card mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
                  {service?.metadata?.name || service?.metadata?.title || service?.resource?.split('/').pop() || 'X402 Service'}
                </h1>
                <p className="text-xl font-mono text-gray-700 mb-4">
                  {service?.accepts?.[0]?.description || service?.metadata?.description || 'Professional x402 API service with instant payment integration.'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-sm font-mono border border-gray-300"
                    >
                      {tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-right mt-4 md:mt-0">
                <div className="text-3xl font-bold font-mono mb-2">
                  {price} USDC
                </div>
                <div className="text-sm text-gray-600 font-mono">
                  per request
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  Max: {x402Service.formatUSDCAmount(primaryPayment.maxAmountRequired)} USDC
                </div>
              </div>
            </div>

            {/* Service Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-t-2 border-black pt-6">
              <div>
                <div className="font-mono font-bold">RESOURCE TYPE</div>
                <div className="text-gray-600">{service.type.toUpperCase()}</div>
              </div>
              <div>
                <div className="font-mono font-bold">X402 VERSION</div>
                <div className="text-gray-600">{service.x402Version}</div>
              </div>
              <div>
                <div className="font-mono font-bold">NETWORK</div>
                <div className="text-gray-600">{primaryPayment.network.toUpperCase()}</div>
              </div>
              <div>
                <div className="font-mono font-bold">LAST UPDATED</div>
                <div className="text-gray-600">
                  {new Date(service.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="retro-card mb-8">
            <h2 className="text-2xl font-bold font-mono mb-4 tracking-wide">
              PAYMENT REQUIREMENTS
            </h2>
            <div className="space-y-4">
              {service?.accepts?.map((payment, index) => (
                <div key={index} className="border-2 border-black p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-mono font-bold mb-2">PAYMENT ASSET</div>
                      <div className="text-gray-600 font-mono">
                        {payment?.extra?.name || 'Unknown'} ({payment?.asset?.slice(0, 6) || ''}...{payment?.asset?.slice(-4) || ''})
                      </div>
                    </div>
                    <div>
                      <div className="font-mono font-bold mb-2">AMOUNT REQUIRED</div>
                      <div className="text-gray-600 font-mono">
                        {x402Service.formatUSDCAmount(payment.maxAmountRequired)} USDC
                      </div>
                    </div>
                    <div>
                      <div className="font-mono font-bold mb-2">PAYMENT SCHEME</div>
                      <div className="text-gray-600 font-mono">
                        {payment.scheme.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono font-bold mb-2">TIMEOUT</div>
                      <div className="text-gray-600 font-mono">
                        {payment.maxTimeoutSeconds} seconds
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="font-mono font-bold mb-2">PAY TO ADDRESS</div>
                    <div className="text-gray-600 font-mono text-sm break-all">
                      {payment.payTo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Schema */}
          <div className="retro-card mb-8">
            <h2 className="text-2xl font-bold font-mono mb-4 tracking-wide">
              API SCHEMA
            </h2>
            <div className="space-y-4">
              <div>
                <div className="font-mono font-bold mb-2">HTTP METHOD</div>
                <div className="text-gray-600 font-mono">
                  {primaryPayment?.outputSchema?.input?.method || 'N/A'}
                </div>
              </div>
              <div>
                <div className="font-mono font-bold mb-2">RESOURCE URL</div>
                <div className="text-gray-600 font-mono text-sm break-all">
                  {primaryPayment?.resource || service?.resource || 'N/A'}
                </div>
              </div>
              <div>
                <div className="font-mono font-bold mb-2">RESPONSE TYPE</div>
                <div className="text-gray-600 font-mono">
                  {primaryPayment.mimeType || 'application/json'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link 
              href={`/discover/${serviceId}/test`}
              className="retro-button flex-1 text-center"
            >
              TEST API
            </Link>
            <button 
              onClick={() => setShowDocumentation(true)}
              className="retro-button flex-1 bg-gray-100"
            >
              VIEW DOCUMENTATION
            </button>
            <button 
              onClick={() => setShowIntegration(true)}
              className="retro-button flex-1 bg-gray-100"
            >
              INTEGRATE
            </button>
          </div>

          {/* Modals */}
          {service && (
            <>
              <DocumentationModal
                isOpen={showDocumentation}
                onClose={() => setShowDocumentation(false)}
                service={service}
              />
              <IntegrationModal
                isOpen={showIntegration}
                onClose={() => setShowIntegration(false)}
                service={service}
              />
            </>
          )}

          {/* Metadata */}
          {service?.metadata && typeof service.metadata === 'object' && Object.keys(service.metadata).length > 0 && (
            <div className="retro-card">
              <h2 className="text-2xl font-bold font-mono mb-4 tracking-wide">
                ADDITIONAL METADATA
              </h2>
              <pre className="bg-gray-100 border-2 border-black p-4 font-mono text-sm overflow-x-auto">
                {JSON.stringify(service.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
