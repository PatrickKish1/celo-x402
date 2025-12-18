/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */


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
  type: 'evm' | 'cosmos' | 'solana' | 'sui'; // Token chain type
  volatility: string; // Token volatility level
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
      return this.chainsCache || [];
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
      const tokens = (data.tokens || []).map((token: any) => ({
        ...token,
        // Ensure required SDK fields are present
        type: token.type ?? 'evm',
        volatility: token.volatility ?? 'stable',
      }));
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
   * Fetch token balance for a given address on a chain
   * Uses external API or RPC calls
   */
  async getTokenBalance(
    chainId: string,
    tokenAddress: string,
    userAddress: string
  ): Promise<string> {
    try {
      // For native tokens, use RPC call
      if (tokenAddress.toLowerCase() === NATIVE_ETH_ADDRESS.toLowerCase()) {
        const chain = await this.getChainById(chainId);
        if (!chain?.rpc?.[0]) {
          throw new Error(`No RPC URL found for chain ${chainId}`);
        }

        // Use viem to get balance
        const { createPublicClient, http, formatEther } = await import('viem');
        const { mainnet, base, polygon, arbitrum, optimism } = await import('viem/chains');
        
        const chainMap: Record<string, any> = {
          '1': mainnet,
          '8453': base,
          '137': polygon,
          '42161': arbitrum,
          '10': optimism,
        };

        const viemChain = chainMap[chainId];
        if (!viemChain) {
          throw new Error(`Unsupported chain for balance check: ${chainId}`);
        }

        const publicClient = createPublicClient({
          chain: viemChain,
          transport: http(chain.rpc[0]),
        });

        const balance = await publicClient.getBalance({
          address: userAddress as `0x${string}`,
        });

        return balance.toString();
      }

      // For ERC20 tokens, use balanceOf call
      const chain = await this.getChainById(chainId);
      if (!chain?.rpc?.[0]) {
        throw new Error(`No RPC URL found for chain ${chainId}`);
      }

      const { createPublicClient, http } = await import('viem');
      const { mainnet, base, polygon, arbitrum, optimism } = await import('viem/chains');
      
      const chainMap: Record<string, any> = {
        '1': mainnet,
        '8453': base,
        '137': polygon,
        '42161': arbitrum,
        '10': optimism,
      };

      const viemChain = chainMap[chainId];
      if (!viemChain) {
        throw new Error(`Unsupported chain for balance check: ${chainId}`);
      }

      const publicClient = createPublicClient({
        chain: viemChain,
        transport: http(chain.rpc[0]),
      });

      // ERC20 balanceOf ABI
      const balance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
        ],
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      }) as bigint;

      return balance.toString();
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }

  /**
   * Get chain by chain ID
   */
  async getChainById(chainId: string): Promise<SquidChain | null> {
    const chains = await this.getChains();
    return chains.find(c => c.chainId === chainId) || null;
  }

  /**
   * Estimate fromAmount needed to receive a specific toAmount
   * Uses CoinGecko prices for approximation
   */
  async estimateFromAmount(params: {
    fromToken: SquidToken;
    toToken: SquidToken;
    toAmount: string;
    slippagePercentage?: number;
  }): Promise<string> {
    try {
      const { Squid } = await import('@0xsquid/sdk');
      
      // Initialize Squid SDK - use correct base URL without /v2 suffix
      // SDK will append endpoints like /sdk-info, /route, etc.
      const squid = new Squid({
        baseUrl: 'https://apiplus.squidrouter.com', // Correct URL from docs
        integratorId: SQUID_INTEGRATOR_ID,
      });
      
      await squid.init();
      
      // Get estimated from amount
      // Cast to any because SquidToken has all required fields but TypeScript can't verify SDK's internal Token type
      const result = await squid.getFromAmount({
        fromToken: params.fromToken as any,
        toToken: params.toToken as any,
        toAmount: params.toAmount,
        slippagePercentage: params.slippagePercentage || 1.5,
      });
      
      return result;
    } catch (error) {
      console.error('Error estimating fromAmount:', error);
      // console.log('Using fallback price estimation...');
      
      // Fallback: Manual estimation based on token prices
      // This is a rough estimate - we need to convert between token units
      const fromDecimals = params.fromToken.decimals;
      const toDecimals = params.toToken.decimals;
      
      // Get USD prices if available from token data
      const fromPrice = (params.fromToken as any).usdPrice || 1;
      const toPrice = (params.toToken as any).usdPrice || 1;
      
      // Convert toAmount to human-readable
      const toAmountInUnits = Number(params.toAmount) / Math.pow(10, toDecimals);
      
      // Calculate USD value needed
      const usdValue = toAmountInUnits * toPrice;
      
      // Calculate how many from tokens needed for that USD value
      const fromAmountInUnits = usdValue / fromPrice;
      
      // Add slippage buffer (default 1.5% becomes 1.015)
      const slippage = (params.slippagePercentage || 1.5) / 100;
      const fromAmountWithSlippage = fromAmountInUnits * (1 + slippage);
      
      // Convert back to atomic units
      const fallbackAmount = BigInt(Math.ceil(fromAmountWithSlippage * Math.pow(10, fromDecimals)));
      
      // console.log('Fallback calculation:', {
      //   toAmount: params.toAmount,
      //   toDecimals,
      //   toPrice,
      //   toAmountInUnits,
      //   usdValue,
      //   fromPrice,
      //   fromAmountInUnits,
      //   fromAmountWithSlippage,
      //   fromDecimals,
      //   fallbackAmount: fallbackAmount.toString()
      // });
      
      return fallbackAmount.toString();
    }
  }

  /**
   * Get all EVM token balances for a user across multiple chains
   * This is much more efficient than checking each token individually
   */
  async getEvmBalances(params: {
    userAddress: string;
    chains?: (string | number)[];
  }): Promise<Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
    chainId: string;
    logoURI?: string;
    usdPrice?: number;
  }>> {
    try {
      const { Squid } = await import('@0xsquid/sdk');
      
      // Initialize Squid SDK with correct base URL
      const squid = new Squid({
        baseUrl: 'https://apiplus.squidrouter.com',
        integratorId: SQUID_INTEGRATOR_ID,
      });
      
      await squid.init();
      
      // Get all balances using SDK
      const balances = await squid.getEvmBalances({
        userAddress: params.userAddress,
        chains: params.chains,
      });
      
      return balances as any;
    } catch (error) {
      console.error('Error fetching EVM balances:', error);
      return [];
    }
  }

  /**
   * Get all balances (EVM + Cosmos) for a user
   */
  async getAllBalances(params: {
    evmAddress?: string;
    chainIds?: (string | number)[];
  }): Promise<{
    evmBalances?: Array<{
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      balance: string;
      chainId: string;
      logoURI?: string;
      usdPrice?: number;
    }>;
  }> {
    try {
      const { Squid } = await import('@0xsquid/sdk');
      
      // Initialize Squid SDK with correct base URL
      const squid = new Squid({
        baseUrl: 'https://apiplus.squidrouter.com',
        integratorId: SQUID_INTEGRATOR_ID,
      });
      
      await squid.init();
      
      // Get all balances using SDK
      const balances = await squid.getAllBalances({
        evmAddress: params.evmAddress,
        chainIds: params.chainIds,
      });
      
      return balances as any;
    } catch (error) {
      console.error('Error fetching all balances:', error);
      return {};
    }
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

