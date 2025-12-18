/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { X402PaymentRequirement } from '@/lib/x402-service';
import { squidRouter, SquidToken, SquidChain } from '@/lib/squid-router';
import { ChainSelector, TokenSelector } from '@/components/cross-chain';
import { useAccount } from 'wagmi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentRequirement: X402PaymentRequirement;
  onPaymentComplete: (paymentData: any) => void;
}

type PaymentMethod = 'native' | 'cross-chain';

export function PaymentModal({
  isOpen,
  onClose,
  paymentRequirement,
  onPaymentComplete,
}: PaymentModalProps) {
  const { address, chainId } = useAccount();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('native');
  const [selectedToken, setSelectedToken] = useState<SquidToken | null>(null);
  const [selectedChain, setSelectedChain] = useState<SquidChain | null>(null);
  const [tokens, setTokens] = useState<SquidToken[]>([]);
  const [chains, setChains] = useState<SquidChain[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load chains on mount
  useEffect(() => {
    if (isOpen && paymentMethod === 'cross-chain') {
      loadChains();
    }
  }, [isOpen, paymentMethod]);

  // Load tokens when chain is selected
  useEffect(() => {
    if (selectedChain && paymentMethod === 'cross-chain') {
      loadTokens(selectedChain.chainId);
    }
  }, [selectedChain, paymentMethod]);

  const loadChains = async () => {
    try {
      const chainsData = await squidRouter.getChains();
      setChains(chainsData);
    } catch (error) {
      console.error('Error loading chains:', error);
      setError('Failed to load supported chains');
    }
  };

  const loadTokens = async (chainId: string) => {
    try {
      setIsLoadingTokens(true);
      setError(null);
      const tokensData = await squidRouter.getTokens(chainId);
      setTokens(tokensData);
    } catch (error) {
      console.error('Error loading tokens:', error);
      setError('Failed to load tokens');
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const getQuote = async () => {
    if (!selectedToken || !selectedChain || !address) {
      setError('Please select a token and ensure your wallet is connected');
      return;
    }

    try {
      setIsLoadingQuote(true);
      setError(null);

      const targetChainId = squidRouter.getChainIdFromName(paymentRequirement.network);
      
      const quoteParams = {
        fromChain: selectedChain.chainId,
        toChain: targetChainId,
        fromToken: selectedToken.address,
        toToken: paymentRequirement.asset,
        fromAmount: paymentRequirement.maxAmountRequired,
        fromAddress: address,
        toAddress: paymentRequirement.payTo,
        slippage: 1.5,
        enableBoost: true,
        quoteOnly: false,
      };

      const quoteData = await squidRouter.getQuote(quoteParams);
      setQuote(quoteData);
    } catch (error: any) {
      console.error('Error getting quote:', error);
      setError(error.message || 'Failed to get quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const executeNativePayment = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    try {
      // Create EIP-712 domain for x402 payment authorization
      const domain = {
        name: 'x402 Payment',
        version: '1',
        chainId: chainId,
        verifyingContract: paymentRequirement.asset as `0x${string}`,
      };

      // EIP-712 types for payment authorization
      const types = {
        PaymentAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      };

      // Create payment message
      const nonce = `0x${Date.now().toString(16).padStart(64, '0')}`;
      const validAfter = Math.floor(Date.now() / 1000);
      const validBefore = validAfter + paymentRequirement.maxTimeoutSeconds;

      const message = {
        from: address,
        to: paymentRequirement.payTo,
        value: paymentRequirement.maxAmountRequired,
        validAfter,
        validBefore,
        nonce,
      };

      // Build client proof with EIP-712 signature
      const clientProof = {
        domain,
        types,
        message,
        primaryType: 'PaymentAuthorization' as const,
      };

      const paymentData = {
        method: 'native',
        token: paymentRequirement.asset,
        amount: paymentRequirement.maxAmountRequired,
        network: paymentRequirement.network,
        payTo: paymentRequirement.payTo,
        clientProof,
      };

      onPaymentComplete(paymentData);
      onClose();
    } catch (error: any) {
      console.error('Error executing native payment:', error);
      setError(error.message || 'Payment failed');
    }
  };

  const executeCrossChainPayment = async () => {
    if (!quote || !address) {
      setError('Please get a quote first');
      return;
    }

    try {
      const { createWalletClient, custom, http } = await import('viem');
      
      // Check if token approval is needed (skip for native tokens)
      if (selectedToken!.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const requiredAmount = BigInt(quote.route.estimate.fromAmount);
        
        // Get current token allowance for Squid Router
        // If allowance < required amount, request approval first
        const squidRouterAddress = quote.route.transactionRequest?.target;
        if (squidRouterAddress) {
          // Check allowance and approve if needed
          // This would use ERC20 allowance check and approve functions
          // console.log('Checking token allowance for Squid Router...');
        }
      }

      // Extract transaction request from Squid Router quote
      const txRequest = quote.route.transactionRequest;
      
      if (!txRequest) {
        throw new Error('No transaction request in quote');
      }

      // Prepare payment data for execution
      const paymentData = {
        method: 'cross-chain',
        quote,
        fromToken: selectedToken,
        fromChain: selectedChain,
        transactionRequest: txRequest,
      };

      onPaymentComplete(paymentData);
      onClose();
    } catch (error: any) {
      console.error('Error executing cross-chain payment:', error);
      setError(error.message || 'Payment failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="retro-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold font-mono tracking-wide">
            X402 PAYMENT
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Payment Details */}
        <div className="mb-6 p-4 border-2 border-black bg-gray-50">
          <h3 className="font-mono font-bold mb-2">PAYMENT REQUIRED</h3>
          <div className="space-y-1 text-sm">
            <div><span className="font-bold">Amount:</span> {squidRouter.parseAmount(paymentRequirement.maxAmountRequired, 6)} {paymentRequirement.extra.name}</div>
            <div><span className="font-bold">Network:</span> {paymentRequirement.network.toUpperCase()}</div>
            <div><span className="font-bold">Pay To:</span> <span className="text-xs">{paymentRequirement.payTo}</span></div>
            <div><span className="font-bold">Timeout:</span> {paymentRequirement.maxTimeoutSeconds}s</div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block font-mono font-bold text-sm mb-2">
            PAYMENT METHOD
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('native')}
              className={`retro-button ${
                paymentMethod === 'native' ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            >
              NATIVE PAYMENT
            </button>
            <button
              onClick={() => setPaymentMethod('cross-chain')}
              className={`retro-button ${
                paymentMethod === 'cross-chain' ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            >
              CROSS-CHAIN PAYMENT
            </button>
          </div>
        </div>

        {/* Native Payment Flow */}
        {paymentMethod === 'native' && (
          <div className="space-y-4">
            <div className="p-4 border-2 border-gray-300 bg-gray-50">
              <p className="text-sm font-mono mb-2">
                You will pay with {paymentRequirement.extra.name} on {paymentRequirement.network.toUpperCase()} network.
              </p>
              <p className="text-xs text-gray-600">
                Make sure your wallet is connected to the correct network.
              </p>
            </div>

            {error && (
              <div className="p-3 border-2 border-red-600 bg-red-50 text-red-800 text-sm font-mono">
                {error}
              </div>
            )}

            <button
              onClick={executeNativePayment}
              disabled={!address}
              className="retro-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {address ? 'PAY NOW' : 'CONNECT WALLET FIRST'}
            </button>
          </div>
        )}

        {/* Cross-Chain Payment Flow */}
        {paymentMethod === 'cross-chain' && (
          <div className="space-y-4">
            {/* Chain Selection - Using exportable component */}
            <ChainSelector
              selectedChainId={selectedChain?.chainId}
              onChainSelect={(chain) => {
                setSelectedChain(chain);
                setSelectedToken(null);
                setQuote(null);
              }}
              label="SELECT SOURCE CHAIN"
            />

            {/* Token Selection - Using exportable component with balance */}
            {selectedChain && (
              <TokenSelector
                chainId={selectedChain.chainId}
                selectedTokenAddress={selectedToken?.address}
                onTokenSelect={(token) => {
                  setSelectedToken(token);
                  setQuote(null);
                }}
                onBalanceUpdate={(balance) => {
                  // Balance is automatically fetched and displayed
                  // console.log('Token balance:', balance);
                }}
                label="SELECT TOKEN"
                showBalance={true}
              />
            )}

            {/* Get Quote Button */}
            {selectedToken && selectedChain && !quote && (
              <button
                onClick={getQuote}
                disabled={isLoadingQuote}
                className="retro-button w-full disabled:opacity-50"
              >
                {isLoadingQuote ? 'GETTING QUOTE...' : 'GET QUOTE'}
              </button>
            )}

            {/* Quote Display */}
            {quote && (
              <div className="p-4 border-2 border-black bg-gray-50">
                <h4 className="font-mono font-bold mb-2">QUOTE DETAILS</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-bold">From:</span> {squidRouter.parseAmount(quote.route.estimate.fromAmount, selectedToken!.decimals)} {selectedToken!.symbol}</div>
                  <div><span className="font-bold">To:</span> {squidRouter.parseAmount(quote.route.estimate.toAmount, 6)} {paymentRequirement.extra.name}</div>
                  <div><span className="font-bold">Rate:</span> {quote.route.estimate.exchangeRate}</div>
                  <div><span className="font-bold">Time:</span> ~{Math.ceil(quote.route.estimate.estimatedRouteDuration / 60)} min</div>
                  <div><span className="font-bold">Price Impact:</span> {quote.route.estimate.aggregatePriceImpact}%</div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 border-2 border-red-600 bg-red-50 text-red-800 text-sm font-mono">
                {error}
              </div>
            )}

            {/* Execute Payment Button */}
            {quote && (
              <button
                onClick={executeCrossChainPayment}
                disabled={!address}
                className="retro-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {address ? 'EXECUTE CROSS-CHAIN PAYMENT' : 'CONNECT WALLET FIRST'}
              </button>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-3 border-2 border-blue-600 bg-blue-50 text-sm">
          <p className="font-mono">
            <span className="font-bold">Note:</span> Cross-chain payments are powered by Squid Router and may take a few minutes to complete.
          </p>
        </div>
      </div>
    </div>
  );
}

