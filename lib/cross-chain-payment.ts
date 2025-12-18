/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * Cross-Chain Payment Service
 * 
 * Exportable service for handling cross-chain payments using Squid Router
 * Can be copied and used in other projects
 */

import { squidRouter, SquidQuoteParams, SquidQuoteResponse, SquidStatusParams, SquidStatusResponse } from './squid-router';
import type { PaymentRequirements } from './x402-payment-processor';
import { getWalletClient } from '@wagmi/core';
import { config } from './reown-config';

export interface CrossChainPaymentParams {
  paymentRequirement: PaymentRequirements;
  fromChainId: string;
  fromTokenAddress: string;
  fromAmount: string;
  userAddress: string;
  slippage?: number;
}

export interface CrossChainPaymentResult {
  success: boolean;
  transactionHash?: string;
  transactionId?: string;
  error?: string;
  status?: SquidStatusResponse;
}

/**
 * Cross-Chain Payment Service
 * Handles the complete flow of cross-chain payments for x402 APIs
 */
export class CrossChainPaymentService {
  private static instance: CrossChainPaymentService;

  static getInstance(): CrossChainPaymentService {
    if (!CrossChainPaymentService.instance) {
      CrossChainPaymentService.instance = new CrossChainPaymentService();
    }
    return CrossChainPaymentService.instance;
  }

  /**
   * Execute a cross-chain payment
   * 1. Get quote from Squid Router
   * 2. Approve token if needed
   * 3. Execute the swap
   * 4. Monitor transaction status
   * 5. Once received on destination chain, trigger x402 payment
   */
  async executePayment(params: CrossChainPaymentParams): Promise<CrossChainPaymentResult> {
    try {
      // Step 1: Get quote
      const targetChainId = squidRouter.getChainIdFromName(params.paymentRequirement.network);
      
      const quoteParams: SquidQuoteParams = {
        fromChain: params.fromChainId,
        toChain: targetChainId,
        fromToken: params.fromTokenAddress,
        toToken: params.paymentRequirement.asset,
        fromAmount: params.fromAmount,
        fromAddress: params.userAddress,
        toAddress: params.paymentRequirement.payTo,
        slippage: params.slippage || 1.5,
        enableBoost: true,
        quoteOnly: false,
      };

      const quote = await squidRouter.getQuote(quoteParams);

      // Step 2: Check if approval is needed
      const needsApproval = await this.checkApprovalNeeded(
        params.fromChainId,
        params.fromTokenAddress,
        params.userAddress,
        quote.route.transactionRequest?.target || '',
        params.fromAmount
      );

      if (needsApproval) {
        const approvalTx = await this.approveToken(
          params.fromChainId,
          params.fromTokenAddress,
          quote.route.transactionRequest?.target || '',
          params.userAddress
        );
        
        // Wait for approval to be confirmed
        await this.waitForTransaction(approvalTx, params.fromChainId);
      }

      // Step 3: Execute the swap
      const swapTx = await this.executeSwap(quote, params.userAddress);

      // Step 4: Monitor transaction
      const status = await this.monitorTransaction({
        transactionId: swapTx,
        fromChainId: params.fromChainId,
        toChainId: targetChainId,
      });

      if (status?.status === 'success') {
        return {
          success: true,
          transactionHash: status.toChain?.transactionId || swapTx,
          transactionId: status.id,
          status,
        };
      }

      return {
        success: false,
        error: `Transaction status: ${status?.status}`,
        status,
      };
    } catch (error: any) {
      console.error('Cross-chain payment error:', error);
      return {
        success: false,
        error: error?.message || 'Cross-chain payment failed',
      };
    }
  }

  /**
   * Check if token approval is needed
   */
  private async checkApprovalNeeded(
    chainId: string,
    tokenAddress: string,
    userAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<boolean> {
    try {
      // For native tokens, no approval needed
      if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        return false;
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
        throw new Error(`Unsupported chain: ${chainId}`);
      }

      const chains = await squidRouter.getChains();
      const chain = chains.find(c => c.chainId === chainId);
      if (!chain?.rpc?.[0]) {
        throw new Error(`No RPC URL for chain ${chainId}`);
      }

      const publicClient = createPublicClient({
        chain: viemChain,
        transport: http(chain.rpc[0]),
      });

      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            constant: true,
            inputs: [
              { name: '_owner', type: 'address' },
              { name: '_spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            type: 'function',
          },
        ],
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, spenderAddress as `0x${string}`],
      }) as bigint;

      return allowance < BigInt(amount);
    } catch (error) {
      console.error('Error checking approval:', error);
      // Assume approval is needed if check fails
      return true;
    }
  }

  /**
   * Approve token spending
   */
  private async approveToken(
    chainId: string,
    tokenAddress: string,
    spenderAddress: string,
    userAddress: string
  ): Promise<string> {
    const walletClient = await getWalletClient(config);
    if (!walletClient) {
      throw new Error('Wallet not connected');
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
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const hash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          constant: false,
          inputs: [
            { name: '_spender', type: 'address' },
            { name: '_value', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          type: 'function',
        },
      ],
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
      chain: viemChain,
    });

    return hash;
  }

  /**
   * Execute the swap transaction
   */
  private async executeSwap(quote: SquidQuoteResponse, userAddress: string): Promise<string> {
    const walletClient = await getWalletClient(config);
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    if (!quote.route.transactionRequest) {
      throw new Error('No transaction request in quote');
    }

    const txRequest = quote.route.transactionRequest;
    const chains = await squidRouter.getChains();
    const chain = chains.find(c => c.chainId === quote.route.params.fromChain);
    
    if (!chain) {
      throw new Error(`Chain not found: ${quote.route.params.fromChain}`);
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

    const viemChain = chainMap[quote.route.params.fromChain];
    if (!viemChain) {
      throw new Error(`Unsupported chain: ${quote.route.params.fromChain}`);
    }

    const hash = await walletClient.sendTransaction({
      to: txRequest.target as `0x${string}`,
      data: txRequest.data as `0x${string}`,
      value: BigInt(txRequest.value || '0'),
      gas: BigInt(txRequest.gasLimit || '0'),
      maxFeePerGas: txRequest.maxFeePerGas ? BigInt(txRequest.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: txRequest.maxPriorityFeePerGas ? BigInt(txRequest.maxPriorityFeePerGas) : undefined,
      chain: viemChain,
    });

    return hash;
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForTransaction(txHash: string, chainId: string): Promise<void> {
    const chains = await squidRouter.getChains();
    const chain = chains.find(c => c.chainId === chainId);
    if (!chain?.rpc?.[0]) {
      throw new Error(`No RPC URL for chain ${chainId}`);
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
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const publicClient = createPublicClient({
      chain: viemChain,
      transport: http(chain.rpc[0]),
    });

    await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
  }

  /**
   * Monitor cross-chain transaction status
   */
  async monitorTransaction(params: SquidStatusParams): Promise<SquidStatusResponse> {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await squidRouter.getStatus(params);
        
        if (status.status === 'success' || status.status === 'partial_success') {
          return status;
        }

        if (status.status === 'not_found') {
          // Transaction might not be indexed yet, wait a bit
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          continue;
        }

        // For ongoing transactions, wait and check again
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Error monitoring transaction:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    throw new Error('Transaction monitoring timeout');
  }
}

export const crossChainPayment = CrossChainPaymentService.getInstance();

