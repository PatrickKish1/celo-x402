/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// x402 Wallet Integration and Payment Flow
// Client-side utilities for wallet connection and payment signing

import { createWalletClient, custom, type WalletClient } from 'viem';
import { base, baseSepolia, polygon, optimism, arbitrum } from 'viem/chains';
import { getAccount, getWalletClient } from '@wagmi/core';
import type { PaymentPayload, PaymentRequirements } from './x402-payment-processor';
import { config } from './reown-config';

// Type definition for Ethereum provider
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  isMetaMask?: boolean;
  selectedAddress?: string;
  chainId?: string;
  on?(event: string, handler: (...args: any[]) => void): void;
  removeListener?(event: string, handler: (...args: any[]) => void): void;
}

// Helper function to get typed ethereum provider
function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).ethereum as EthereumProvider | undefined;
}

export interface WalletConfig {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export interface SignedPayment {
  payload: PaymentPayload;
  signature: string;
}

// Map network names to viem chains
const CHAIN_MAP: Record<string, any> = {
  'base': base,
  'base-sepolia': baseSepolia,
  'polygon': polygon,
  'optimism': optimism,
  'arbitrum': arbitrum,
};

export class X402WalletService {
  private static instance: X402WalletService;
  private walletClient: WalletClient | null = null;
  private currentAddress: string | null = null;

  static getInstance(): X402WalletService {
    if (!X402WalletService.instance) {
      X402WalletService.instance = new X402WalletService();
    }
    return X402WalletService.instance;
  }

  /**
   * Connect wallet using window.ethereum
   */
  async connectWallet(): Promise<WalletConfig> {
    try {
      const ethereum = getEthereumProvider();
      if (!ethereum) {
        throw new Error('No Web3 wallet detected');
      }

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.currentAddress = accounts[0];

      // Get chain ID
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      }) as string;

      // Create wallet client
      this.walletClient = createWalletClient({
        account: this.currentAddress as `0x${string}`,
        chain: this.getChainByChainId(parseInt(chainId, 16)),
        transport: custom(ethereum),
      });

      // console.log('Wallet connected:', this.currentAddress);

      return {
        address: this.currentAddress,
        chainId: parseInt(chainId, 16),
        isConnected: true,
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet() {
    this.walletClient = null;
    this.currentAddress = null;
  }

  /**
   * Get current wallet config
   */
  async getWalletConfig(): Promise<WalletConfig | null> {
    if (!this.currentAddress) {
      return null;
    }

    try {
      const ethereum = getEthereumProvider();
      const chainId = await ethereum?.request({
        method: 'eth_chainId',
      }) as string;

      return {
        address: this.currentAddress,
        chainId: parseInt(chainId, 16),
        isConnected: true,
      };
    } catch {
      return null;
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(network: string): Promise<boolean> {
    try {
      if (!network) {
        throw new Error('Network parameter is required');
      }

      const ethereum = getEthereumProvider();
      if (!ethereum) {
        throw new Error('No Web3 wallet detected');
      }

      const chain = CHAIN_MAP[network];
      if (!chain) {
        throw new Error(`Unsupported network: ${network}. Supported networks: ${Object.keys(CHAIN_MAP).join(', ')}`);
      }

      // Try to switch network
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chain.id.toString(16)}` }],
        });
        return true;
      } catch (switchError: any) {
        // Network not added, try to add it
        if (switchError.code === 4902) {
          await this.addNetwork(network);
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('Network switch error:', error);
      return false;
    }
  }

  /**
   * Wait for chain change to complete
   */
  private async waitForChainChange(targetChainId: number, timeoutMs: number = 10000): Promise<void> {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error('No Web3 wallet detected');
    }

    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(new Error(`Timeout waiting for chain change to ${targetChainId}`));
        }
      }, timeoutMs);

      const checkChain = async () => {
        if (isResolved) return;
        try {
          const currentChainId = await ethereum.request({
            method: 'eth_chainId',
          }) as string;
          const currentChainIdNum = parseInt(currentChainId, 16);
          
          if (currentChainIdNum === targetChainId) {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              resolve();
            }
          }
        } catch (error) {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(error);
          }
        }
      };

      // Listen for chain change event
      const handleChainChanged = (chainId: string) => {
        if (isResolved) return;
        const chainIdNum = parseInt(chainId, 16);
        if (chainIdNum === targetChainId) {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve();
          }
        }
      };

      let pollInterval: NodeJS.Timeout | null = null;

      const cleanup = () => {
        clearTimeout(timeout);
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };

      // Check immediately
      checkChain();

      // Also listen for chainChanged event
      if (ethereum.on) {
        ethereum.on('chainChanged', handleChainChanged);
      }

      // Poll every 500ms as fallback
      pollInterval = setInterval(() => {
        if (!isResolved) {
          checkChain();
        }
      }, 500);
    });
  }

  /**
   * Add network to wallet
   */
  private async addNetwork(network: string): Promise<void> {
    const chain = CHAIN_MAP[network];
    if (!chain) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const ethereum = getEthereumProvider();
    await ethereum?.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chain.id.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls.default.http,
        blockExplorerUrls: chain.blockExplorers?.default ? [chain.blockExplorers.default.url] : undefined,
      }],
    });
  }

  /**
   * Sign EIP-3009 authorization for x402 payment
   * This is the core payment signing function
   */
  async signPaymentAuthorization(
    requirements: PaymentRequirements
  ): Promise<SignedPayment> {
    try {
      if (!this.walletClient || !this.currentAddress) {
        throw new Error('Wallet not connected');
      }

      // Validate requirements before using them
      if (!requirements.extra || !requirements.extra.name) {
        throw new Error('Payment requirements missing token information (extra.name)');
      }
      if (!requirements.asset) {
        throw new Error('Payment requirements missing asset address');
      }
      if (!requirements.network) {
        throw new Error('Payment requirements missing network');
      }
      if (!requirements.payTo) {
        throw new Error('Payment requirements missing payTo address');
      }

      // Ensure wallet is on correct network before signing
      const requiredChainId = this.getChainIdFromNetwork(requirements.network);
      let walletConfig = await this.getWalletConfig();
      
      if (walletConfig && walletConfig.chainId !== requiredChainId) {
        console.log(`[X402Wallet] Switching from chain ${walletConfig.chainId} to ${requiredChainId} for network ${requirements.network}`);
        
        // Switch network and wait for the change to complete
        const switchSuccess = await this.switchNetwork(requirements.network);
        if (!switchSuccess) {
          throw new Error(`Failed to switch to network ${requirements.network} (chainId: ${requiredChainId})`);
        }
        
        // Wait for chain change event or poll for chain change
        await this.waitForChainChange(requiredChainId, 10000); // 10 second timeout
        
        // Re-initialize wallet client after chain switch
        await this.initializeFromWagmi(true, this.currentAddress);
        
        // Verify chain change
        walletConfig = await this.getWalletConfig();
        if (!walletConfig || walletConfig.chainId !== requiredChainId) {
          throw new Error(`Wallet is still on chain ${walletConfig?.chainId}, expected ${requiredChainId}. Please switch networks manually.`);
        }
      }

      // Generate nonce
      const nonce = this.generateNonce();

      // Create authorization parameters
      const validAfter = Math.floor(Date.now() / 1000).toString();
      const validBefore = (Math.floor(Date.now() / 1000) + (requirements.maxTimeoutSeconds || 300)).toString();

      // Build EIP-712 typed data for EIP-3009
      const typedData = {
        domain: {
          name: requirements.extra.name,
          version: requirements.extra.version || '2',
          chainId: this.getChainIdFromNetwork(requirements.network),
          verifyingContract: requirements.asset as `0x${string}`,
        },
        types: {
          TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
          ],
        },
        primaryType: 'TransferWithAuthorization' as const,
        message: {
          from: this.currentAddress as `0x${string}`,
          to: requirements.payTo as `0x${string}`,
          value: BigInt(requirements.maxAmountRequired),
          validAfter: BigInt(validAfter),
          validBefore: BigInt(validBefore),
          nonce: nonce as `0x${string}`,
        },
      };

      // Sign the typed data
      if (!this.currentAddress) {
        throw new Error('No wallet address available');
      }

      const signature = await this.walletClient.signTypedData({
        account: this.currentAddress as `0x${string}`,
        ...typedData,
      });

      // Build payment payload
      const payload: PaymentPayload = {
        x402Version: requirements.x402Version,
        scheme: requirements.scheme,
        network: requirements.network,
        payload: {
          signature,
          authorization: {
            from: this.currentAddress,
            to: requirements.payTo,
            value: requirements.maxAmountRequired,
            validAfter,
            validBefore,
            nonce,
          },
        },
      };

      return {
        payload,
        signature,
      };
    } catch (error) {
      console.error('Payment signing error:', error);
      throw error;
    }
  }

  /**
   * Initialize wallet from Wagmi/Reown
   */
  async initializeFromWagmi(isConnected?: boolean, address?: string): Promise<void> {
    try {
      // If parameters are provided, use them directly
      if (isConnected && address) {
        this.currentAddress = address;
        
        // Get wallet client from wagmi
        if (typeof window !== 'undefined' && config) {
          try {
            const walletClient = await getWalletClient(config);
            if (walletClient) {
              this.walletClient = walletClient;
              // console.log('Wallet initialized from Wagmi:', this.currentAddress);
              return;
            }
          } catch (error) {
            console.warn('Could not get wallet client from Wagmi, trying fallback:', error);
          }
        }
      }
      
      // Fallback: Try to get account from wagmi config
      if (typeof window !== 'undefined' && config) {
        const account = getAccount(config);
        if (account.address) {
          this.currentAddress = account.address;
          
          // Get wallet client from wagmi
          const walletClient = await getWalletClient(config);
          if (walletClient) {
            this.walletClient = walletClient;
            // console.log('Wallet initialized from Wagmi:', this.currentAddress);
            return;
          }
        }
      }
      
      // Final fallback: try window.ethereum
      const ethereum = getEthereumProvider();
      if (ethereum && this.currentAddress) {
        const chainId = await ethereum.request({
          method: 'eth_chainId',
        }) as string;
        
        this.walletClient = createWalletClient({
          account: this.currentAddress as `0x${string}`,
          chain: this.getChainByChainId(parseInt(chainId, 16)),
          transport: custom(ethereum),
        });
        // console.log('Wallet initialized from window.ethereum:', this.currentAddress);
      }
    } catch (error) {
      console.error('Error initializing from Wagmi:', error);
      throw error;
    }
  }

  /**
   * Make a paid request to an x402 endpoint
   */
  async makePaymentRequest(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    try {
      // Ensure wallet is initialized
      if (!this.walletClient || !this.currentAddress) {
        await this.initializeFromWagmi();
      }

      if (!this.walletClient || !this.currentAddress) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // First request - get payment requirements
      const initialResponse = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'Accept': 'application/json',
        },
      });

      // If not 402, return the response
      if (initialResponse.status !== 402) {
        return initialResponse;
      }

      // Parse payment requirements - the 402 response has an 'accepts' array
      const responseData = await initialResponse.json();
      
      // Extract the first payment requirement from the accepts array
      let requirements: PaymentRequirements;
      if (responseData.accepts && Array.isArray(responseData.accepts) && responseData.accepts.length > 0) {
        const firstAccept = responseData.accepts[0];
        requirements = {
          x402Version: responseData.x402Version || 1,
          scheme: firstAccept.scheme || 'exact',
          network: firstAccept.network,
          maxAmountRequired: firstAccept.maxAmountRequired,
          resource: firstAccept.resource || url,
          description: firstAccept.description,
          mimeType: firstAccept.mimeType,
          payTo: firstAccept.payTo,
          maxTimeoutSeconds: firstAccept.maxTimeoutSeconds || 300,
          asset: firstAccept.asset,
          extra: firstAccept.extra || { name: 'USD Coin', version: '2' },
        };
      } else {
        // Fallback: assume the response itself is the requirements
        requirements = responseData as PaymentRequirements;
      }

      // Validate requirements
      if (!requirements.network) {
        throw new Error('Payment requirements missing network information');
      }
      if (!requirements.asset) {
        throw new Error('Payment requirements missing asset information');
      }
      if (!requirements.extra || !requirements.extra.name) {
        // Provide defaults if extra is missing
        requirements.extra = requirements.extra || { name: 'USD Coin', version: '2' };
      }

      // Ensure wallet is on correct network
      const walletConfig = await this.getWalletConfig();
      if (walletConfig) {
        const requiredChainId = this.getChainIdFromNetwork(requirements.network);
        if (walletConfig.chainId !== requiredChainId) {
          await this.switchNetwork(requirements.network);
        }
      }

      // Sign payment
      const signedPayment = await this.signPaymentAuthorization(requirements);

      // Encode payment payload as base64
      const paymentHeader = Buffer.from(JSON.stringify(signedPayment.payload)).toString('base64');

      // Retry request with payment
      const paidResponse = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'X-PAYMENT': paymentHeader,
          'Accept': 'application/json',
        },
      });

      return paidResponse;
    } catch (error) {
      console.error('Payment request error:', error);
      throw error;
    }
  }

  /**
   * Generate random nonce for EIP-3009
   */
  private generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return `0x${Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Get viem chain by chain ID
   */
  private getChainByChainId(chainId: number): any {
    const entry = Object.entries(CHAIN_MAP).find(
      ([, chain]) => chain.id === chainId
    );
    return entry ? entry[1] : base; // Default to base
  }

  /**
   * Get chain ID from network name
   */
  private getChainIdFromNetwork(network: string): number {
    const chain = CHAIN_MAP[network];
    return chain?.id || base.id;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.walletClient && !!this.currentAddress;
  }

  /**
   * Get current address
   */
  getAddress(): string | null {
    return this.currentAddress;
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance(network: string): Promise<string> {
    try {
      if (!this.walletClient || !this.currentAddress) {
        throw new Error('Wallet not connected');
      }

      // This would call the ERC-20 balanceOf function
      // Placeholder implementation
      return '0';
    } catch (error) {
      console.error('Balance fetch error:', error);
      return '0';
    }
  }
}

export const x402Wallet = X402WalletService.getInstance();

