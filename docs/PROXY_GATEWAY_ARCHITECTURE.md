# X402 Proxy/Gateway Architecture

##  Core Problem
**Current Issue**: Giving users middleware code makes the platform unnecessary. Users can self-host and we provide no value.

**Solution**: Become a **proxy/gateway service** (like g402.org) that sits between users and their APIs.

---

## 🏗️ Architecture Overview

```
┌──────────┐        ┌─────────────────────────────┐        ┌──────────────┐
│  Client  │──402──>│    X402 Gateway (You)       │──────> │ User's API   │
│ Consumer │        │                             │        │ (Upstream)   │
└──────────┘        │  - Payment verification     │        └──────────────┘
                    │  - Fee collection           │
                    │  - Usage tracking           │
                    │  - Registry management      │
                    │  - Bazaar integration       │
                    └─────────────────────────────┘
```

### **How It Works:**

1. **User Registers API**: `POST /api/register`
   - User provides: `upstreamUrl`, `endpoints`, `pricing`, `network`
   - Platform generates: `proxyUrl` = `https://gateway.x402.io/{userId}/{serviceId}`

2. **Client Makes Request**: `GET https://gateway.x402.io/alice/weather-api/current`
   - Gateway intercepts ALL requests

3. **Payment Check**:
   - No `X-PAYMENT` header? → Return 402 with payment requirements
   - Has header? → Verify payment on-chain

4. **Payment Verification**:
   ```typescript
    Correct amount (e.g., 0.05 USDC)
    Correct recipient (platform wallet OR user wallet - fee split)
    Correct chain (Base, Solana, etc.)
    Not a replay attack (check nonce/timestamp)
   ```

5. **Forward Request**:
   - Payment valid? → Proxy to `https://api.user-domain.com/current`
   - Track usage, collect fees, update registry

6. **Response**:
   - Return upstream API response to client
   - Log transaction for analytics

---

##  Revenue Model

### **Option 1: Platform Fee (Recommended)**
```
User sets: 0.05 USDC per call
Platform takes: 10% (0.005 USDC)
User receives: 0.045 USDC
```

**Implementation**:
- Payment verification checks: `totalAmount = 0.05 USDC`
- Smart contract splits:
  - `0.045 USDC → userWallet`
  - `0.005 USDC → platformWallet`

### **Option 2: Subscription**
- User pays monthly: $50/month
- Platform handles all payments
- User gets 100% of API revenue

---

## 🔐 Payment Verification Flow

### **EIP-3009 Transfer (Current x402 Standard)**

```typescript
// 1. Client signs transfer
const transferSignature = signTransferWithAuthorization({
  from: clientWallet,
  to: platformWallet, // Or split contract
  value: parseUnits('0.05', 6), // 0.05 USDC
  validAfter: 0,
  validBefore: Math.floor(Date.now() / 1000) + 300, // 5 min
  nonce: generateNonce(),
});

// 2. Client sends to gateway
headers: {
  'X-Payment': base64(transferSignature)
}

// 3. Gateway verifies
const isValid = await verifyUSDCTransfer({
  signature: transferSignature,
  expectedAmount: '50000', // 0.05 USDC in atomic units
  expectedRecipient: platformWallet,
  expectedChain: 'base',
  nonceRegistry: db.usedNonces, // Prevent replay attacks
});

// 4. If valid, execute transfer on-chain (or let facilitator do it)
await executeTransfer(transferSignature);

// 5. Forward to upstream API
const response = await fetch(upstreamUrl, originalRequest);
```

### **Replay Attack Prevention**

```typescript
interface UsedNonce {
  nonce: string;
  usedAt: Date;
  userAddress: string;
  txHash?: string;
}

async function checkReplay(signature: TransferSignature): Promise<boolean> {
  // Check if nonce was already used
  const exists = await db.usedNonces.findOne({ 
    nonce: signature.nonce,
    userAddress: signature.from 
  });
  
  if (exists) {
    throw new Error('Replay attack detected: Nonce already used');
  }
  
  // Mark nonce as used
  await db.usedNonces.insert({
    nonce: signature.nonce,
    usedAt: new Date(),
    userAddress: signature.from,
  });
  
  return true;
}
```

---

## 🌐 Multi-Chain Support

### **Supported Networks**
1. **Base** (Primary)
   - USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
   - Native ETH support

2. **Solana** (Coming Soon)
   - USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
   - SPL Token transfers

3. **Ethereum Mainnet**
   - USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
   - Higher gas, less popular for micropayments

### **Chain-Specific Verification**

```typescript
async function verifyPayment(payment: Payment): Promise<boolean> {
  switch (payment.network) {
    case 'base':
    case 'ethereum':
      return verifyEVMTransfer(payment);
      
    case 'solana':
      return verifySolanaTransfer(payment);
      
    default:
      throw new Error(`Unsupported network: ${payment.network}`);
  }
}
```

---

## Registry & Discovery

### **Service Registry Database Schema**

```typescript
interface RegisteredService {
  id: string;                    // Unique service ID
  userId: string;                // Owner's user ID
  name: string;                  // "Weather API"
  description: string;
  
  // Upstream API
  upstreamUrl: string;           // "https://api.user-domain.com"
  endpoints: Endpoint[];         // List of protected endpoints
  
  // Gateway URL
  proxyUrl: string;              // "https://gateway.x402.io/alice/weather"
  proxySubdomain?: string;       // Optional: "weather-api.x402.io"
  
  // Pricing
  pricing: {
    default: string;             // "0.05" USDC
    perEndpoint?: Record<string, string>; // Custom pricing per endpoint
  };
  network: 'base' | 'solana' | 'ethereum';
  paymentToken: string;          // Token address (USDC, USDT, etc.)
  
  // Platform settings
  platformFeePercent: number;    // 10% = 10
  userWallet: string;            // User's wallet for revenue
  
  // Discovery
  discoverable: boolean;         // Show on Bazaar?
  tags: string[];               // ["weather", "data", "api"]
  category: string;             // "Data", "AI", "Finance"
  
  // Analytics
  totalCalls: number;
  totalRevenue: string;
  createdAt: Date;
  lastUsed: Date;
  status: 'active' | 'paused' | 'deleted';
}

interface Endpoint {
  path: string;                 // "/current"
  method: string;               // "GET"
  price?: string;              // Optional override pricing
  rateLimit?: {
    requests: number;
    window: number;            // seconds
  };
}
```

### **Bazaar Integration**

When `discoverable: true`, the service is automatically:
1. **Listed on x402 Bazaar** (your marketplace)
2. **Registered with x402 Spec Registry** (on-chain or IPFS)
3. **Discoverable by other clients** (x402scan, wallets, etc.)

```json
{
  "type": "http",
  "resource": "https://gateway.x402.io/alice/weather-api",
  "accepts": [{
    "scheme": "exact",
    "network": "base",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "maxAmountRequired": "50000",
    "payTo": "0xPLATFORM_WALLET",
    "metadata": {
      "name": "Weather API by Alice",
      "description": "Real-time weather data",
      "tags": ["weather", "data"]
    }
  }]
}
```

---

## 🚀 Implementation Plan

### **Phase 1: Core Gateway** (Week 1-2)
- [ ] Create `/api/gateway/[...path]` catch-all route
- [ ] Service registration API
- [ ] Basic payment verification (Base + USDC)
- [ ] Upstream proxying
- [ ] Nonce/replay attack prevention

### **Phase 2: User Dashboard** (Week 3)
- [ ] User can register APIs
- [ ] Generate proxy URLs
- [ ] View analytics (calls, revenue)
- [ ] Manage endpoints
- [ ] Pause/resume services

### **Phase 3: Payment Processing** (Week 4)
- [ ] EIP-3009 verification
- [ ] Fee splitting (platform 10%, user 90%)
- [ ] Support multiple chains (Base, Ethereum)
- [ ] Transaction tracking

### **Phase 4: Discovery** (Week 5)
- [ ] Bazaar marketplace UI
- [ ] Search/filter APIs
- [ ] API detail pages
- [ ] Integration guides
- [ ] Revenue leaderboard

### **Phase 5: Advanced Features** (Week 6+)
- [ ] Solana support
- [ ] Custom domains (user-api.x402.io)
- [ ] Rate limiting per user
- [ ] Webhooks for events
- [ ] API key management (alternative to x402)

---

## 🔧 Technical Implementation

### **Gateway Route Handler**

```typescript
// app/api/gateway/[...path]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  // Parse proxy URL: /gateway/userId/serviceId/endpoint
  const [userId, serviceId, ...endpointParts] = params.path;
  const endpoint = '/' + endpointParts.join('/');
  
  // Lookup service in registry
  const service = await db.registeredServices.findOne({
    userId,
    id: serviceId,
    status: 'active'
  });
  
  if (!service) {
    return new Response('Service not found', { status: 404 });
  }
  
  // Check payment
  const paymentHeader = request.headers.get('X-Payment');
  
  if (!paymentHeader) {
    // Return 402 with payment requirements
    return new Response(JSON.stringify({
      x402Version: 1,
      accepts: [{
        scheme: 'exact',
        network: service.network,
        maxAmountRequired: service.pricing.default,
        asset: service.paymentToken,
        payTo: PLATFORM_WALLET,
        resource: request.url,
        description: `Payment required: ${service.pricing.default} USDC`,
      }],
      error: 'Payment required'
    }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Verify payment
  const payment = decodePayment(paymentHeader);
  const isValid = await verifyPayment({
    payment,
    expectedAmount: service.pricing.default,
    expectedRecipient: PLATFORM_WALLET,
    expectedChain: service.network,
  });
  
  if (!isValid) {
    return new Response('Invalid payment', { status: 402 });
  }
  
  // Execute payment (split fees)
  await executePaymentWithSplit({
    payment,
    platformFee: service.platformFeePercent,
    userWallet: service.userWallet,
  });
  
  // Forward to upstream API
  const upstreamUrl = service.upstreamUrl + endpoint;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers),
      'X-Forwarded-For': getClientIP(request),
      'X-Gateway': 'x402-platform',
    },
    body: request.body,
  });
  
  // Track usage
  await db.analytics.insert({
    serviceId: service.id,
    userId: service.userId,
    endpoint,
    timestamp: new Date(),
    revenue: service.pricing.default,
    paymentTxHash: payment.txHash,
  });
  
  // Return upstream response
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: upstreamResponse.headers,
  });
}
```

---

## ❓ Why This Model Works

### **Value Proposition**:

1. **For API Providers**:
   -  No infrastructure setup
   -  Automatic payment processing
   -  Built-in discovery (Bazaar)
   -  Analytics dashboard
   -  Cross-chain support (coming soon)
   -  Rate limiting & security

2. **For API Consumers**:
   -  Pay-per-use (no subscriptions)
   -  Discover new APIs
   -  Unified payment method (USDC)
   -  Cross-chain flexibility

3. **For Platform (You)**:
   -  10% of all transactions
   -  Registry/marketplace control
   -  Gateway becomes mission-critical
   -  Network effects (more APIs = more users)

---

##  Migration Path

### **From Middleware to Gateway**:

**Old Flow** (Middleware):
```
Client → User's API (with middleware) → Check payment → Return data
Problem: User can remove middleware, no platform value
```

**New Flow** (Gateway):
```
Client → X402 Gateway → Check payment → User's API → Return data
Value: Platform is essential infrastructure
```

### **User Migration**:
1. Users keep existing APIs running
2. Register API on platform → Get proxy URL
3. Share proxy URL instead of direct URL
4. Platform handles ALL payments
5. User gets 90% revenue automatically

---

## 🚦 Next Steps

1. **Build Gateway Service** (Priority 1)
2. **Add Service Registration** (Priority 2)
3. **Implement Payment Verification** (Priority 3)
4. **Create Bazaar UI** (Priority 4)
5. **Launch with Base/Solana** (Priority 5)


