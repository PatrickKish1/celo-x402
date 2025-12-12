'use client';

import { useState, useEffect } from 'react';
import { X402PaymentRequirement } from '../lib/x402-service';
import { squidRouter, SquidToken, SquidChain } from '../lib/squid-router';
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
      // TODO: Implement native x402 payment using EIP-3009
      // This will involve:
      // 1. Getting user signature for the payment
      // 2. Calling the x402 payment processor
      // 3. Verifying the payment with CDP facilitator
      
      const paymentData = {
        method: 'native',
        token: paymentRequirement.asset,
        amount: paymentRequirement.maxAmountRequired,
        network: paymentRequirement.network,
        payTo: paymentRequirement.payTo,
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
      // TODO: Implement cross-chain payment execution
      // This will involve:
      // 1. Approving token spend if needed
      // 2. Executing the Squid Router transaction
      // 3. Monitoring the cross-chain transfer
      // 4. Once received, trigger the x402 payment
      
      const paymentData = {
        method: 'cross-chain',
        quote,
        fromToken: selectedToken,
        fromChain: selectedChain,
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
            {/* Chain Selection */}
            <div>
              <label className="block font-mono font-bold text-sm mb-2">
                SELECT SOURCE CHAIN
              </label>
              <select
                value={selectedChain?.chainId || ''}
                onChange={(e) => {
                  const chain = chains.find(c => c.chainId === e.target.value);
                  setSelectedChain(chain || null);
                  setSelectedToken(null);
                  setQuote(null);
                }}
                className="retro-input w-full"
              >
                <option value="">Choose a chain...</option>
                {chains.map(chain => (
                  <option key={chain.chainId} value={chain.chainId}>
                    {chain.chainName}
                  </option>
                ))}
              </select>
            </div>

            {/* Token Selection */}
            {selectedChain && (
              <div>
                <label className="block font-mono font-bold text-sm mb-2">
                  SELECT TOKEN
                </label>
                {isLoadingTokens ? (
                  <div className="text-sm font-mono text-gray-600">Loading tokens...</div>
                ) : (
                  <select
                    value={selectedToken?.address || ''}
                    onChange={(e) => {
                      const token = tokens.find(t => t.address === e.target.value);
                      setSelectedToken(token || null);
                      setQuote(null);
                    }}
                    className="retro-input w-full"
                  >
                    <option value="">Choose a token...</option>
                    {tokens.map(token => (
                      <option key={token.address} value={token.address}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
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

