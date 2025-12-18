/**
 * Cross-Chain Payment Service Export
 * 
 * Export all cross-chain payment services and utilities
 * for easy import in other projects
 */

export { crossChainPayment, CrossChainPaymentService } from '../cross-chain-payment';
export type { CrossChainPaymentParams, CrossChainPaymentResult } from '../cross-chain-payment';

export { squidRouter, SquidRouterService } from '../squid-router';
export type {
  SquidToken,
  SquidChain,
  SquidQuoteParams,
  SquidQuoteResponse,
  SquidStatusParams,
  SquidStatusResponse,
} from '../squid-router';

