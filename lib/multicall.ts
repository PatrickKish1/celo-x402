/* eslint-disable @typescript-eslint/no-unused-vars */
// Multicall3 Service for Batching RPC Calls
// Contract: 0xcA11bde05977b3631167028862bE2a173976CA11 (deployed on 250+ chains)

import { rateLimiters } from './rate-limiter';
import { encodeFunctionData, decodeFunctionResult, type Abi } from 'viem';

export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

// Multicall3 ABI - only the functions we need
export const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'bool', name: 'allowFailure', type: 'bool' },
          { internalType: 'bytes', name: 'callData', type: 'bytes' }
        ],
        internalType: 'struct Multicall3.Call3[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3',
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'success', type: 'bool' },
          { internalType: 'bytes', name: 'returnData', type: 'bytes' }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'bool', name: 'allowFailure', type: 'bool' },
          { internalType: 'bytes', name: 'callData', type: 'bytes' }
        ],
        internalType: 'struct Multicall3.Call3[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3Value',
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'success', type: 'bool' },
          { internalType: 'bytes', name: 'returnData', type: 'bytes' }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getBlockNumber',
    outputs: [{ internalType: 'uint256', name: 'blockNumber', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentBlockTimestamp',
    outputs: [{ internalType: 'uint256', name: 'timestamp', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getChainId',
    outputs: [{ internalType: 'uint256', name: 'chainid', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
    name: 'getEthBalance',
    outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

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
    return encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: 'aggregate3',
      args: [calls.map(call => ({
        target: call.target as `0x${string}`,
        allowFailure: call.allowFailure,
        callData: call.callData as `0x${string}`
      }))]
    });
  }

  /**
   * Encode aggregate3Value call data
   */
  private encodeAggregate3Value(calls: Call3[]): string {
    return encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: 'aggregate3Value',
      args: [calls.map(call => ({
        target: call.target as `0x${string}`,
        allowFailure: call.allowFailure,
        callData: call.callData as `0x${string}`
      }))]
    });
  }

  /**
   * Decode aggregate3 results
   */
  private decodeAggregate3Results(data: string, expectedLength: number): Result[] {
    try {
      const decoded = decodeFunctionResult({
        abi: MULTICALL3_ABI,
        functionName: 'aggregate3',
        data: data as `0x${string}`
      }) as Array<{ success: boolean; returnData: `0x${string}` }>;

      return decoded.map(result => ({
        success: result.success,
        returnData: result.returnData
      }));
    } catch (error) {
      console.error('Error decoding multicall results:', error);
      // Return empty results array on decode error
      return Array(expectedLength).fill({ success: false, returnData: '0x' });
    }
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

