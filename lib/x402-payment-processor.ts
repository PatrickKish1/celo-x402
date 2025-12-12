/* eslint-disable @typescript-eslint/no-explicit-any */
// Real CDP x402 Payment Processor Service
// Handles payment verification and settlement through CDP facilitator

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface PaymentRequirements {
  x402Version: number;
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: {
    name: string;
    version: string;
  };
}

export interface VerificationResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

export interface SettlementResponse {
  success: boolean;
  error?: string;
  transaction?: string;
  networkId?: string;
}

export interface X402PaymentResponse {
  status: 'success' | 'pending' | 'failed';
  amount: string;
  reference: string;
  transactionHash?: string;
  error?: string;
  payer?: string;
  payee?: string;
  network?: string;
  timestamp?: string;
}

export class X402PaymentProcessor {
  private static instance: X402PaymentProcessor;
  private readonly CDP_FACILITATOR_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';

  static getInstance(): X402PaymentProcessor {
    if (!X402PaymentProcessor.instance) {
      X402PaymentProcessor.instance = new X402PaymentProcessor();
    }
    return X402PaymentProcessor.instance;
  }

  /**
   * Get CDP API authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const apiKeyId = process.env.CDP_API_KEY_ID || process.env.NEXT_PUBLIC_CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET || process.env.NEXT_PUBLIC_CDP_API_KEY_SECRET;

    if (!apiKeyId || !apiKeySecret) {
      console.warn('CDP API credentials not configured');
      return {};
    }

    // CDP uses JWT authentication
    const credentials = Buffer.from(`${apiKeyId}:${apiKeySecret}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Verify payment with CDP facilitator
   * This is the real implementation that calls CDP's verify endpoint
   */
  async verifyPayment(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<VerificationResponse> {
    try {
      console.log('Verifying payment with CDP facilitator...');

      const response = await fetch(`${this.CDP_FACILITATOR_URL}/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          paymentPayload,
          paymentRequirements,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Verification failed: ${response.status} ${response.statusText}`
        );
      }

      const result: VerificationResponse = await response.json();
      console.log('Payment verification result:', result);

      return result;
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        isValid: false,
        invalidReason: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Settle payment with CDP facilitator
   * This executes the on-chain transaction
   */
  async settlePayment(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<SettlementResponse> {
    try {
      console.log('Settling payment with CDP facilitator...');

      const response = await fetch(`${this.CDP_FACILITATOR_URL}/settle`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          paymentPayload,
          paymentRequirements,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Settlement failed: ${response.status} ${response.statusText}`
        );
      }

      const result: SettlementResponse = await response.json();
      console.log('Payment settlement result:', result);

      return result;
    } catch (error) {
      console.error('Payment settlement error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown settlement error',
      };
    }
  }

  /**
   * Complete payment flow: verify and settle
   * This is the main method to process a payment
   */
  async processPayment(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<X402PaymentResponse> {
    try {
      // Step 1: Verify the payment
      const verificationResult = await this.verifyPayment(paymentPayload, paymentRequirements);

      if (!verificationResult.isValid) {
        return {
          status: 'failed',
          amount: paymentRequirements.maxAmountRequired,
          reference: this.generateReference(),
          error: verificationResult.invalidReason || 'Payment verification failed',
          network: paymentRequirements.network,
          timestamp: new Date().toISOString(),
        };
      }

      // Step 2: Settle the payment on-chain
      const settlementResult = await this.settlePayment(paymentPayload, paymentRequirements);

      if (!settlementResult.success) {
        return {
          status: 'failed',
          amount: paymentRequirements.maxAmountRequired,
          reference: this.generateReference(),
          error: settlementResult.error || 'Payment settlement failed',
          payer: verificationResult.payer,
          network: paymentRequirements.network,
          timestamp: new Date().toISOString(),
        };
      }

      // Success!
      return {
        status: 'success',
        amount: paymentRequirements.maxAmountRequired,
        reference: this.generateReference(),
        transactionHash: settlementResult.transaction,
        payer: verificationResult.payer,
        payee: paymentRequirements.payTo,
        network: settlementResult.networkId || paymentRequirements.network,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        status: 'failed',
        amount: paymentRequirements.maxAmountRequired,
        reference: this.generateReference(),
        error: error instanceof Error ? error.message : 'Unknown payment processing error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Parse x402 payment header from 402 response
   */
  parsePaymentHeader(header: string): Partial<PaymentRequirements> | null {
    try {
      const params = new URLSearchParams(header);
      return {
        maxAmountRequired: params.get('price') || '0',
        asset: params.get('currency') || 'USDC',
        maxTimeoutSeconds: parseInt(params.get('ttl') || '300'),
      };
    } catch (error) {
      console.error('Error parsing x402 payment header:', error);
      return null;
    }
  }

  /**
   * Generate x402 payment header for 402 response
   */
  generatePaymentHeader(
    price: string,
    maxAmount: string,
    network: string,
    payTo: string,
    ttl: number = 300
  ): string {
    const nonce = Date.now().toString();
    return `price=${price}&maxAmount=${maxAmount}&network=${network}&payTo=${payTo}&currency=USDC&nonce=${nonce}&ttl=${ttl}`;
  }

  /**
   * Check if a payment is still valid (not expired)
   */
  isPaymentValid(paymentHeader: string): boolean {
    const params = new URLSearchParams(paymentHeader);
    const nonce = params.get('nonce');
    const ttl = params.get('ttl');

    if (!nonce || !ttl) return false;

    const now = Date.now();
    const paymentTime = parseInt(nonce);
    const expiryTime = paymentTime + parseInt(ttl) * 1000;

    return now < expiryTime;
  }

  /**
   * Format USDC amount from atomic units (6 decimals)
   */
  formatUSDCAmount(amount: string): string {
    const usdcAmount = parseInt(amount) / 1000000;
    return usdcAmount.toFixed(6);
  }

  /**
   * Convert USDC amount to atomic units (6 decimals)
   */
  toAtomicUnits(amount: string): string {
    const usdcAmount = parseFloat(amount);
    return Math.floor(usdcAmount * 1000000).toString();
  }

  /**
   * Generate a unique reference for the payment
   */
  private generateReference(): string {
    return `x402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get supported networks from facilitator
   */
  async getSupportedNetworks(): Promise<string[]> {
    try {
      const response = await fetch(`${this.CDP_FACILITATOR_URL}/supported`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch supported networks');
      }

      const data = await response.json();
      return data.kinds?.map((k: any) => k.network) || [];
    } catch (error) {
      console.error('Error fetching supported networks:', error);
      // Return default networks
      return ['base', 'base-sepolia'];
    }
  }
}

export const x402PaymentProcessor = X402PaymentProcessor.getInstance();

