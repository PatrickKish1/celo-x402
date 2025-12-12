'use client';

import { X402Service } from '../lib/x402-service';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: X402Service;
}

export function DocumentationModal({
  isOpen,
  onClose,
  service,
}: DocumentationModalProps) {
  if (!isOpen) return null;

  const primaryPayment = service.accepts[0];
  const schema = primaryPayment.outputSchema.input;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="retro-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold font-mono tracking-wide">
            API DOCUMENTATION
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* API Overview */}
        <div className="mb-6">
          <h3 className="text-xl font-bold font-mono mb-2">OVERVIEW</h3>
          <p className="text-gray-700 mb-2">
            {service.metadata.description || 'Professional x402 API service with instant payment integration.'}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <span className="font-bold">Endpoint:</span> {primaryPayment.resource}
            </div>
            <div>
              <span className="font-bold">Method:</span> {schema.method}
            </div>
            <div>
              <span className="font-bold">Content-Type:</span> {schema.bodyType}
            </div>
            <div>
              <span className="font-bold">Response Type:</span> {primaryPayment.mimeType}
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="mb-6">
          <h3 className="text-xl font-bold font-mono mb-2">AUTHENTICATION</h3>
          <div className="p-4 border-2 border-black bg-gray-50">
            <p className="text-sm mb-2">
              This API uses the x402 payment protocol. Include the payment proof in the <code className="bg-gray-200 px-2 py-1">X-PAYMENT</code> header.
            </p>
            <div className="text-xs space-y-1">
              <div><span className="font-bold">Payment Asset:</span> {primaryPayment.extra.name}</div>
              <div><span className="font-bold">Amount per Request:</span> {parseInt(primaryPayment.maxAmountRequired) / 1000000} {primaryPayment.extra.name}</div>
              <div><span className="font-bold">Network:</span> {primaryPayment.network.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Request Headers */}
        {schema.headerFields && Object.keys(schema.headerFields).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold font-mono mb-2">REQUEST HEADERS</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-black text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-2 border-black p-2 text-left font-mono">NAME</th>
                    <th className="border-2 border-black p-2 text-left font-mono">TYPE</th>
                    <th className="border-2 border-black p-2 text-left font-mono">REQUIRED</th>
                    <th className="border-2 border-black p-2 text-left font-mono">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(schema.headerFields).map(([name, field]: [string, any]) => (
                    <tr key={name}>
                      <td className="border-2 border-black p-2 font-mono">{name}</td>
                      <td className="border-2 border-black p-2">{field.type}</td>
                      <td className="border-2 border-black p-2">{field.required ? 'Yes' : 'No'}</td>
                      <td className="border-2 border-black p-2">{field.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Request Body */}
        {schema.bodyFields && Object.keys(schema.bodyFields).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold font-mono mb-2">REQUEST BODY</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-black text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-2 border-black p-2 text-left font-mono">FIELD</th>
                    <th className="border-2 border-black p-2 text-left font-mono">TYPE</th>
                    <th className="border-2 border-black p-2 text-left font-mono">REQUIRED</th>
                    <th className="border-2 border-black p-2 text-left font-mono">DEFAULT</th>
                    <th className="border-2 border-black p-2 text-left font-mono">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(schema.bodyFields).map(([name, field]: [string, any]) => (
                    <tr key={name}>
                      <td className="border-2 border-black p-2 font-mono">{name}</td>
                      <td className="border-2 border-black p-2">{field.type}</td>
                      <td className="border-2 border-black p-2">{field.required ? 'Yes' : 'No'}</td>
                      <td className="border-2 border-black p-2 font-mono text-xs">{field.default || '-'}</td>
                      <td className="border-2 border-black p-2">{field.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Response Schema */}
        {primaryPayment.outputSchema.output && (
          <div className="mb-6">
            <h3 className="text-xl font-bold font-mono mb-2">RESPONSE SCHEMA</h3>
            <pre className="bg-gray-100 border-2 border-black p-4 font-mono text-xs overflow-x-auto">
              {JSON.stringify(primaryPayment.outputSchema.output, null, 2)}
            </pre>
          </div>
        )}

        {/* Example Request */}
        <div className="mb-6">
          <h3 className="text-xl font-bold font-mono mb-2">EXAMPLE REQUEST</h3>
          <pre className="bg-gray-100 border-2 border-black p-4 font-mono text-xs overflow-x-auto">
{`curl -X ${schema.method} "${primaryPayment.resource}" \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <base64_encoded_payment_proof>" \\
  ${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? `-d '${JSON.stringify(
    Object.entries(schema.bodyFields).reduce((acc, [key, field]: [string, any]) => {
      acc[key] = field.default || `<${key}>`;
      return acc;
    }, {} as Record<string, any>),
    null,
    2
  )}'` : ''}`}
          </pre>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="text-xl font-bold font-mono mb-2">PAYMENT DETAILS</h3>
          <div className="p-4 border-2 border-black bg-gray-50 text-sm space-y-2">
            <div><span className="font-bold">Scheme:</span> {primaryPayment.scheme}</div>
            <div><span className="font-bold">Pay To:</span> <code className="text-xs">{primaryPayment.payTo}</code></div>
            <div><span className="font-bold">Asset Address:</span> <code className="text-xs">{primaryPayment.asset}</code></div>
            <div><span className="font-bold">Timeout:</span> {primaryPayment.maxTimeoutSeconds} seconds</div>
            <div><span className="font-bold">Description:</span> {primaryPayment.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

