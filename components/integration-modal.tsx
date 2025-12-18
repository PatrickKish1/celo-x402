/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { X402Service } from '@/lib/x402-service';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: X402Service;
}

type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'curl' | 'go';

export function IntegrationModal({
  isOpen,
  onClose,
  service,
}: IntegrationModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('javascript');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const primaryPayment = service.accepts[0];
  const schema = primaryPayment.outputSchema.input as any;

  const generateCodeSnippet = (language: CodeLanguage): string => {
    const exampleBody = schema.bodyFields 
      ? Object.entries(schema.bodyFields).reduce((acc, [key, field]: [string, any]) => {
          acc[key] = field.default || `<${key}>`;
          return acc;
        }, {} as Record<string, any>)
      : {};

    switch (language) {
      case 'javascript':
        return `// x402 API Integration - JavaScript
const x402 = require('x402-sdk'); // or import from your SDK

async function callAPI() {
  try {
    // Initialize x402 payment
    const payment = await x402.createPayment({
      network: '${primaryPayment.network}',
      asset: '${primaryPayment.asset}',
      amount: '${primaryPayment.maxAmountRequired}',
      payTo: '${primaryPayment.payTo}'
    });

    // Make the API request with payment proof
    const response = await fetch('${primaryPayment.resource}', {
      method: '${schema.method}',
      headers: {
        'Content-Type': 'application/json',
        'X-PAYMENT': payment.proof
      },${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? `
      body: JSON.stringify(${JSON.stringify(exampleBody, null, 2).split('\n').join('\n        ')})` : ''}
    });

    const data = await response.json();
    // console.log('Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

callAPI();`;

      case 'typescript':
        return `// x402 API Integration - TypeScript
import { X402Client } from 'x402-sdk';

interface APIRequest {${Object.entries(schema.bodyFields || {}).map(([key, field]: [string, any]) => `
  ${key}${field.required ? '' : '?'}: ${field.type};`).join('')}
}

interface APIResponse {${Object.entries(primaryPayment.outputSchema.output || {}).map(([key, value]) => `
  ${key}: ${typeof value};`).join('')}
}

async function callAPI(): Promise<APIResponse> {
  const client = new X402Client({
    network: '${primaryPayment.network}',
    wallet: '<your-wallet-address>'
  });

  try {
    // Create payment
    const payment = await client.createPayment({
      asset: '${primaryPayment.asset}',
      amount: '${primaryPayment.maxAmountRequired}',
      payTo: '${primaryPayment.payTo}'
    });

    // Make the API request
    const response = await fetch('${primaryPayment.resource}', {
      method: '${schema.method}',
      headers: {
        'Content-Type': 'application/json',
        'X-PAYMENT': payment.proof
      },${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? `
      body: JSON.stringify<APIRequest>(${JSON.stringify(exampleBody, null, 2).split('\n').join('\n        ')})` : ''}
    });

    if (!response.ok) {
      throw new Error(\`API error: \${response.status} \${response.statusText}\`);
    }

    const data: APIResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling x402 API:', error);
    throw error;
  }
}

// Usage
callAPI().then(result => {
  // console.log('Success:', result);
}).catch(error => {
  console.error('Failed:', error);
});`;

      case 'python':
        return `# x402 API Integration - Python
import requests
import json
from x402_sdk import X402Client  # Assuming SDK exists

def call_api():
    """Call the x402-enabled API with payment"""
    # Initialize x402 client
    client = X402Client(
        network='${primaryPayment.network}',
        wallet='<your-wallet-address>'
    )
    
    try:
        # Create payment
        payment = client.create_payment(
            asset='${primaryPayment.asset}',
            amount='${primaryPayment.maxAmountRequired}',
            pay_to='${primaryPayment.payTo}'
        )
        
        # Prepare request
        url = '${primaryPayment.resource}'
        headers = {
            'Content-Type': 'application/json',
            'X-PAYMENT': payment['proof']
        }${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? `
        
        data = ${JSON.stringify(exampleBody, null, 4)}` : ''}
        
        # Make the request
        response = requests.${schema.method.toLowerCase()}(
            url,
            headers=headers${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? `,
            json=data` : ''}
        )
        
        response.raise_for_status()
        result = response.json()
        
        print('Response:', json.dumps(result, indent=2))
        return result
        
    except Exception as error:
        print(f'Error: {error}')
        raise

if __name__ == '__main__':
    call_api()`;

      case 'curl':
        return `# x402 API Integration - cURL
# Note: You need to generate the X-PAYMENT header using x402 SDK or wallet

# Step 1: Create payment proof (pseudo-code)
# payment_proof=$(x402-cli create-payment \\
#   --network ${primaryPayment.network} \\
#   --asset ${primaryPayment.asset} \\
#   --amount ${primaryPayment.maxAmountRequired} \\
#   --pay-to ${primaryPayment.payTo})

# Step 2: Make the API request
curl -X ${schema.method} '${primaryPayment.resource}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-PAYMENT: <base64_encoded_payment_proof>' \\${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? `
  -d '${JSON.stringify(exampleBody, null, 2)}'` : ''}

# Response format:
# ${JSON.stringify(primaryPayment.outputSchema.output || { status: 'success' }, null, 2)}`;

      case 'go':
        return `// x402 API Integration - Go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	
	"github.com/x402/sdk-go" // Assuming SDK exists
)

type APIRequest struct {${Object.entries(schema.bodyFields || {}).map(([key, field]: [string, any]) => `
	${key.charAt(0).toUpperCase() + key.slice(1)} ${field.type === 'string' ? 'string' : field.type === 'number' ? 'int' : 'interface{}'} \`json:"${key}"\``).join('')}
}

type APIResponse struct {${Object.entries(primaryPayment.outputSchema.output || {}).map(([key, value]) => `
	${key.charAt(0).toUpperCase() + key.slice(1)} ${typeof value === 'string' ? 'string' : typeof value === 'number' ? 'int' : 'interface{}'} \`json:"${key}"\``).join('')}
}

func callAPI() (*APIResponse, error) {
	// Initialize x402 client
	client, err := x402.NewClient(&x402.Config{
		Network: "${primaryPayment.network}",
		Wallet:  "<your-wallet-address>",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	// Create payment
	payment, err := client.CreatePayment(&x402.PaymentRequest{
		Asset:  "${primaryPayment.asset}",
		Amount: "${primaryPayment.maxAmountRequired}",
		PayTo:  "${primaryPayment.payTo}",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create payment: %w", err)
	}${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? `

	// Prepare request body
	reqBody := APIRequest{${Object.entries(exampleBody).map(([key, value]) => `
		${key.charAt(0).toUpperCase() + key.slice(1)}: ${typeof value === 'string' ? `"${value}"` : value},`).join('')}
	}
	
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}` : ''}

	// Create HTTP request
	req, err := http.NewRequest("${schema.method}", "${primaryPayment.resource}", ${schema.bodyFields && Object.keys(schema.bodyFields).length > 0 ? 'bytes.NewBuffer(jsonData)' : 'nil'})
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-PAYMENT", payment.Proof)

	// Execute request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error: %d %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

func main() {
	result, err := callAPI()
	if err != nil {
		fmt.Printf("Error: %v\\n", err)
		return
	}
	
	fmt.Printf("Success: %+v\\n", result)
}`;

      default:
        return '';
    }
  };

  const handleCopy = async () => {
    const code = generateCodeSnippet(selectedLanguage);
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="retro-card max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold font-mono tracking-wide">
            INTEGRATION CODE
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <label className="block font-mono font-bold text-sm mb-2">
            SELECT LANGUAGE
          </label>
          <div className="flex flex-wrap gap-2">
            {(['javascript', 'typescript', 'python', 'curl', 'go'] as CodeLanguage[]).map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-2 font-mono text-sm border-2 border-black ${
                  selectedLanguage === lang
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Code Display */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-mono font-bold">CODE SNIPPET</h3>
            <button
              onClick={handleCopy}
              className="text-sm font-mono text-blue-600 hover:underline"
            >
              {copied ? '✓ COPIED!' : 'COPY CODE'}
            </button>
          </div>
          <pre className="bg-gray-100 border-2 border-black p-4 font-mono text-xs overflow-x-auto max-h-96">
            {generateCodeSnippet(selectedLanguage)}
          </pre>
        </div>

        {/* Installation Instructions */}
        <div className="mb-6 p-4 border-2 border-blue-600 bg-blue-50">
          <h3 className="font-mono font-bold mb-2">INSTALLATION</h3>
          <p className="text-sm mb-2">
            To use this code, you'll need to install the x402 SDK for your language:
          </p>
          <pre className="bg-white border border-blue-600 p-2 font-mono text-xs">
{selectedLanguage === 'javascript' || selectedLanguage === 'typescript'
  ? 'npm install @x402/sdk'
  : selectedLanguage === 'python'
  ? 'pip install x402-sdk'
  : selectedLanguage === 'go'
  ? 'go get github.com/x402/sdk-go'
  : 'curl -o x402-cli https://github.com/x402/cli/releases/latest/download/x402-cli'}
          </pre>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://docs.x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="retro-button text-center bg-gray-100"
          >
            SDK DOCUMENTATION
          </a>
          <a
            href="https://github.com/x402"
            target="_blank"
            rel="noopener noreferrer"
            className="retro-button text-center bg-gray-100"
          >
            GITHUB EXAMPLES
          </a>
          <a
            href={`https://explorer.${primaryPayment.network}.org/address/${primaryPayment.payTo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="retro-button text-center bg-gray-100"
          >
            VIEW CONTRACT
          </a>
        </div>
      </div>
    </div>
  );
}

