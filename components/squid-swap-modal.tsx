/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertCircle, ArrowRight, ExternalLink, Search, ChevronDown } from 'lucide-react';
import { squidRouter, type SquidToken, type SquidChain } from '@/lib/squid-router';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import Image from 'next/image';


/**
 * SquidSwapModal - Cross-chain swap interface for x402 payments
 * 
 * FLOW EXPLANATION:
 * 1. User selects SOURCE chain and token (what they want to swap FROM)
 * 2. Modal calculates estimated amount needed based on target amount
 * 3. Squid Router provides a quote for the swap
 * 4. User approves token spending (if not native token)
 * 5. Swap is executed via Squid Router
 * 6. Tokens are swapped and delivered to user's wallet on TARGET chain
 * 7. After swap completes, user can then make the x402 payment using the received tokens
 * 
 * NOTE: The swap delivers tokens to the user's wallet, NOT directly to the x402 service.
 * The user must then initiate the actual x402 payment separately.
 */
interface SquidSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAmount: string; // Amount needed in target token (e.g., USDC on Base) in atomic units
  targetToken: string; // Token address on target chain
  targetChain: string; // Target chain name (e.g., 'base')
  onSwapComplete: (txHash: string) => void; // Called when swap completes, user should then pay x402
}

type SwapStep = 'select' | 'quote' | 'approve' | 'execute' | 'complete' | 'error';

/**
 * Helper function to check if an error is a user rejection
 */
function isUserRejection(error: any): boolean {
  const errorMessage = error.message || error.toString() || '';
  return (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('User denied') ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('User cancelled') ||
    error.code === 4001 || // MetaMask rejection code
    error.code === 'ACTION_REJECTED'
  );
}

export function SquidSwapModal({
  isOpen,
  onClose,
  targetAmount,
  targetToken,
  targetChain,
  onSwapComplete,
}: SquidSwapModalProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // State
  const [currentStep, setCurrentStep] = useState<SwapStep>('select');
  const [visitedSteps, setVisitedSteps] = useState<Set<SwapStep>>(new Set(['select']));
  const [chains, setChains] = useState<SquidChain[]>([]);
  const [tokens, setTokens] = useState<SquidToken[]>([]);
  const [selectedChain, setSelectedChain] = useState<SquidChain | null>(null);
  const [selectedToken, setSelectedToken] = useState<SquidToken | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Dropdown state
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [chainSearch, setChainSearch] = useState('');
  const [tokenSearch, setTokenSearch] = useState('');

  // Load chains on mount
  useEffect(() => {
    if (isOpen) {
      loadChains();
    }
  }, [isOpen]);

  // Load tokens when chain is selected
  useEffect(() => {
    if (selectedChain) {
      loadTokens(selectedChain.chainId);
    }
  }, [selectedChain]);

  const checkBalance = useCallback(async () => {
    if (!selectedToken || !selectedChain || !address) return;

    try {
      // console.log(' [Check Balance] Using SDK method for:', {
      //   chainId: selectedChain.chainId,
      //   tokenAddress: selectedToken.address,
      //   userAddress: address
      // });
      
      // Use SDK to get all balances for this chain (more efficient than individual calls)
      const balances = await squidRouter.getEvmBalances({
        userAddress: address,
        chains: [selectedChain.chainId],
      });
      
      // Find the balance for the selected token
      const tokenBalance = balances.find(b => 
        b.address.toLowerCase() === selectedToken.address.toLowerCase() &&
        b.chainId === selectedChain.chainId
      );
      
      const balance = tokenBalance?.balance || '0';
      // console.log(' [Balance Result]:', {
      //   balance,
      //   humanReadable: squidRouter.parseAmount(balance, selectedToken.decimals),
      //   token: selectedToken.symbol
      // });
      
      setUserBalance(balance);
    } catch (error) {
      console.error('Error checking balance:', error);
      // Fallback to manual method if SDK fails
      try {
        const balance = await squidRouter.getTokenBalance(
          selectedChain.chainId,
          selectedToken.address,
          address as Address
        );
        setUserBalance(balance);
      } catch (fallbackError) {
        console.error('Fallback balance check also failed:', fallbackError);
        setUserBalance('0');
      }
    }
  }, [selectedToken, selectedChain, address]);

  
  // Check balance when token is selected
  useEffect(() => {
    if (selectedToken && selectedChain && address) {
      checkBalance();
    }
  }, [selectedToken, selectedChain, address, checkBalance]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowChainDropdown(false);
        setShowTokenDropdown(false);
      }
    };

    if (showChainDropdown || showTokenDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showChainDropdown, showTokenDropdown]);

  const loadChains = async () => {
    try {
      setIsLoading(true);
      const chainsData = await squidRouter.getChains();
      // console.log(' [Squid Chains Data]:', chainsData);
      // console.log(' [First Chain Sample]:', chainsData[0]);
      setChains(chainsData);
    } catch (error) {
      console.error('Error loading chains:', error);
      setError('Failed to load supported chains');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTokens = async (chainId: string) => {
    try {
      setIsLoading(true);
      const tokensData = await squidRouter.getTokens(chainId);
      // console.log(' [Squid Tokens Data for chain', chainId, ']:', tokensData);
      // console.log(' [First Token Sample]:', tokensData[0]);
      setTokens(tokensData);
    } catch (error) {
      console.error('Error loading tokens:', error);
      setError('Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };


  const getQuote = async () => {
    // console.log(' [Get Quote] Called with:', {
    //   selectedToken: selectedToken?.symbol,
    //   selectedChain: selectedChain?.chainName,
    //   address,
    //   currentStep
    // });

    if (!selectedToken || !selectedChain || !address) {
      console.error(' [Get Quote] Missing required data:', {
        hasToken: !!selectedToken,
        hasChain: !!selectedChain,
        hasAddress: !!address
      });
      setError('Please ensure you have selected a chain and token, and your wallet is connected.');
      return;
    }

    try {
      setCurrentStep('quote');
      setVisitedSteps(prev => new Set([...prev, 'quote']));
      setIsLoading(true);
      setError(null);

      const targetChainId = squidRouter.getChainIdFromName(targetChain);
      
      // Check if same chain and token (no swap needed)
      const isSameChain = selectedChain.chainId === targetChainId;
      const isSameToken = selectedToken.address.toLowerCase() === targetToken.toLowerCase();
      
      if (isSameChain && isSameToken) {
        // No swap needed - proceed directly to native payment
        setError('Same chain and token detected. Please use native payment option instead.');
        setCurrentStep('error');
        return;
      }

      // Get target token details for estimation
      const targetTokens = await squidRouter.getTokens(targetChainId);
      const targetTokenDetails = targetTokens.find(t => 
        t.address.toLowerCase() === targetToken.toLowerCase()
      );
      
      if (!targetTokenDetails) {
        throw new Error('Target token not found');
      }

      // console.log('[Amount Calculation Flow]');
      // console.log('x402 Requirement:', {
      //   token: targetTokenDetails.symbol,
      //   amount: targetAmount,
      //   chain: targetChain,
      //   humanReadable: squidRouter.parseAmount(targetAmount, targetTokenDetails.decimals)
      // });
      // console.log('User wants to swap FROM:', {
      //   token: selectedToken.symbol,
      //   chain: selectedChain.chainName
      // });


      const targetAmountHumanReadable = squidRouter.parseAmount(targetAmount, targetTokenDetails.decimals);
      
      // console.log('Calling SDK getFromAmount...');
      // console.log('Target amount conversion:', {
      //   atomic: targetAmount,
      //   humanReadable: targetAmountHumanReadable,
      //   token: targetTokenDetails.symbol,
      //   decimals: targetTokenDetails.decimals
      // });
      
      const estimatedFromAmountResult = await squidRouter.estimateFromAmount({
        fromToken: selectedToken,           // What user is swapping FROM (e.g., ETH)
        toToken: targetTokenDetails,        // What user needs to receive (e.g., USDC)
        toAmount: targetAmountHumanReadable, // MUST be human-readable (e.g., "0.01" not "10000")
        slippagePercentage: 1.5,
      });

      // SDK returns a human-readable string (e.g., "3.59034790571156")
      // We need to convert it to atomic units for the quote API
      let estimatedFromAmount: string;
      
      // Check if result is already in atomic units (long number string) or human-readable
      if (estimatedFromAmountResult.includes('.')) {
        // It's human-readable, convert to atomic units
        const humanReadable = parseFloat(estimatedFromAmountResult);
        const atomicUnits = Math.ceil(humanReadable * Math.pow(10, selectedToken.decimals));
        estimatedFromAmount = atomicUnits.toString();
        
        // console.log('SDK returned human-readable, converted to atomic:', {
        //   humanReadable: estimatedFromAmountResult,
        //   atomicUnits: estimatedFromAmount,
        //   token: selectedToken.symbol
        // });
      } else {
        // Already in atomic units
        estimatedFromAmount = estimatedFromAmountResult;
        
        // console.log('SDK returned atomic units:', {
        //   atomicUnits: estimatedFromAmount,
        //   humanReadable: squidRouter.parseAmount(estimatedFromAmount, selectedToken.decimals),
        //   token: selectedToken.symbol
        // });
      }
      
      const quoteParams = {
        fromChain: selectedChain.chainId,
        toChain: targetChainId,
        fromToken: selectedToken.address,
        toToken: targetToken,
        fromAmount: estimatedFromAmount, // Correct amount in SOURCE token's atomic units
        fromAddress: address,
        toAddress: address,
        slippage: 1.5,
        enableBoost: true,
        quoteOnly: false,
      };

      // console.log('[Squid Quote] Request params:', quoteParams);

      const quoteData = await squidRouter.getQuote(quoteParams);
      setQuote(quoteData);

      // Check if approval is needed
      const isNativeToken = selectedToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      if (isNativeToken) {
        // No approval needed for native token
        setCurrentStep('execute');
        setVisitedSteps(prev => new Set([...prev, 'execute']));
      } else {
        // Check if we need to approve
        setCurrentStep('approve');
        setVisitedSteps(prev => new Set([...prev, 'approve']));
      }
    } catch (error: any) {
      console.error('Error getting quote:', error);
      
      if (isUserRejection(error)) {
        setError('Transaction was cancelled');
      } else {
        // Show a cleaner error message without all the technical details
        setError('Failed to get quote. Please try again.');
      }
      
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote || !walletClient || !address) return;

    try {
      setCurrentStep('execute');
      setVisitedSteps(prev => new Set([...prev, 'execute']));
      setIsLoading(true);
      setError(null);

      const txRequest = quote.route.transactionRequest;
      
      if (!txRequest) {
        throw new Error('No transaction request in quote');
      }

      // Send transaction via wallet client
      const hash = await walletClient.sendTransaction({
        account: address,
        to: txRequest.target as Address,
        data: txRequest.data as `0x${string}`,
        value: BigInt(txRequest.value || '0'),
        gas: txRequest.gasLimit ? BigInt(txRequest.gasLimit) : undefined,
        gasPrice: txRequest.gasPrice ? BigInt(txRequest.gasPrice) : undefined,
      });

      setTxHash(hash);
      setCurrentStep('complete');
      setVisitedSteps(prev => new Set([...prev, 'complete']));
      
      // Wait a bit for transaction to be included
      setTimeout(() => {
        onSwapComplete(hash);
      }, 2000);
    } catch (error: any) {
      console.error('Error executing swap:', error);
      
      if (isUserRejection(error)) {
        setError('Transaction was cancelled');
      } else {
        setError('Failed to execute swap. Please try again.');
      }
      
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (currentStep !== 'execute' && !isLoading) {
      onClose();
      // Reset state
      setTimeout(() => {
        setCurrentStep('select');
        setSelectedChain(null);
        setSelectedToken(null);
        setQuote(null);
        setError(null);
        setTxHash(null);
      }, 300);
    }
  };

  const getStepStatus = (step: SwapStep): 'pending' | 'active' | 'complete' | 'error' => {
    const stepOrder: SwapStep[] = ['select', 'quote', 'approve', 'execute', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (currentStep === 'error') return 'error';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const canNavigateToStep = (step: SwapStep): boolean => {
    return visitedSteps.has(step);
  };

  const navigateToStep = (step: SwapStep) => {
    if (canNavigateToStep(step) && !isLoading) {
      setCurrentStep(step);
      setError(null);
    }
  };

  // Filter chains and tokens based on search
  const filteredChains = chains.filter(chain => {
    const searchTerm = chainSearch.toLowerCase();
    const networkName = (chain as any).networkName || chain.chainName || '';
    return (
      networkName.toLowerCase().includes(searchTerm) ||
      chain.chainId.toLowerCase().includes(searchTerm) ||
      ((chain as any).networkIdentifier || '').toLowerCase().includes(searchTerm)
    );
  });

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    token.name.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    token.address.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-2xl transition-all ${
        showChainDropdown || showTokenDropdown ? 'max-h-[95vh]' : 'max-h-[90vh]'
      } overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono">Cross-Chain Swap</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {['Select', 'Quote', 'Approve', 'Execute', 'Complete'].map((label, index) => {
            const step = label.toLowerCase() as SwapStep;
            const status = getStepStatus(step);
            const canNavigate = canNavigateToStep(step);
            
            return (
              <div key={label} className="flex items-center">
                <button
                  onClick={() => navigateToStep(step)}
                  disabled={!canNavigate || isLoading}
                  className="flex flex-col items-center disabled:cursor-not-allowed"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      status === 'complete'
                        ? 'bg-green-500 border-green-500 text-white'
                        : status === 'active'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : status === 'error'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-gray-200 border-gray-300 text-gray-500'
                    } ${canNavigate && !isLoading ? 'hover:scale-110 cursor-pointer' : ''}`}
                  >
                    {status === 'complete' ? (
                      <Check className="w-4 h-4" />
                    ) : status === 'error' ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : status === 'active' && isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-mono ${canNavigate ? '' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </button>
                {index < 4 && (
                  <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>

        {/* Always visible: Payment Info */}
        <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg mb-4">
          <h3 className="font-mono font-bold mb-2">Payment Required</h3>
          <p className="text-sm">
            You need <span className="font-bold">{squidRouter.parseAmount(targetAmount, 6)} USDC</span> on {targetChain}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Select a token from any chain to swap
          </p>
        </div>

        {/* General Error Display (always visible when there's an error in select step) */}
        {error && currentStep === 'select' && (
          <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg mb-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <h3 className="font-mono font-bold text-red-800 text-sm">Error</h3>
            </div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Always visible: Selection UI */}
        <div className="space-y-4">
          {/* Chain Selection Dropdown */}
          <div>
            <label className="block font-mono font-bold text-sm mb-2">
              Select Source Chain
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setShowChainDropdown(!showChainDropdown);
                  setShowTokenDropdown(false);
                }}
                className="w-full p-3 border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-300 transition-colors"
              >
                {selectedChain ? (
                  <div className="flex items-center gap-2">
                    {(selectedChain as any).chainIconURI && (
                      <Image
                        src={(selectedChain as any).chainIconURI} 
                        alt={(selectedChain as any).networkName || selectedChain.chainName}
                        className="w-6 h-6 rounded-full"
                        width={24}
                        height={24}
                      />
                    )}
                    <span className="font-mono">
                      {(selectedChain as any).networkName || selectedChain.chainName}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-gray-500">Choose a chain...</span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showChainDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-black rounded-lg shadow-xl">
                  <div className="p-2 border-b-2 border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                      <Input
                        value={chainSearch}
                        onChange={(e) => setChainSearch(e.target.value)}
                        placeholder="Search chains..."
                        className="pl-8"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {filteredChains.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 font-mono text-sm">
                        No chains found
                      </div>
                    ) : (
                      filteredChains.map((chain) => {
                        const networkName = (chain as any).networkName || chain.chainName;
                        const chainIcon = (chain as any).chainIconURI;
                        
                        return (
                          <button
                            key={chain.chainId}
                            onClick={() => {
                              // console.log(' Selected chain:', chain);
                              setSelectedChain(chain);
                              setSelectedToken(null);
                              setShowChainDropdown(false);
                              setChainSearch('');
                            }}
                            className={`w-full p-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                              selectedChain?.chainId === chain.chainId ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {chainIcon && (
                                <Image 
                                  src={chainIcon} 
                                  alt={networkName}
                                  className="w-8 h-8 rounded-full"
                                  width={24}
                                  height={24}
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-mono font-bold text-sm">{networkName}</div>
                                <div className="text-xs text-gray-600">Chain ID: {chain.chainId}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Token Selection Dropdown */}
          {selectedChain && (
            <div>
              <label className="block font-mono font-bold text-sm mb-2">
                Select Token to Swap
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 font-mono">Loading tokens...</span>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowTokenDropdown(!showTokenDropdown);
                      setShowChainDropdown(false);
                    }}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {selectedToken?.logoURI && (
                        <Image 
                          src={selectedToken.logoURI} 
                          alt={selectedToken.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          width={24}
                          height={24}
                        />
                      )}
                      <span className="font-mono">
                        {selectedToken ? `${selectedToken.symbol} - ${selectedToken.name}` : 'Choose a token...'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showTokenDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-black rounded-lg shadow-xl">
                      <div className="p-2 border-b-2 border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            placeholder="Search tokens..."
                            className="pl-8"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {filteredTokens.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 font-mono text-sm">
                            No tokens found
                          </div>
                        ) : (
                          filteredTokens.map((token) => (
                            <button
                              key={token.address}
                              onClick={() => {
                                // console.log(' Selected token:', token);
                                setSelectedToken(token);
                                setShowTokenDropdown(false);
                                setTokenSearch('');
                              }}
                              className={`w-full p-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                                selectedToken?.address === token.address ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {token.logoURI && (
                                    <Image 
                                      src={token.logoURI} 
                                      alt={token.symbol}
                                      className="w-6 h-6 rounded-full"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      width={24}
                                      height={24}
                                    />
                                  )}
                                  <div>
                                    <div className="font-mono font-bold">{token.symbol}</div>
                                    <div className="text-xs text-gray-600">{token.name}</div>
                                  </div>
                                </div>
                                {selectedToken?.address === token.address && userBalance && (
                                  <div className="text-right">
                                    <div className="text-xs text-gray-600">Balance:</div>
                                    <div className="font-mono text-sm">
                                      {squidRouter.parseAmount(userBalance, selectedToken.decimals)} {selectedToken.symbol}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selection Summary */}
          {selectedChain && selectedToken && (
            <div className="p-4 border-2 border-gray-300 bg-gray-50 rounded-lg">
              <h4 className="font-mono font-bold text-sm mb-3">Selection Summary</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Chain:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {(selectedChain as any).chainIconURI && (
                      <Image 
                        src={(selectedChain as any).chainIconURI} 
                        alt={(selectedChain as any).networkName}
                        className="w-6 h-6 rounded-full"
                        width={24}
                        height={24}
                      />
                    )}
                    <div>
                      <div className="font-mono font-bold">
                        {(selectedChain as any).networkName || selectedChain.chainName}
                      </div>
                      <div className="text-xs text-gray-600">Chain ID: {selectedChain.chainId}</div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <span className="text-gray-600">Token:</span>
                  <div className="mt-1">
                    <div className="font-mono font-bold">{selectedToken.symbol} - {selectedToken.name}</div>
                    <div className="text-xs text-gray-600 break-all">Address: {selectedToken.address}</div>
                    {userBalance && selectedToken && (
                      <div className="text-xs mt-1">
                        <span className="text-gray-600">Your Balance: </span>
                        <span className="font-mono font-bold">
                          {squidRouter.parseAmount(userBalance, selectedToken.decimals)} {selectedToken.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Section - Only show when proceeding with swap */}
        {currentStep !== 'select' && (
          <div className="mt-6 space-y-4 border-t-2 pt-6">
            {/* Step 2: Quote Display */}
            {currentStep === 'quote' && quote && (
            <>
              <div className="p-4 border-2 border-black bg-gray-50 rounded-lg">
                <h3 className="font-mono font-bold mb-3">Swap Quote</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span className="font-mono">
                      {squidRouter.parseAmount(quote.route.estimate.fromAmount, selectedToken!.decimals)}{' '}
                      {selectedToken!.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-mono">
                      {squidRouter.parseAmount(quote.route.estimate.toAmount, 6)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-mono">{quote.route.estimate.exchangeRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Time:</span>
                    <span className="font-mono">~{Math.ceil(quote.route.estimate.estimatedRouteDuration / 60)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Impact:</span>
                    <span className="font-mono">{quote.route.estimate.aggregatePriceImpact}%</span>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 font-mono">Preparing swap...</span>
                </div>
              ) : null}
              </>
            )}

            {/* Step 3: Approve (if needed) */}
            {currentStep === 'approve' && (
            <div className="p-4 border-2 border-yellow-500 bg-yellow-50 rounded-lg">
              <h3 className="font-mono font-bold mb-2">Token Approval Required</h3>
              <p className="text-sm mb-4">
                You need to approve Squid Router to spend your {selectedToken?.symbol}
              </p>
              <Button
                onClick={executeSwap}
                disabled={isLoading}
                className="w-full font-mono"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Approve & Swap'
                )}
              </Button>
            </div>
            )}

            {/* Step 4: Execute */}
            {currentStep === 'execute' && (
            <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
              <h3 className="font-mono font-bold mb-2">Executing Swap</h3>
              <p className="text-sm mb-4">
                {isLoading 
                  ? 'Please confirm the transaction in your wallet...'
                  : 'Ready to execute swap'}
              </p>
              {!isLoading && (
                <Button
                  onClick={executeSwap}
                  className="w-full font-mono"
                >
                  Execute Swap
                </Button>
              )}
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 font-mono">Processing...</span>
                </div>
              )}
            </div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 'complete' && txHash && (
            <div className="p-4 border-2 border-green-500 bg-green-50 rounded-lg">
              <div className="flex items-center mb-3">
                <Check className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="font-mono font-bold">Swap Complete!</h3>
              </div>
              <p className="text-sm mb-3">
                Your cross-chain swap has been initiated. The payment will be processed once confirmed.
              </p>
              <a
                href={`https://axelarscan.io/gmp/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline text-sm font-mono"
              >
                Track on Axelar Scan
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
            )}

            {/* Error State */}
            {currentStep === 'error' && error && (
            <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="font-mono font-bold text-red-800">Error</h3>
              </div>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={() => {
                  setCurrentStep('select');
                  setError(null);
                }}
                className="mt-4 w-full font-mono"
                // variant=""
              >
                Try Again
              </Button>
            </div>
            )}
          </div>
        )}

        {/* Sticky Footer with Get Quote Button */}
        {currentStep === 'select' && (
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-gray-200 mt-4">
            {selectedToken && selectedChain ? (
              <Button
                onClick={getQuote}
                disabled={isLoading || !address}
                className="w-full font-mono"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : !address ? (
                  'Connect Wallet to Continue'
                ) : (
                  'Get Quote'
                )}
              </Button>
            ) : (
              <div className="text-center p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 font-mono">
                  {!selectedChain ? '👆 Select a source chain first' : '👆 Select a token to swap'}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

