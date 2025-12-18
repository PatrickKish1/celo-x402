/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface PaymentRequirement {
  network: string;
  asset: string;
  maxAmountRequired: string;
  payTo: string;
  extra?: {
    name?: string;
    version?: string;
  };
}

interface CrossChainPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentRequirement: PaymentRequirement;
  userAddress: string;
  onProceedWithNative: () => void;
  onProceedWithSwap: () => void;
}

export const CrossChainPaymentModal: React.FC<CrossChainPaymentModalProps> = ({
  open,
  onOpenChange,
  paymentRequirement,
  userAddress,
  onProceedWithNative,
  onProceedWithSwap,
}) => {
  const [selectedOption, setSelectedOption] = useState<'native' | 'swap' | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [hasRequiredBalance, setHasRequiredBalance] = useState(false);
  
  const checkUserBalance = useCallback(async () => {
    setIsCheckingBalance(true);
    try {
      // Import wagmi/viem for balance checking
      const { createPublicClient, http, erc20Abi, formatUnits, parseUnits } = await import('viem');
      const { base, baseSepolia } = await import('viem/chains');
      
      // Determine the chain based on network
      const chain = paymentRequirement.network.toLowerCase() === 'base' ? base : baseSepolia;
      
      // Create public client
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });
      
      // Check if it's native token or ERC20
      const isNativeToken = !paymentRequirement.asset || paymentRequirement.asset === '0x0000000000000000000000000000000000000000';
      
      let balance: bigint;
      
      if (isNativeToken) {
        // Get native token balance (ETH)
        balance = await publicClient.getBalance({ 
          address: userAddress as `0x${string}` 
        });
      } else {
        // Get ERC20 token balance
        balance = await publicClient.readContract({
          address: paymentRequirement.asset as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`],
        }) as bigint;
      }
      
      // Convert required amount to bigint (assuming 6 decimals for USDC)
      const requiredAmount = parseUnits(
        (parseFloat(paymentRequirement.maxAmountRequired) / 1_000_000).toString(),
        6
      );
      
      // Check if user has sufficient balance
      setHasRequiredBalance(balance >= requiredAmount);
      
      // console.log(`Balance check: ${formatUnits(balance, 6)} ${paymentRequirement.extra?.name || 'tokens'}, Required: ${formatUnits(requiredAmount, 6)}`);
    } catch (error) {
      console.error('Error checking balance:', error);
      // Default to false on error, but don't block swap option
      setHasRequiredBalance(false);
    } finally {
      setIsCheckingBalance(false);
    }
  }, [paymentRequirement.network, paymentRequirement.asset, paymentRequirement.maxAmountRequired, userAddress]);

  useEffect(() => {
    // Reset state when modal opens
    if (open) {
      setSelectedOption(null);
      checkUserBalance();
    }
  }, [open, checkUserBalance]);


  const formatAmount = (amount: string): string => {
    try {
      // Convert from smallest unit (assuming 6 decimals for USDC)
      const numAmount = parseFloat(amount) / 1_000_000;
      return numAmount.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const handleProceed = () => {
    if (selectedOption === 'native') {
      onProceedWithNative();
    } else if (selectedOption === 'swap') {
      onProceedWithSwap();
    }
    onOpenChange(false);
  };

  const requiredAmount = formatAmount(paymentRequirement.maxAmountRequired);
  const tokenName = paymentRequirement.extra?.name || 'USDC';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Payment Required</DialogTitle>
          <DialogDescription>
            This API requires a payment of {requiredAmount} {tokenName} on {paymentRequirement.network}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-mono font-bold text-foreground">
                  {requiredAmount} {tokenName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-mono text-foreground">{paymentRequirement.network.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-mono text-xs text-foreground">
                  {paymentRequirement.payTo.slice(0, 6)}...{paymentRequirement.payTo.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          {isCheckingBalance ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Checking your balance...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option 1: Use Native Token */}
              <button
                onClick={() => setSelectedOption('native')}
                disabled={!hasRequiredBalance}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedOption === 'native'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
                } ${!hasRequiredBalance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === 'native'
                          ? 'border-primary bg-primary'
                          : 'border-gray-400 dark:border-gray-600'
                      }`}>
                        {selectedOption === 'native' && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <h4 className="font-bold text-foreground">Use {tokenName} Directly</h4>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Pay with {tokenName} you already have on {paymentRequirement.network}
                    </p>
                    {!hasRequiredBalance && (
                      <div className="ml-6 mt-2 flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        Insufficient {tokenName} balance
                      </div>
                    )}
                  </div>
                  {hasRequiredBalance && (
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">
                      AVAILABLE
                    </div>
                  )}
                </div>
              </button>

              {/* Option 2: Swap Another Token */}
              <button
                onClick={() => setSelectedOption('swap')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedOption === 'swap'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
                } cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === 'swap'
                          ? 'border-primary bg-primary'
                          : 'border-gray-400 dark:border-gray-600'
                      }`}>
                        {selectedOption === 'swap' && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <h4 className="font-bold text-foreground">Swap & Pay</h4>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {`Use another token and swap it to ${tokenName} automatically`}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded text-xs font-bold scale-[0.8]">
                    RECOMMENDED
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Warning for insufficient balance */}
          {!isCheckingBalance && !hasRequiredBalance && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <p className="font-bold mb-1">Insufficient {tokenName} Balance</p>
                <p>
                  {`You don't have enough ${tokenName} on ${paymentRequirement.network}. 
                  Select "Swap & Pay" to use another token instead.`}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleProceed}
            disabled={!selectedOption || isCheckingBalance}
          >
            {selectedOption === 'swap' ? 'Proceed to Swap' : 'Proceed with Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

