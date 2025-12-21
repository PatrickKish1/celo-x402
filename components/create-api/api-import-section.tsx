/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef } from 'react';
import { UploadIcon, LoaderIcon } from 'lucide-react';
import { parseSwaggerOpenAPI, parsePostmanCollection, parseInsomniaCollection, fetchSwaggerFromUrl } from '@/lib/api-import-parsers';
import type { EnhancedEndpoint } from '@/lib/types/endpoint';

interface ApiImportSectionProps {
  onImport: (data: {
    name?: string;
    description?: string;
    baseUrl?: string;
    endpoints: EnhancedEndpoint[];
  }) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function ApiImportSection({ onImport, onError, onSuccess }: ApiImportSectionProps) {
  const [importType, setImportType] = useState<'swagger-url' | 'swagger-file' | 'postman' | 'insomnia' | null>(null);
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      let parsed: any;

      if (importType === 'swagger-file' || importType === 'swagger-url') {
        parsed = await parseSwaggerOpenAPI(text);
      } else if (importType === 'postman') {
        parsed = JSON.parse(text);
        parsed = parsePostmanCollection(parsed);
      } else if (importType === 'insomnia') {
        parsed = JSON.parse(text);
        parsed = parseInsomniaCollection(parsed);
      }

      const enhancedEndpoints: EnhancedEndpoint[] = parsed.endpoints.map((ep: any, index: number) => ({
        id: `ep-${Date.now()}-${index}`,
        endpoint: ep.endpoint,
        method: ep.method as any,
        description: ep.description || '',
        pricePerRequest: null,
        network: null,
        currency: null,
        tokenAddress: null,
        tokenDecimals: null,
        tokenName: null,
        tokenVersion: null,
        tokenSymbol: null,
        pathParams: ep.pathParams,
        queryParams: ep.queryParams,
        headers: ep.headers,
        requestBody: ep.requestBody,
        outputSchema: ep.outputSchema,
        expectedStatusCode: ep.expectedStatusCode || 200,
      }));

      onImport({
        name: parsed.name,
        description: parsed.description,
        baseUrl: parsed.baseUrl,
        endpoints: enhancedEndpoints,
      });

      onSuccess(`Imported ${enhancedEndpoints.length} endpoints successfully!`);
      setImportType(null);
    } catch (error) {
      console.error('Import error:', error);
      onError(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSwaggerUrlImport = async () => {
    if (!swaggerUrl.trim()) {
      onError('Please provide a Swagger URL');
      return;
    }

    setIsImporting(true);
    try {
      const parsed = await fetchSwaggerFromUrl(swaggerUrl);
      
      const enhancedEndpoints: EnhancedEndpoint[] = parsed.endpoints.map((ep: any, index: number) => ({
        id: `ep-${Date.now()}-${index}`,
        endpoint: ep.endpoint,
        method: ep.method as any,
        description: ep.description || '',
        pricePerRequest: null,
        network: null,
        currency: null,
        tokenAddress: null,
        tokenDecimals: null,
        tokenName: null,
        tokenVersion: null,
        tokenSymbol: null,
        pathParams: ep.pathParams,
        queryParams: ep.queryParams,
        headers: ep.headers,
        requestBody: ep.requestBody,
        outputSchema: ep.outputSchema,
        expectedStatusCode: ep.expectedStatusCode || 200,
      }));

      onImport({
        name: parsed.name,
        description: parsed.description,
        baseUrl: parsed.baseUrl,
        endpoints: enhancedEndpoints,
      });

      onSuccess(`Imported ${enhancedEndpoints.length} endpoints successfully!`);
      setSwaggerUrl('');
      setImportType(null);
    } catch (error) {
      console.error('Import error:', error);
      onError(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Import API Documentation</h2>
      
      {!importType ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setImportType('swagger-url')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-center"
          >
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div className="font-medium text-gray-900">Swagger URL</div>
          </button>
          <button
            onClick={() => setImportType('swagger-file')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-center"
          >
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div className="font-medium text-gray-900">Swagger File</div>
          </button>
          <button
            onClick={() => setImportType('postman')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-center"
          >
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div className="font-medium text-gray-900">Postman</div>
          </button>
          <button
            onClick={() => setImportType('insomnia')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-center"
          >
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div className="font-medium text-gray-900">Insomnia</div>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {importType === 'swagger-url' ? (
            <div className="flex gap-2">
              <input
                type="url"
                value={swaggerUrl}
                onChange={(e) => setSwaggerUrl(e.target.value)}
                placeholder="https://api.example.com/swagger.json"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleSwaggerUrlImport}
                disabled={isImporting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isImporting ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Import'}
              </button>
              <button
                onClick={() => { setImportType(null); setSwaggerUrl(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={importType === 'swagger-file' ? '.json,.yaml,.yml' : '.json'}
                onChange={handleFileImport}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => setImportType(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

