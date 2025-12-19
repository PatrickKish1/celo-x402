/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Middleware Templates for x402
 * Code generation templates for different languages
 */

export type Language = 'node' | 'python' | 'java' | 'go' | 'rust';
export type MiddlewareType = 'proxy' | 'middleware';

export interface MiddlewareConfig {
  price: string;
  currency: string;
  network: string;
  payTo: string;
  excludedPaths?: string[];
  excludedMethods?: string[];
  timeout?: number;
}

export interface GeneratedCode {
  language: Language;
  type: MiddlewareType;
  files: Array<{
    name: string;
    content: string;
    description: string;
  }>;
  instructions: string;
}

/**
 * Generate middleware code for a specific language
 */
export function generateMiddleware(
  language: Language,
  type: MiddlewareType,
  config: MiddlewareConfig
): GeneratedCode {
  switch (language) {
    case 'node':
      return type === 'proxy' 
        ? generateNodeProxy(config)
        : generateNodeMiddleware(config);
    case 'python':
      return type === 'proxy'
        ? generatePythonProxy(config)
        : generatePythonMiddleware(config);
    case 'java':
      return type === 'proxy'
        ? generateJavaProxy(config)
        : generateJavaMiddleware(config);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * Node.js Proxy Template (Gateway-based - No SDK required)
 */
function generateNodeProxy(config: MiddlewareConfig): GeneratedCode {
  const code = `const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuration - NO SDK INSTALLATION NEEDED!
// All payment verification is handled by the x402 gateway
const X402_CONFIG = {
  serviceId: process.env.X402_SERVICE_ID, // Your service ID from x402 dashboard
  userId: process.env.X402_USER_ID,        // Your user ID from x402 dashboard
  gatewayUrl: process.env.X402_GATEWAY_URL || 'https://gateway.x402.io', // x402 Gateway URL
  upstreamUrl: process.env.UPSTREAM_URL || 'http://localhost:3000', // Your actual API
  timeout: ${config.timeout || 30000},
};

// ============================================================================
// SIMPLE GATEWAY-BASED PROXY - NO SDK INSTALLATION REQUIRED!
// ============================================================================
// This proxy forwards ALL requests to the x402 gateway, which handles:
// - Payment verification
// - 402 responses
// - Request forwarding to your upstream API
// - Response proxying back to client
//
// You just need to:
// 1. Set your X402_SERVICE_ID and X402_USER_ID env vars
// 2. Deploy this proxy
// 3. Point your clients to this proxy URL
// ============================================================================

app.all('*', async (req, res) => {
  try {
    if (!X402_CONFIG.serviceId || !X402_CONFIG.userId) {
      return res.status(500).json({
        error: 'Missing x402 configuration',
        message: 'Set X402_SERVICE_ID and X402_USER_ID environment variables'
      });
    }

    // Build gateway URL - gateway handles ALL payment logic
    const gatewayPath = req.originalUrl.startsWith('/') ? req.originalUrl.slice(1) : req.originalUrl;
    const gatewayUrl = \`\${X402_CONFIG.gatewayUrl}/api/gateway/\${X402_CONFIG.userId}/\${X402_CONFIG.serviceId}/\${gatewayPath}\`;
    
    console.log(\`[x402 Proxy] Forwarding \${req.method} \${req.originalUrl} -> \${gatewayUrl}\`);

    // Forward request to x402 gateway with ALL headers (including X-Payment if present)
    const response = await axios({
      method: req.method,
      url: gatewayUrl,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      data: req.body,
      params: req.query,
      timeout: X402_CONFIG.timeout,
      validateStatus: () => true, // Forward all status codes (including 402)
      responseType: 'arraybuffer', // Get raw response to preserve content type
    });

    // Forward response status and headers
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'transfer-encoding') { // Skip transfer-encoding
        res.setHeader(key, value as string);
      }
    });
    
    // Forward response body
    res.send(response.data);
    
  } catch (error: any) {
    console.error('[x402 Proxy] Error:', error.message);
    res.status(500).json({
      error: 'Gateway proxy error',
      message: error.message,
      hint: 'Check X402_GATEWAY_URL and ensure the gateway is accessible'
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(\`\\n🚀 x402 Gateway Proxy running on port \${PORT}\`);
  console.log(\`📡 Gateway: \${X402_CONFIG.gatewayUrl}\`);
  console.log(\`🔗 Upstream API: \${X402_CONFIG.upstreamUrl}\`);
  console.log(\`✅ No SDK installation required - gateway handles all payments!\\n\`);
});`;

  return {
    language: 'node',
    type: 'proxy',
    files: [
      {
        name: 'server.js',
        content: code,
        description: 'Gateway-based proxy server (no SDK required!)'
      },
      {
        name: 'package.json',
        content: JSON.stringify({
          name: 'x402-gateway-proxy',
          version: '1.0.0',
          description: 'Simple proxy that forwards to x402 gateway - NO SDK INSTALLATION NEEDED!',
          main: 'server.js',
          scripts: {
            start: 'node server.js',
            dev: 'nodemon server.js'
          },
          dependencies: {
            'express': '^4.18.2',
            'axios': '^1.6.0'
          },
          devDependencies: {
            'nodemon': '^3.0.0'
          }
        }, null, 2),
        description: 'Node.js dependencies (only express and axios - no x402 SDK!)'
      },
      {
        name: '.env.example',
        content: `# Get these from your x402 dashboard: https://x402.io/dashboard
X402_SERVICE_ID=your-service-id-here
X402_USER_ID=your-user-id-here

# x402 Gateway URL (leave as default unless using custom gateway)
X402_GATEWAY_URL=https://gateway.x402.io

# Your actual API that provides the data/service
UPSTREAM_URL=http://localhost:3000

# Port for this proxy server
PORT=4000`,
        description: 'Environment variables (get SERVICE_ID and USER_ID from x402 dashboard)'
      },
      {
        name: 'README.md',
        content: `# x402 Gateway Proxy

## 🎉 No SDK Installation Required!

This proxy forwards requests to the x402 gateway, which handles all payment verification.
You don't need to install any x402 SDK or handle payments yourself!

## Quick Start

1. **Install dependencies:**
   \\\`\\\`\\\`bash
   npm install
   \\\`\\\`\\\`

2. **Configure environment:**
   - Copy \`.env.example\` to \`.env\`
   - Get your \`X402_SERVICE_ID\` and \`X402_USER_ID\` from https://x402.io/dashboard
   - Set your \`UPSTREAM_URL\` to your actual API

3. **Run:**
   \\\`\\\`\\\`bash
   npm start
   \\\`\\\`\\\`

4. **Test:**
   Point your clients to \`http://localhost:4000\` instead of your API directly

## How It Works

\\\`\\\`\\\`
Client -> Your Proxy -> x402 Gateway -> Your API
                            ↓
                    (handles payments)
\\\`\\\`\\\`

The x402 gateway:
- Checks for payments
- Returns 402 if payment needed
- Verifies payment proofs
- Forwards to your API if paid
- Proxies response back

## Benefits

- ✅ **Zero SDK dependencies** - just express & axios
- ✅ **No payment logic** - gateway handles everything
- ✅ **Automatic updates** - gateway improvements work instantly
- ✅ **Multi-chain support** - gateway supports all chains
- ✅ **0% platform fees** - you keep 100% of payments

## Environment Variables

- \`X402_SERVICE_ID\` - Your service ID from dashboard (required)
- \`X402_USER_ID\` - Your user ID from dashboard (required)
- \`X402_GATEWAY_URL\` - Gateway URL (default: https://gateway.x402.io)
- \`UPSTREAM_URL\` - Your actual API URL (required)
- \`PORT\` - Proxy server port (default: 4000)

## Support

Visit https://x402.io/docs for documentation`,
        description: 'Setup instructions and documentation'
      }
    ],
    instructions: `## Setup Instructions:

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Get your credentials:**
   - Go to https://x402.io/dashboard
   - Find your SERVICE_ID and USER_ID
   
3. **Configure:**
   - Copy .env.example to .env
   - Add your X402_SERVICE_ID and X402_USER_ID
   - Set UPSTREAM_URL to your API

4. **Run:**
   \`\`\`bash
   npm start
   \`\`\`

5. **Deploy:**
   - Point clients to your proxy URL
   - x402 gateway handles all payments automatically!

**Note:** NO x402 SDK installation needed! Gateway handles everything.`
  };
}

/**
 * Node.js Middleware Template
 */
function generateNodeMiddleware(config: MiddlewareConfig): GeneratedCode {
  const code = `const { verifyX402Payment } = require('@x402/sdk');

// x402 Configuration
const X402_CONFIG = {
  price: '${config.price}',
  currency: '${config.currency}',
  network: '${config.network}',
  payTo: '${config.payTo}',
  excludedPaths: ${JSON.stringify(config.excludedPaths || ['/health', '/metrics'])},
  excludedMethods: ${JSON.stringify(config.excludedMethods || ['OPTIONS'])},
};

/**
 * x402 Payment Middleware for Express
 * Add this to your Express app before your routes
 */
function x402Middleware(req, res, next) {
  // Skip excluded paths and methods
  if (X402_CONFIG.excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  if (X402_CONFIG.excludedMethods.includes(req.method)) {
    return next();
  }

  // Check for X-PAYMENT header
  const paymentHeader = req.headers['x-payment'];
  
  if (!paymentHeader) {
    // Return 402 Payment Required
    return res.status(402).json({
      x402Version: 1,
      accepts: [{
        scheme: 'exact',
        network: X402_CONFIG.network,
        maxAmountRequired: X402_CONFIG.price,
        resource: req.originalUrl,
        description: \`Payment required: \${X402_CONFIG.price} \${X402_CONFIG.currency}\`,
        mimeType: 'application/json',
        payTo: X402_CONFIG.payTo,
        maxTimeoutSeconds: 300,
        asset: X402_CONFIG.currency === 'USDC' 
          ? (X402_CONFIG.network === 'base' ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
          : '0x0000000000000000000000000000000000000000',
        extra: {
          name: X402_CONFIG.currency,
          version: '2'
        }
      }],
      error: 'Payment required. Please provide X-PAYMENT header.'
    });
  }

  try {
    // Verify payment proof
    const paymentProof = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
    const isValid = await verifyX402Payment(paymentProof, {
      network: X402_CONFIG.network,
      payTo: X402_CONFIG.payTo,
      amount: X402_CONFIG.price,
    });

    if (!isValid) {
      return res.status(402).json({
        error: 'Invalid payment proof'
      });
    }

    // Payment verified, proceed
    next();
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(402).json({
      error: 'Payment verification failed'
    });
  }
}

module.exports = { x402Middleware, X402_CONFIG };`;

  return {
    language: 'node',
    type: 'middleware',
    files: [
      {
        name: 'x402-middleware.js',
        content: code,
        description: 'x402 middleware for Express'
      },
      {
        name: 'usage-example.js',
        content: `const express = require('express');
const { x402Middleware } = require('./x402-middleware');

const app = express();
app.use(express.json());

// Apply x402 middleware globally
app.use(x402Middleware);

// Your existing routes work unchanged
app.get('/api/data', (req, res) => {
  res.json({ message: 'Protected by x402!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  // console.log('Server running on port 3000');
});`,
        description: 'Example usage in Express app'
      }
    ],
    instructions: `1. Install: npm install @x402/sdk
2. Import and use: const { x402Middleware } = require('./x402-middleware');
3. Add to your Express app: app.use(x402Middleware);
4. All routes are now x402-protected!`
  };
}

/**
 * Python Proxy Template (Gateway-based - No SDK required)
 */
function generatePythonProxy(config: MiddlewareConfig): GeneratedCode {
  const code = `from flask import Flask, request, Response
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# Configuration - NO SDK INSTALLATION NEEDED!
# All payment verification is handled by the x402 gateway
X402_CONFIG = {
    'service_id': os.getenv('X402_SERVICE_ID'),  # Your service ID from x402 dashboard
    'user_id': os.getenv('X402_USER_ID'),        # Your user ID from x402 dashboard
    'gateway_url': os.getenv('X402_GATEWAY_URL', 'https://gateway.x402.io'),
    'upstream_url': os.getenv('UPSTREAM_URL', 'http://localhost:3000'),
    'timeout': ${config.timeout || 30},
}

# ============================================================================
# SIMPLE GATEWAY-BASED PROXY - NO SDK INSTALLATION REQUIRED!
# ============================================================================
# This proxy forwards ALL requests to the x402 gateway, which handles:
# - Payment verification
# - 402 responses  
# - Request forwarding to your upstream API
# - Response proxying back to client
# ============================================================================

@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path):
    """Proxy all requests to x402 gateway"""
    
    if not X402_CONFIG['service_id'] or not X402_CONFIG['user_id']:
        return {
            'error': 'Missing x402 configuration',
            'message': 'Set X402_SERVICE_ID and X402_USER_ID environment variables'
        }, 500
    
    # Build gateway URL
    gateway_path = path if path else ''
    gateway_url = f"{X402_CONFIG['gateway_url']}/api/gateway/{X402_CONFIG['user_id']}/{X402_CONFIG['service_id']}/{gateway_path}"
    
    print(f"[x402 Proxy] Forwarding {request.method} /{path} -> {gateway_url}")
    
    try:
        # Forward request to x402 gateway with ALL headers
        headers = {key: value for key, value in request.headers if key.lower() != 'host'}
        
        response = requests.request(
            method=request.method,
            url=gateway_url,
            headers=headers,
            data=request.get_data(),
            params=request.args,
            timeout=X402_CONFIG['timeout'],
            allow_redirects=False,
            stream=True
        )
        
        # Forward response
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        response_headers = [(name, value) for name, value in response.raw.headers.items()
                          if name.lower() not in excluded_headers]
        
        return Response(
            response.content,
            status=response.status_code,
            headers=response_headers
        )
        
    except Exception as e:
        print(f"[x402 Proxy] Error: {str(e)}")
        return {
            'error': 'Gateway proxy error',
            'message': str(e),
            'hint': 'Check X402_GATEWAY_URL and ensure the gateway is accessible'
        }, 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4000))
    print(f"\\n🚀 x402 Gateway Proxy running on port {port}")
    print(f"📡 Gateway: {X402_CONFIG['gateway_url']}")
    print(f"🔗 Upstream API: {X402_CONFIG['upstream_url']}")
    print(f"✅ No SDK installation required - gateway handles all payments!\\n")
    app.run(host='0.0.0.0', port=port)`;

  return {
    language: 'python',
    type: 'proxy',
    files: [
      {
        name: 'proxy.py',
        content: code,
        description: 'Gateway-based proxy server (no SDK required!)'
      },
      {
        name: 'requirements.txt',
        content: `flask==3.0.0
flask-cors==4.0.0
requests==2.31.0`,
        description: 'Python dependencies (no x402 SDK!)'
      },
      {
        name: '.env.example',
        content: `# Get these from your x402 dashboard: https://x402.io/dashboard
X402_SERVICE_ID=your-service-id-here
X402_USER_ID=your-user-id-here

# x402 Gateway URL (leave as default unless using custom gateway)
X402_GATEWAY_URL=https://gateway.x402.io

# Your actual API that provides the data/service
UPSTREAM_URL=http://localhost:3000

# Port for this proxy server
PORT=4000`,
        description: 'Environment variables (get SERVICE_ID and USER_ID from dashboard)'
      },
      {
        name: 'README.md',
        content: `# x402 Gateway Proxy (Python)

## 🎉 No SDK Installation Required!

This proxy forwards requests to the x402 gateway, which handles all payment verification.

## Quick Start

1. **Install dependencies:**
   \\\`\\\`\\\`bash
   pip install -r requirements.txt
   \\\`\\\`\\\`

2. **Configure:**
   - Copy \`.env.example\` to \`.env\`
   - Get your SERVICE_ID and USER_ID from https://x402.io/dashboard
   - Set your UPSTREAM_URL

3. **Run:**
   \\\`\\\`\\\`bash
   python proxy.py
   \\\`\\\`\\\`

## Benefits

- ✅ **Zero SDK dependencies** - just flask & requests
- ✅ **No payment logic** - gateway handles everything  
- ✅ **0% platform fees** - you keep 100% of payments

Visit https://x402.io/docs for documentation`,
        description: 'Setup instructions'
      }
    ],
    instructions: `## Setup Instructions:

1. **Install dependencies:**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. **Get credentials from https://x402.io/dashboard**
   
3. **Configure:**
   - Copy .env.example to .env
   - Add X402_SERVICE_ID and X402_USER_ID
   - Set UPSTREAM_URL

4. **Run:**
   \`\`\`bash
   python proxy.py
   \`\`\`

**Note:** NO x402 SDK installation needed! Gateway handles everything.
2. Copy .env.example to .env and configure
3. Run: python proxy.py
4. Point your clients to http://localhost:4000`
  };
}

/**
 * Python Middleware Template
 */
function generatePythonMiddleware(config: MiddlewareConfig): GeneratedCode {
  const code = `from flask import Flask, request, jsonify
from functools import wraps
import json
import base64
from x402_sdk import verify_payment

# Configuration
X402_CONFIG = {
    'price': '${config.price}',
    'currency': '${config.currency}',
    'network': '${config.network}',
    'pay_to': '${config.payTo}',
    'excluded_paths': ${JSON.stringify(config.excludedPaths || ['/health', '/metrics'])},
    'excluded_methods': ${JSON.stringify(config.excludedMethods || ['OPTIONS'])},
}

def should_exclude(path, method):
    """Check if path/method should be excluded"""
    return (
        any(path.startswith(p) for p in X402_CONFIG['excluded_paths']) or
        method in X402_CONFIG['excluded_methods']
    )

def get_402_response(path):
    """Generate 402 Payment Required response"""
    return jsonify({
        'x402Version': 1,
        'accepts': [{
            'scheme': 'exact',
            'network': X402_CONFIG['network'],
            'maxAmountRequired': X402_CONFIG['price'],
            'resource': path,
            'description': f"Payment required: {X402_CONFIG['price']} {X402_CONFIG['currency']}",
            'mimeType': 'application/json',
            'payTo': X402_CONFIG['pay_to'],
            'maxTimeoutSeconds': 300,
            'asset': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' if X402_CONFIG['network'] == 'base' else '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            'extra': {
                'name': X402_CONFIG['currency'],
                'version': '2'
            }
        }],
        'error': 'Payment required. Please provide X-PAYMENT header.'
    }), 402

def x402_required(f):
    """Decorator to require x402 payment"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if should_exclude(request.path, request.method):
            return f(*args, **kwargs)
        
        payment_header = request.headers.get('X-PAYMENT')
        
        if not payment_header:
            return get_402_response(request.path)
        
        try:
            payment_proof = json.loads(base64.b64decode(payment_header).decode())
            is_valid = verify_payment(
                payment_proof,
                network=X402_CONFIG['network'],
                pay_to=X402_CONFIG['pay_to'],
                amount=X402_CONFIG['price']
            )
            
            if not is_valid:
                return jsonify({'error': 'Invalid payment proof'}), 402
        except Exception as e:
            print(f'Payment verification error: {e}')
            return jsonify({'error': 'Payment verification failed'}), 402
        
        return f(*args, **kwargs)
    return decorated_function

# Global middleware version
def x402_middleware():
    """Use as Flask before_request handler"""
    if should_exclude(request.path, request.method):
        return None
    
    payment_header = request.headers.get('X-PAYMENT')
    
    if not payment_header:
        return get_402_response(request.path)
    
    try:
        payment_proof = json.loads(base64.b64decode(payment_header).decode())
        is_valid = verify_payment(
            payment_proof,
            network=X402_CONFIG['network'],
            pay_to=X402_CONFIG['pay_to'],
            amount=X402_CONFIG['price']
        )
        
        if not is_valid:
            return jsonify({'error': 'Invalid payment proof'}), 402
    except Exception as e:
        print(f'Payment verification error: {e}')
        return jsonify({'error': 'Payment verification failed'}), 402
    
    return None  # Continue to route handler`;

  return {
    language: 'python',
    type: 'middleware',
    files: [
      {
        name: 'x402_middleware.py',
        content: code,
        description: 'x402 middleware for Flask'
      },
      {
        name: 'usage_example.py',
        content: `from flask import Flask, jsonify
from x402_middleware import x402_middleware, x402_required

app = Flask(__name__)

# Option 1: Global middleware
app.before_request(x402_middleware)

# Option 2: Per-route decorator
@app.route('/api/data')
@x402_required
def get_data():
    return jsonify({'message': 'Protected by x402!'})

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(port=3000)`,
        description: 'Example usage in Flask app'
      }
    ],
    instructions: `1. Install: pip install x402-sdk
2. Import: from x402_middleware import x402_middleware
3. Add to Flask: app.before_request(x402_middleware)
4. All routes are now x402-protected!`
  };
}

/**
 * Java Spring Boot Proxy Template
 */
function generateJavaProxy(config: MiddlewareConfig): GeneratedCode {
  const code = `package com.x402.proxy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@SpringBootApplication
public class X402ProxyApplication {
    public static void main(String[] args) {
        SpringApplication.run(X402ProxyApplication.class, args);
    }
}

@RestController
@RequestMapping("/**")
class ProxyController {
    
    private static final String UPSTREAM_URL = System.getenv("UPSTREAM_URL") != null 
        ? System.getenv("UPSTREAM_URL") 
        : "http://localhost:3000";
    
    private static final List<String> EXCLUDED_PATHS = Arrays.asList("/health", "/metrics");
    private static final List<String> EXCLUDED_METHODS = Arrays.asList("OPTIONS");
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @RequestMapping(method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
                              RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<?> proxy(
            HttpServletRequest request,
            @RequestBody(required = false) String body) {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Check exclusions
        if (EXCLUDED_PATHS.stream().anyMatch(path::startsWith) || 
            EXCLUDED_METHODS.contains(method)) {
            return forwardRequest(request, body);
        }
        
        // Check for X-PAYMENT header
        String paymentHeader = request.getHeader("X-PAYMENT");
        
        if (paymentHeader == null || paymentHeader.isEmpty()) {
            return get402Response(path);
        }
        
        try {
            // Verify payment (implement with x402 SDK)
            boolean isValid = X402Verifier.verifyPayment(paymentHeader, "${config.network}", "${config.payTo}", "${config.price}");
            
            if (!isValid) {
                return ResponseEntity.status(402)
                    .body(Map.of("error", "Invalid payment proof"));
            }
            
            // Payment verified, forward request
            return forwardRequest(request, body);
        } catch (Exception e) {
            return ResponseEntity.status(402)
                .body(Map.of("error", "Payment verification failed", "message", e.getMessage()));
        }
    }
    
    private ResponseEntity<?> forwardRequest(HttpServletRequest request, String body) {
        String upstreamUrl = UPSTREAM_URL + request.getRequestURI();
        if (request.getQueryString() != null) {
            upstreamUrl += "?" + request.getQueryString();
        }
        
        HttpHeaders headers = new HttpHeaders();
        Collections.list(request.getHeaderNames()).forEach(headerName -> {
            if (!headerName.equalsIgnoreCase("x-payment")) {
                headers.add(headerName, request.getHeader(headerName));
            }
        });
        
        HttpMethod httpMethod = HttpMethod.valueOf(request.getMethod());
        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                upstreamUrl, httpMethod, entity, String.class);
            return response;
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Proxy error", "message", e.getMessage()));
        }
    }
    
    private ResponseEntity<?> get402Response(String path) {
        Map<String, Object> response = new HashMap<>();
        response.put("x402Version", 1);
        
        Map<String, Object> accept = new HashMap<>();
        accept.put("scheme", "exact");
        accept.put("network", "${config.network}");
        accept.put("maxAmountRequired", "${config.price}");
        accept.put("resource", path);
        accept.put("description", "Payment required: ${config.price} ${config.currency}");
        accept.put("mimeType", "application/json");
        accept.put("payTo", "${config.payTo}");
        accept.put("maxTimeoutSeconds", 300);
        accept.put("asset", "${config.network}" == "base" 
            ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" 
            : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
        accept.put("extra", Map.of("name", "${config.currency}", "version", "2"));
        
        response.put("accepts", Arrays.asList(accept));
        response.put("error", "Payment required. Please provide X-PAYMENT header.");
        
        return ResponseEntity.status(402).body(response);
    }
}`;

  return {
    language: 'java',
    type: 'proxy',
    files: [
      {
        name: 'X402ProxyApplication.java',
        content: code,
        description: 'Spring Boot proxy application'
      },
      {
        name: 'pom.xml',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    <groupId>com.x402</groupId>
    <artifactId>x402-proxy</artifactId>
    <version>1.0.0</version>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.x402</groupId>
            <artifactId>x402-sdk</artifactId>
            <version>latest</version>
        </dependency>
    </dependencies>
</project>`,
        description: 'Maven dependencies'
      }
    ],
    instructions: `1. Install Maven dependencies: mvn install
2. Set environment: export UPSTREAM_URL=http://localhost:3000
3. Run: mvn spring-boot:run
4. Point clients to http://localhost:8080`
  };
}

/**
 * Java Spring Boot Middleware Template
 */
function generateJavaMiddleware(config: MiddlewareConfig): GeneratedCode {
  const code = `package com.x402.middleware;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.*;

@Component
public class X402Interceptor implements HandlerInterceptor {
    
    private static final List<String> EXCLUDED_PATHS = Arrays.asList("/health", "/metrics");
    private static final List<String> EXCLUDED_METHODS = Arrays.asList("OPTIONS");
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Check exclusions
        if (EXCLUDED_PATHS.stream().anyMatch(path::startsWith) || 
            EXCLUDED_METHODS.contains(method)) {
            return true;
        }
        
        // Check for X-PAYMENT header
        String paymentHeader = request.getHeader("X-PAYMENT");
        
        if (paymentHeader == null || paymentHeader.isEmpty()) {
            send402Response(response, path);
            return false;
        }
        
        try {
            // Verify payment
            boolean isValid = X402Verifier.verifyPayment(
                paymentHeader, 
                "${config.network}", 
                "${config.payTo}", 
                "${config.price}"
            );
            
            if (!isValid) {
                response.setStatus(402);
                response.getWriter().write("{\"error\":\"Invalid payment proof\"}");
                return false;
            }
            
            return true;
        } catch (Exception e) {
            response.setStatus(402);
            response.getWriter().write("{\"error\":\"Payment verification failed\"}");
            return false;
        }
    }
    
    private void send402Response(HttpServletResponse response, String path) throws Exception {
        response.setStatus(402);
        response.setContentType("application/json");
        
        Map<String, Object> accept = new HashMap<>();
        accept.put("scheme", "exact");
        accept.put("network", "${config.network}");
        accept.put("maxAmountRequired", "${config.price}");
        accept.put("resource", path);
        accept.put("description", "Payment required: ${config.price} ${config.currency}");
        accept.put("mimeType", "application/json");
        accept.put("payTo", "${config.payTo}");
        accept.put("maxTimeoutSeconds", 300);
        accept.put("asset", "${config.network}" == "base" 
            ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" 
            : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
        accept.put("extra", Map.of("name", "${config.currency}", "version", "2"));
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("x402Version", 1);
        responseBody.put("accepts", Arrays.asList(accept));
        responseBody.put("error", "Payment required. Please provide X-PAYMENT header.");
        
        response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(responseBody));
    }
}`;

  return {
    language: 'java',
    type: 'middleware',
    files: [
      {
        name: 'X402Interceptor.java',
        content: code,
        description: 'Spring Boot interceptor for x402'
      },
      {
        name: 'WebConfig.java',
        content: `package com.x402.middleware;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    private final X402Interceptor x402Interceptor;
    
    public WebConfig(X402Interceptor x402Interceptor) {
        this.x402Interceptor = x402Interceptor;
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(x402Interceptor);
    }
}`,
        description: 'Spring Boot configuration to register interceptor'
      }
    ],
    instructions: `1. Add x402-sdk dependency to pom.xml
2. Register interceptor in WebConfig
3. All routes are now x402-protected!`
  };
}

