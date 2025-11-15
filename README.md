# X402 Manager

A professional platform for managing and discovering x402 APIs with seamless integration and comprehensive analytics. Built with Next.js, OnchainKit, and a retro minimalist design aesthetic.

## Overview

X402 Manager is a comprehensive platform that enables developers to:

- **Discover x402 APIs**: Browse and explore available x402 services with detailed documentation and pricing
- **Zero-code deployment**: Transform existing APIs into x402-compatible services without modifying your codebase
- **Comprehensive analytics**: Monitor usage, revenue, and performance with detailed reporting tools
- **Professional management**: Manage multiple API services from a single dashboard

## Features

### For API Providers (Sellers)
- **Easy onboarding**: Register existing APIs with minimal configuration
- **Automatic x402 integration**: Platform handles payment challenges and verification
- **Revenue tracking**: Monitor earnings, usage patterns, and client analytics
- **Service management**: Control discoverability, pricing, and endpoint configuration

### For API Consumers (Buyers)
- **Service discovery**: Find and evaluate available x402 APIs
- **Transparent pricing**: Clear cost structure with no hidden fees
- **Seamless integration**: Use x402 client libraries for automatic payment handling
- **Payment verification**: Onchain verification through trusted facilitators

### Platform Features
- **Retro minimalist design**: Professional 80s/90s aesthetic with modern functionality
- **Wallet integration**: Seamless connection with Coinbase wallets
- **Base network support**: Built for the Base L2 ecosystem
- **Responsive design**: Optimized for desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom retro components
- **Blockchain**: OnchainKit, Wagmi, Viem
- **Network**: Base L2 (mainnet and testnet)
- **Payments**: x402 protocol with CDP facilitator

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Coinbase wallet or compatible Web3 wallet
- Base network configured in your wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd x402manager
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your OnchainKit API key:
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
x402manager/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── x402/         # x402 proxy endpoints
│   ├── dashboard/         # Dashboard page
│   ├── discover/          # API discovery page
│   ├── docs/              # Documentation page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # Web3 providers
├── components/             # React components
│   └── ui/                # UI components
│       ├── header.tsx     # Navigation header
│       ├── footer.tsx     # Site footer
│       └── ...            # Other UI components
├── lib/                    # Utility functions
└── public/                 # Static assets
```

## Usage

### Discovering APIs
1. Navigate to the **Discover** page
2. Use search and filters to find relevant APIs
3. View detailed information including pricing and documentation
4. Use the "Try API" feature to test endpoints

### Managing Your APIs
1. Connect your wallet on the **Dashboard** page
2. Click **Create New API** to register a service
3. Configure upstream URL, pricing, and discoverability
4. Monitor usage and revenue through the analytics dashboard

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
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Adding New Features
1. Create new pages in the `app/` directory
2. Add components to `components/ui/`
3. Update navigation in `components/ui/header.tsx`
4. Follow the retro design system for consistent styling

### Styling Guidelines
- Use the `retro-*` CSS classes for consistent styling
- Maintain the minimalist aesthetic with bold typography
- Follow the black/white/gray color scheme
- Use monospace fonts for technical elements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code style
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

- **Documentation**: Visit the `/docs` page for comprehensive guides
- **Discord**: Join the [CDP Discord](https://discord.com/invite/cdp/) #x402 channel
- **GitHub**: Check the [x402 repository](https://github.com/coinbase/x402) for protocol details
- **Issues**: Report bugs and feature requests through GitHub issues

## Roadmap

- [ ] Database integration for persistent data
- [ ] Advanced analytics and reporting
- [ ] Multi-network support
- [ ] API rate limiting and abuse protection
- [ ] Webhook notifications
- [ ] Team collaboration features
- [ ] Advanced payment models (subscriptions, usage-based)
- [ ] Mobile application

## Acknowledgments

- Built with [OnchainKit](https://onchainkit.xyz) for seamless Web3 integration
- Powered by the [x402 protocol](https://github.com/coinbase/x402)
- Running on [Base](https://base.org) L2 network
- Styled with [Tailwind CSS](https://tailwindcss.com)
