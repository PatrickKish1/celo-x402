/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { 
  base, 
  baseSepolia, 
  polygon, 
  optimism, 
  arbitrum,
  mainnet,
  sepolia,
  avalanche,
  bsc,
  celo,
  gnosis
} from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { QueryClient } from '@tanstack/react-query';
import { cookieStorage, createStorage, http } from '@wagmi/core'



export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3fbb6bba6f1de962d911bb5b5c9dba88';

// 2. Set up metadata
const metadata = {
  name: 'X402 Manager',
  description: 'Professional platform for managing and discovering x402 APIs',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://x402-manager.com',
  icons: ['/1x402.ico']
};

// 3. Configure supported networks - explicitly list them to avoid undefined values
export const networks = [
  base,
  baseSepolia,
  mainnet,
  sepolia,
  polygon,
  optimism,
  arbitrum,
  avalanche,
  bsc,
  celo,
  gnosis
] as [AppKitNetwork, ...AppKitNetwork[]];
export type Networks = typeof networks;

// 4. Create Wagmi Adapter
// Note: Networks from @reown/appkit/networks already have RPC URLs configured
// The WagmiAdapter will use these RPC URLs automatically for balance fetching
export const wagmiAdapter = new WagmiAdapter({
  projectId: projectId!,
  networks,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});

// 5. Create Query Client
export const queryClient = new QueryClient();

// 6. Create AppKit instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  networks,
  metadata,
  features: {
    analytics: process.env.NODE_ENV === 'production', // Only enable analytics in production to avoid dev errors
    email: true, // Enable email login
    socials: ['google', 'github', 'apple'], // Enable social logins
    emailShowWallets: true, // Show wallet options with email
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': '"Courier New", monospace',
    '--w3m-accent': '#000000',
    '--w3m-border-radius-master': '0px',
  }
});

// Export wagmi config
export const config = wagmiAdapter.wagmiConfig;

