// x402 Payment Service for handling payments and facilitator integration
export interface X402PaymentRequest {
  price: string;
  currency: string;
  facilitator: string;
  maxAmount: string;
  nonce: string;
  ttl: number;
}

export interface X402PaymentResponse {
  status: 'success' | 'pending' | 'failed';
  amount: string;
  reference: string;
  transactionHash?: string;
  error?: string;
}

export class X402PaymentService {
  private static instance: X402PaymentService;
  private readonly CDP_FACILITATOR_URL = 'https://facilitator.cdp.coinbase.com';

  static getInstance(): X402PaymentService {
    if (!X402PaymentService.instance) {
      X402PaymentService.instance = new X402PaymentService();
    }
    return X402PaymentService.instance;
  }

  // Parse x402 payment header from 402 response
  parsePaymentHeader(header: string): X402PaymentRequest | null {
    try {
      const params = new URLSearchParams(header);
      return {
        price: params.get('price') || '0',
        currency: params.get('currency') || 'USDC',
        facilitator: params.get('facilitator') || 'cdp',
        maxAmount: params.get('maxAmount') || '0',
        nonce: params.get('nonce') || '',
        ttl: parseInt(params.get('ttl') || '300')
      };
    } catch (error) {
      console.error('Error parsing x402 payment header:', error);
      return null;
    }
  }

  // Generate x402 payment header for 402 response
  generatePaymentHeader(price: string, maxAmount: string, ttl: number = 300): string {
    const nonce = Date.now().toString();
    return `price=${price}&currency=USDC&facilitator=cdp&maxAmount=${maxAmount}&nonce=${nonce}&ttl=${ttl}`;
  }

  // Verify payment with CDP facilitator
  async verifyPayment(paymentHeader: string, clientProof: string): Promise<X402PaymentResponse> {
    try {
      const paymentRequest = this.parsePaymentHeader(paymentHeader);
      if (!paymentRequest) {
        throw new Error('Invalid payment header');
      }

      // Check if payment has expired
      if (Date.now() > (parseInt(paymentRequest.nonce) + paymentRequest.ttl * 1000)) {
        throw new Error('Payment request has expired');
      }

      // TODO: Integrate with actual CDP facilitator verification
      // This would make a call to the facilitator's verify endpoint
      // For now, we'll simulate verification
      
      const response = await fetch(`${this.CDP_FACILITATOR_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentHeader,
          clientProof,
          nonce: paymentRequest.nonce,
          amount: paymentRequest.price
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          status: 'success',
          amount: paymentRequest.price,
          reference: result.reference || this.generateReference(),
          transactionHash: result.transactionHash
        };
      } else {
        throw new Error(`Facilitator verification failed: ${response.status}`);
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        status: 'failed',
        amount: '0',
        reference: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generate a unique reference for the payment
  private generateReference(): string {
    return `x402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if a payment is still valid (not expired)
  isPaymentValid(paymentHeader: string): boolean {
    const paymentRequest = this.parsePaymentHeader(paymentHeader);
    if (!paymentRequest) return false;

    const now = Date.now();
    const paymentTime = parseInt(paymentRequest.nonce);
    const expiryTime = paymentTime + (paymentRequest.ttl * 1000);

    return now < expiryTime;
  }

  // Format USDC amount from atomic units
  formatUSDCAmount(amount: string): string {
    const usdcAmount = parseInt(amount) / 1000000; // USDC has 6 decimals
    return usdcAmount.toFixed(6);
  }

  // Convert USDC amount to atomic units
  toAtomicUnits(amount: string): string {
    const usdcAmount = parseFloat(amount);
    return Math.floor(usdcAmount * 1000000).toString();
  }
}

export const x402Payment = X402PaymentService.getInstance();
