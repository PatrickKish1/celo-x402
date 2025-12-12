// x402 Wallet Integration and Payment Flow
// Client-side utilities for wallet connection and payment signing

import { createWalletClient, custom, type WalletClient } from 'viem';
import { base, baseSepolia, polygon, optimism, arbitrum } from 'viem/chains';
import type { PaymentPayload, PaymentRequirements } from './x402-payment-processor';

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
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Web3 wallet detected');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.currentAddress = accounts[0];

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string;

      // Create wallet client
      this.walletClient = createWalletClient({
        account: this.currentAddress as `0x${string}`,
        chain: this.getChainByChainId(parseInt(chainId, 16)),
        transport: custom(window.ethereum),
      });

      console.log('Wallet connected:', this.currentAddress);

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
      const chainId = await window.ethereum?.request({
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
      if (!window.ethereum) {
        throw new Error('No Web3 wallet detected');
      }

      const chain = CHAIN_MAP[network];
      if (!chain) {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Try to switch network
      try {
        await window.ethereum.request({
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
   * Add network to wallet
   */
  private async addNetwork(network: string): Promise<void> {
    const chain = CHAIN_MAP[network];
    if (!chain) {
      throw new Error(`Unsupported network: ${network}`);
    }

    await window.ethereum?.request({
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

      // Generate nonce
      const nonce = this.generateNonce();

      // Create authorization parameters
      const validAfter = Math.floor(Date.now() / 1000).toString();
      const validBefore = (Math.floor(Date.now() / 1000) + requirements.maxTimeoutSeconds).toString();

      // Build EIP-712 typed data for EIP-3009
      const typedData = {
        domain: {
          name: requirements.extra.name,
          version: requirements.extra.version,
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
      const signature = await this.walletClient.signTypedData(typedData);

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
   * Make a paid request to an x402 endpoint
   */
  async makePaymentRequest(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    try {
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

      // Parse payment requirements
      const requirements: PaymentRequirements = await initialResponse.json();

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

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

