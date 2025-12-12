// Multicall3 Service for Batching RPC Calls
// Contract: 0xcA11bde05977b3631167028862bE2a173976CA11 (deployed on 250+ chains)

import { rateLimiters } from './rate-limiter';

export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

export interface Call3 {
  target: string;
  allowFailure: boolean;
  callData: string;
}

export interface Result {
  success: boolean;
  returnData: string;
}

export interface MulticallResult {
  success: boolean;
  results: Result[];
}

/**
 * Multicall3 Service for batching multiple contract reads into a single RPC call
 */
export class MulticallService {
  private static instance: MulticallService;
  
  static getInstance(): MulticallService {
    if (!MulticallService.instance) {
      MulticallService.instance = new MulticallService();
    }
    return MulticallService.instance;
  }

  /**
   * Execute multiple calls in a single transaction using Multicall3
   */
  async aggregate3(
    calls: Call3[],
    rpcUrl: string,
    chainId: number
  ): Promise<MulticallResult> {
    try {
      // Wait for rate limit token
      await rateLimiters.etherscan.waitForToken();

      // Encode the aggregate3 call
      const data = this.encodeAggregate3(calls);

      // Make RPC call
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: MULTICALL3_ADDRESS,
              data,
            },
            'latest',
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC call failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`RPC error: ${result.error.message}`);
      }

      // Decode the results
      const results = this.decodeAggregate3Results(result.result, calls.length);

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('Multicall error:', error);
      return {
        success: false,
        results: [],
      };
    }
  }

  /**
   * Execute multiple calls with value (payable multicall)
   */
  async aggregate3Value(
    calls: Call3[],
    value: string,
    rpcUrl: string,
    chainId: number
  ): Promise<MulticallResult> {
    try {
      await rateLimiters.etherscan.waitForToken();

      const data = this.encodeAggregate3Value(calls);

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: MULTICALL3_ADDRESS,
              data,
              value,
            },
            'latest',
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC call failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`RPC error: ${result.error.message}`);
      }

      const results = this.decodeAggregate3Results(result.result, calls.length);

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('Multicall error:', error);
      return {
        success: false,
        results: [],
      };
    }
  }

  /**
   * Get current block number, timestamp, and chain ID in one call
   */
  async getBlockInfo(rpcUrl: string, chainId: number): Promise<{
    blockNumber: bigint;
    blockTimestamp: bigint;
    chainId: bigint;
  }> {
    try {
      await rateLimiters.etherscan.waitForToken();

      // Function selectors for Multicall3
      const getBlockNumberSelector = '0x42cbb15c'; // getBlockNumber()
      const getCurrentBlockTimestampSelector = '0x0f28c97d'; // getCurrentBlockTimestamp()
      const getChainIdSelector = '0x3408e470'; // getChainId()

      const calls: Call3[] = [
        {
          target: MULTICALL3_ADDRESS,
          allowFailure: false,
          callData: getBlockNumberSelector,
        },
        {
          target: MULTICALL3_ADDRESS,
          allowFailure: false,
          callData: getCurrentBlockTimestampSelector,
        },
        {
          target: MULTICALL3_ADDRESS,
          allowFailure: false,
          callData: getChainIdSelector,
        },
      ];

      const result = await this.aggregate3(calls, rpcUrl, chainId);

      if (!result.success || result.results.length !== 3) {
        throw new Error('Failed to get block info');
      }

      return {
        blockNumber: BigInt(result.results[0].returnData),
        blockTimestamp: BigInt(result.results[1].returnData),
        chainId: BigInt(result.results[2].returnData),
      };
    } catch (error) {
      console.error('Error getting block info:', error);
      throw error;
    }
  }

  /**
   * Get multiple account balances in one call
   */
  async getBalances(
    addresses: string[],
    rpcUrl: string,
    chainId: number
  ): Promise<Map<string, bigint>> {
    try {
      // Function selector for getEthBalance(address)
      const getEthBalanceSelector = '0x4d2301cc';

      const calls: Call3[] = addresses.map(address => ({
        target: MULTICALL3_ADDRESS,
        allowFailure: false,
        callData: getEthBalanceSelector + address.slice(2).padStart(64, '0'),
      }));

      const result = await this.aggregate3(calls, rpcUrl, chainId);

      const balances = new Map<string, bigint>();
      
      if (result.success) {
        addresses.forEach((address, index) => {
          if (result.results[index]?.success) {
            balances.set(address, BigInt(result.results[index].returnData));
          }
        });
      }

      return balances;
    } catch (error) {
      console.error('Error getting balances:', error);
      return new Map();
    }
  }

  /**
   * Encode aggregate3 call data
   */
  private encodeAggregate3(calls: Call3[]): string {
    // Function selector for aggregate3(Call3[] calldata calls)
    const selector = '0x82ad56cb';
    
    // Simplified encoding - in production, use a proper ABI encoder like ethers.js
    // For now, this is a placeholder
    // You would encode the Call3[] array according to ABI encoding rules
    
    return selector;
  }

  /**
   * Encode aggregate3Value call data
   */
  private encodeAggregate3Value(calls: Call3[]): string {
    // Function selector for aggregate3Value(Call3[] calldata calls)
    const selector = '0x174dea71';
    
    return selector;
  }

  /**
   * Decode aggregate3 results
   */
  private decodeAggregate3Results(data: string, expectedLength: number): Result[] {
    // Simplified decoding - in production, use a proper ABI decoder like ethers.js
    // For now, return empty array
    // You would decode the Result[] array according to ABI encoding rules
    
    const results: Result[] = [];
    
    // This is a placeholder - proper ABI decoding would go here
    for (let i = 0; i < expectedLength; i++) {
      results.push({
        success: true,
        returnData: '0x',
      });
    }
    
    return results;
  }
}

export const multicall = MulticallService.getInstance();

/**
 * Helper function to chunk calls for batching
 */
export function chunkCalls<T>(calls: T[], chunkSize: number = 100): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < calls.length; i += chunkSize) {
    chunks.push(calls.slice(i, i + chunkSize));
  }
  return chunks;
}

