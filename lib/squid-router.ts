/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// Squid Router Integration for Cross-Chain Token Swaps
// Documentation: https://docs.squidrouter.com

const SQUID_API_BASE_URL = 'https://v2.api.squidrouter.com/v2';
const SQUID_INTEGRATOR_ID = process.env.NEXT_PUBLIC_SQUID_INTEGRATOR_ID || 'x402-manager';

// Special address for native ETH on Ethereum chains
const NATIVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export interface SquidToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: string;
  logoURI?: string;
  coingeckoId?: string;
}

export interface SquidChain {
  chainId: string;
  chainName: string;
  chainType: string;
  networkName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
  };
  rpc: string[];
  internalRpc?: string;
  chainIconURI?: string;
  blockExplorerUrls?: string[];
}

export interface SquidQuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  toAddress: string;
  slippage?: number; // Default 1.0 (1%)
  enableBoost?: boolean;
  quoteOnly?: boolean;
}

export interface SquidRoute {
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    sendAmount: string;
    exchangeRate: string;
    aggregatePriceImpact: string;
    estimatedRouteDuration: number;
    aggregateSlippage: number;
    actions: any[];
    gasCosts: any[];
    feeCosts: any[];
  };
  transactionRequest?: {
    routeType: string;
    target: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  params: SquidQuoteParams;
}

export interface SquidQuoteResponse {
  route: SquidRoute;
}

export interface SquidStatusParams {
  transactionId: string;
  requestId?: string;
  fromChainId: string;
  toChainId: string;
}

export interface SquidStatusResponse {
  id: string;
  status: 'success' | 'partial_success' | 'needs_gas' | 'ongoing' | 'not_found';
  gasStatus?: string;
  isGMPTransaction?: boolean;
  axelarTransactionUrl?: string;
  fromChain: {
    chainData: SquidChain;
    transactionId: string;
    transactionUrl: string;
    blockNumber: number;
  };
  toChain?: {
    chainData: SquidChain;
    transactionId?: string;
    transactionUrl?: string;
    blockNumber?: number;
  };
  timeSpent?: {
    call_time: number;
    express_execute_time?: number;
    total_time: number;
  };
  error?: {
    message: string;
    errorType: string;
  };
}

export class SquidRouterService {
  private static instance: SquidRouterService;
  private chainsCache: SquidChain[] | null = null;
  private tokensCache: Map<string, SquidToken[]> = new Map();

  static getInstance(): SquidRouterService {
    if (!SquidRouterService.instance) {
      SquidRouterService.instance = new SquidRouterService();
    }
    return SquidRouterService.instance;
  }

  /**
   * Get all supported chains
   */
  async getChains(): Promise<SquidChain[]> {
    if (this.chainsCache) {
      return this.chainsCache;
    }

    try {
      const response = await fetch(`${SQUID_API_BASE_URL}/chains`, {
        headers: {
          'x-integrator-id': SQUID_INTEGRATOR_ID,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chains: ${response.statusText}`);
      }

      const data = await response.json();
      this.chainsCache = data.chains || [];
      return this.chainsCache;
    } catch (error) {
      console.error('Error fetching Squid chains:', error);
      throw error;
    }
  }

  /**
   * Get all tokens for a specific chain
   */
  async getTokens(chainId?: string): Promise<SquidToken[]> {
    const cacheKey = chainId || 'all';
    
    if (this.tokensCache.has(cacheKey)) {
      return this.tokensCache.get(cacheKey)!;
    }

    try {
      const url = chainId 
        ? `${SQUID_API_BASE_URL}/tokens?chainId=${chainId}`
        : `${SQUID_API_BASE_URL}/tokens`;

      const response = await fetch(url, {
        headers: {
          'x-integrator-id': SQUID_INTEGRATOR_ID,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }

      const data = await response.json();
      const tokens = data.tokens || [];
      this.tokensCache.set(cacheKey, tokens);
      return tokens;
    } catch (error) {
      console.error('Error fetching Squid tokens:', error);
      throw error;
    }
  }

  /**
   * Get a quote for a cross-chain swap
   */
  async getQuote(params: SquidQuoteParams): Promise<SquidQuoteResponse> {
    try {
      const requestBody = {
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        slippage: params.slippage || 1.0,
        enableBoost: params.enableBoost !== undefined ? params.enableBoost : true,
        quoteOnly: params.quoteOnly || false,
      };

      const response = await fetch(`${SQUID_API_BASE_URL}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-integrator-id': SQUID_INTEGRATOR_ID,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get quote: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Squid quote:', error);
      throw error;
    }
  }

  /**
   * Check the status of a cross-chain transaction
   */
  async getStatus(params: SquidStatusParams): Promise<SquidStatusResponse> {
    try {
      const queryParams = new URLSearchParams({
        transactionId: params.transactionId,
        fromChainId: params.fromChainId,
        toChainId: params.toChainId,
      });

      if (params.requestId) {
        queryParams.append('requestId', params.requestId);
      }

      const response = await fetch(
        `${SQUID_API_BASE_URL}/status?${queryParams.toString()}`,
        {
          headers: {
            'x-integrator-id': SQUID_INTEGRATOR_ID,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Squid status:', error);
      throw error;
    }
  }

  /**
   * Convert a token address to the format Squid expects
   * Native ETH uses a special address
   */
  normalizeTokenAddress(address: string, chainId: string): string {
    // If it's already the native ETH address, return it
    if (address.toLowerCase() === NATIVE_ETH_ADDRESS.toLowerCase()) {
      return NATIVE_ETH_ADDRESS;
    }

    // Check if it's address(0) or 0x0, convert to native ETH address
    if (address === '0x0000000000000000000000000000000000000000' || address === '0x0') {
      return NATIVE_ETH_ADDRESS;
    }

    return address;
  }

  /**
   * Get chain ID mapping for common chain names
   */
  getChainIdFromName(chainName: string): string {
    const chainMap: Record<string, string> = {
      'ethereum': '1',
      'base': '8453',
      'base-sepolia': '84532',
      'polygon': '137',
      'arbitrum': '42161',
      'optimism': '10',
      'avalanche': '43114',
      'bsc': '56',
      'fantom': '250',
      'moonbeam': '1284',
      'celo': '42220',
      'kava': '2222',
      'filecoin': '314',
      'linea': '59144',
      'scroll': '534352',
    };

    return chainMap[chainName.toLowerCase()] || chainName;
  }

  /**
   * Format amount to the correct decimals
   */
  formatAmount(amount: string, decimals: number): string {
    const value = parseFloat(amount);
    return (value * Math.pow(10, decimals)).toString();
  }

  /**
   * Parse amount from contract format to human-readable
   */
  parseAmount(amount: string, decimals: number): string {
    const value = BigInt(amount);
    const divisor = BigInt(Math.pow(10, decimals));
    return (Number(value) / Number(divisor)).toFixed(6);
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.chainsCache = null;
    this.tokensCache.clear();
  }
}

export const squidRouter = SquidRouterService.getInstance();

