# X402 Manager

A professional platform for managing and discovering x402 APIs with seamless integration, comprehensive analytics, and service validation. Built with Next.js, OnchainKit, and a modern minimalist design aesthetic.

## Overview

X402 Manager is a comprehensive platform that enables developers to:

- **Discover x402 APIs**: Browse and explore available x402 services with detailed documentation, pricing, and validation status
- **Zero-code deployment**: Transform existing APIs into x402-compatible services without modifying your codebase
- **API import**: Import API definitions from Swagger/OpenAPI, Postman, or Insomnia files
- **Endpoint-level configuration**: Configure pricing, chains, and tokens per endpoint
- **Service validation**: Validate x402 services on testnet to ensure quality and reliability
- **Comprehensive analytics**: Monitor usage, revenue, and performance with detailed reporting tools
- **Multi-chain support**: Support for multiple blockchain networks (Base, Ethereum, Polygon, Solana, and more)
- **Professional management**: Manage multiple API services from a single dashboard

## Features

### For API Providers (Sellers)

- **Easy onboarding**: Register existing APIs with minimal configuration or import from API documentation
- **API import**: Import endpoints from Swagger/OpenAPI, Postman, or Insomnia collections
- **Automatic x402 integration**: Platform handles payment challenges and verification through gateway proxy
- **Endpoint-level pricing**: Configure different prices, chains, and tokens for each endpoint
- **Multi-chain support**: Accept payments on multiple blockchain networks simultaneously
- **Endpoint testing**: Test endpoints directly in the dashboard with full parameter support
- **Output schema management**: Define and validate expected API responses
- **Native x402 support**: Register APIs that already implement x402 protocol
- **Revenue tracking**: Monitor earnings, usage patterns, and client analytics
- **Service management**: Control discoverability, pricing, and endpoint configuration
- **Code generation**: Generate middleware code for various backend frameworks

### For API Consumers (Buyers)

- **Service discovery**: Find and evaluate available x402 APIs with advanced filtering
- **Service validation**: View validation status and scores for services
- **Transparent pricing**: Clear cost structure with no hidden fees
- **Multi-chain payments**: Pay using your preferred blockchain network
- **Seamless integration**: Use x402 client libraries for automatic payment handling
- **Payment verification**: Onchain verification through trusted facilitators

### Platform Features

- **Service validator system**: Automated validation of x402 services on testnet
  - Free testnet validation (platform pays)
  - User-paid mainnet validation
  - Abuse prevention and rate limiting
  - Validation scoring and reporting
- **Modern minimalist design**: Professional dark theme with modern functionality
- **Wallet integration**: Seamless connection with Coinbase wallets (Reown/AppKit)
- **Multi-network support**: Base, Ethereum, Polygon, Solana, Optimism, Arbitrum, and more
- **Dynamic chain/token fetching**: Real-time chain and token data via Squid Router
- **Transaction tracking**: Track payments for both proxied and native x402 APIs
- **Responsive design**: Optimized for desktop and mobile devices

## Technology Stack

### Backend
- **Framework**: Next.js 15 API Routes
- **Database**: Supabase (PostgreSQL)
- **Blockchain Integration**: Viem, CDP Facilitator API
- **Payment Processing**: x402 protocol with CDP facilitator
- **Cron Jobs**: Node-cron for scheduled tasks

### Infrastructure
- **Networks**: Multi-chain support (Base, Ethereum, Polygon, Solana, Optimism, Arbitrum, etc.)
- **Payments**: x402 protocol with CDP facilitator
- **Discovery**: CDP x402 Bazaar integration
- **Chain Data**: Squid Router for dynamic chain/token information

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Coinbase wallet or compatible Web3 wallet
- Supabase account (for backend database)
- CDP API credentials (for x402 facilitator)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd X402
```

2. Install dependencies for both frontend and backend:
```bash
# Frontend
cd app/celo-x402
pnpm install

```

3. Set up environment variables:

**Frontend** (`/.env.local`):
```env
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SQUID_ROUTER_API_KEY=your_squid_api_key
```

5. Run development servers:
**Frontend** (Terminal 2):
```bash
cd app/celo-x402
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── celo-x402/          # Frontend application
│   │   ├── app/
│   │   │   ├── api/        # Frontend API routes
│   │   │   ├── dashboard/  # Dashboard pages
│   │   │   ├── discover/   # Service discovery
│   │   │   ├── validate/   # Service validation
│   │   │   └── ...
│   │   ├── components/     # React components
│   │   │   ├── create-api/ # API creation components
│   │   │   └── ui/        # UI components
│   │   └── lib/           # Utility functions
│   │       ├── api-import-parsers.ts
│   │       ├── endpoint-testing.ts
│   │       ├── squid-router.ts
│   │       └── ...

```

## Usage

### Discovering APIs
1. Navigate to the **Discover** page
2. Use search and filters to find relevant APIs
3. View detailed information including pricing, validation status, and documentation
4. Services are cached in localStorage for fast loading

### Creating APIs

#### Regular APIs (Proxy Gateway)
1. Connect your wallet on the **Dashboard** page
2. Click **Create New API**
3. Choose "Existing API" type
4. **Import API** (optional): Upload Swagger/OpenAPI, Postman, or Insomnia files
5. Configure basic info (name, description, base URL)
6. Set default pricing (price, network, token) - supports multiple chains
7. Add endpoints with endpoint-level pricing overrides
8. Test endpoints directly in the dashboard
9. Configure output schemas for response validation
10. Generate middleware code for your backend framework
11. Deploy the generated code to enable x402 payments

#### Native x402 APIs
1. Choose "Native x402 API" type
2. Configure basic info and endpoints
3. No pricing configuration needed (handled by the API itself)
4. Endpoints can specify supported chains/tokens for discovery

### Validating Services
1. Navigate to the **Validate** page
2. Services are loaded from localStorage (from discover page)
3. Filter by testnet (default) or mainnet
4. Select a service and click "Validate"
5. For testnet: Platform pays for validation (free mode)
6. For mainnet: You pay for validation (user-paid mode)
7. View validation results including score, test details, and schema validation

### Managing Your APIs
1. View all your services on the **Dashboard**
2. Edit service configuration, endpoints, and pricing
3. Monitor usage and revenue through analytics
4. View transaction history for both proxied and native APIs

### Integrating x402
1. Use x402 client libraries in your applications:
   - `x402-fetch` for JavaScript/TypeScript
   - `x402-axios` for Axios-based projects
   - Python client libraries available

2. Handle 402 responses automatically:
```typescript
import { wrapFetchWithPayment } from "x402-fetch";

const fetchWithPayment = wrapFetchWithPayment(fetch, account);
const response = await fetchWithPayment("https://api.example.com/paid-endpoint");
```

## Development

### Available Scripts

**Frontend:**
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Adding New Features
1. Create new pages in the `app/` directory
2. Add components to `components/` directory
3. Update navigation in `components/ui/header.tsx`
4. Follow the design system for consistent styling
5. Update database schema and migrations as needed


## Architecture

### Frontend-Backend Separation
- **Frontend**: Next.js app handling UI, wallet connections, and client-side logic
- **Communication**: RESTful API between frontend and backend

### Database Schema
- **user_services**: Registered API services
- **service_endpoints**: Endpoint-level configuration with pricing
- **api_calls**: Transaction tracking and analytics
- **validated_services**: Service validation results
- **validation_requests**: Validation request history
- **blockchain_transactions_cache**: Cached blockchain transaction data

### Validation System
- **Testnet validation**: Platform pays using validator wallet
- **Mainnet validation**: User pays using their own wallet
- **Abuse prevention**: Rate limiting, budget controls, cooldown periods
- **Scoring**: Status code (30pts), schema validation (40pts), response time (20pts), no errors (10pts)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code style
4. Test thoroughly (frontend and backend)
5. Update database migrations if needed
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

- **Documentation**: Visit the `https://x402-manager.vercel.app/docs` page for comprehensive guides
- **GitHub**: Check the [x402 repository](https://github.com/coinbase/x402) for protocol details
- **Issues**: Report bugs and feature requests through GitHub issues

## Roadmap

### Completed ✅
- [x] Database integration for persistent data (Supabase + Drizzle ORM)
- [x] Advanced analytics and reporting
- [x] Multi-network support (Base, Ethereum, Polygon, Solana, etc.)
- [x] API rate limiting and abuse protection (validator system)
- [x] Service validation system
- [x] API import (Swagger/OpenAPI, Postman, Insomnia)
- [x] Endpoint-level pricing and configuration
- [x] Endpoint testing functionality
- [x] Output schema management
- [x] Native x402 API support
- [x] Transaction tracking for native APIs
- [x] Dynamic chain/token fetching

### In Progress 🚧
- [ ] Enhanced validation system with proper x402 payment integration
- [ ] Improved blockchain indexer for native APIs

### Planned 📋
- [ ] Webhook notifications
- [ ] Team collaboration features
- [ ] Advanced payment models (subscriptions, usage-based)
- [ ] Mobile application
- [ ] API versioning support
- [ ] Rate limiting per endpoint
- [ ] Advanced analytics dashboards
- [ ] Service health monitoring

## Acknowledgments

- Powered by the [x402 protocol](https://github.com/coinbase/x402)
- Running on multiple networks including [Base](https://base.org), Ethereum, Polygon, Solana
- Database powered by [Supabase](https://supabase.com)
