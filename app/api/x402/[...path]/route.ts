import { NextRequest, NextResponse } from 'next/server';
import { x402Payment } from '../../../../lib/x402-payment';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Extract the path from the URL
    const path = params.path.join('/');
    
    // Check for x402 payment header
    const paymentHeader = request.headers.get('x-payment');
    
    if (!paymentHeader) {
      // Return 402 Payment Required with payment instructions
      const paymentHeaderValue = x402Payment.generatePaymentHeader('50000', '100000', 300);
      
      return new NextResponse('Payment Required', {
        status: 402,
        headers: {
          'x-payment': paymentHeaderValue,
          'content-type': 'application/json',
          'x-payment-response': JSON.stringify({
            status: 'payment_required',
            message: 'This endpoint requires x402 payment',
            price: '0.05 USDC',
            maxAmount: '0.10 USDC',
            ttl: 300
          })
        }
      });
    }
    
    // Verify payment with facilitator
    const clientProof = request.headers.get('x-payment-proof') || '';
    const verificationResult = await x402Payment.verifyPayment(paymentHeader, clientProof);
    
    if (verificationResult.status !== 'success') {
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          details: verificationResult.error 
        },
        { status: 402 }
      );
    }
    
    // Payment verified successfully, return the resource
    return NextResponse.json({
      message: 'Payment verified successfully',
      path: path,
      timestamp: new Date().toISOString(),
      payment: {
        amount: verificationResult.amount,
        reference: verificationResult.reference,
        transactionHash: verificationResult.transactionHash
      },
      data: {
        // Mock API response data
        endpoint: path,
        result: 'success',
        message: 'Your x402 payment has been processed and the requested resource is now available'
      }
    }, {
      headers: {
        'x-payment-response': JSON.stringify({
          status: 'success',
          amount: verificationResult.amount,
          reference: verificationResult.reference,
          timestamp: new Date().toISOString()
        })
      }
    });
    
  } catch (error) {
    console.error('x402 proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const paymentHeader = request.headers.get('x-payment');
    
    if (!paymentHeader) {
      const paymentHeaderValue = x402Payment.generatePaymentHeader('100000', '200000', 300);
      
      return new NextResponse('Payment Required', {
        status: 402,
        headers: {
          'x-payment': paymentHeaderValue,
          'content-type': 'application/json',
          'x-payment-response': JSON.stringify({
            status: 'payment_required',
            message: 'This endpoint requires x402 payment',
            price: '0.10 USDC',
            maxAmount: '0.20 USDC',
            ttl: 300
          })
        }
      });
    }
    
    // Verify payment
    const clientProof = request.headers.get('x-payment-proof') || '';
    const verificationResult = await x402Payment.verifyPayment(paymentHeader, clientProof);
    
    if (verificationResult.status !== 'success') {
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          details: verificationResult.error 
        },
        { status: 402 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Payment verified, process the request
    return NextResponse.json({
      message: 'POST request processed successfully',
      path: path,
      body: body,
      timestamp: new Date().toISOString(),
      payment: {
        amount: verificationResult.amount,
        reference: verificationResult.reference,
        transactionHash: verificationResult.transactionHash
      },
      result: {
        status: 'success',
        message: 'Your x402 payment has been processed and the request has been fulfilled',
        data: {
          processed: true,
          endpoint: path,
          method: 'POST'
        }
      }
    }, {
      headers: {
        'x-payment-response': JSON.stringify({
          status: 'success',
          amount: verificationResult.amount,
          reference: verificationResult.reference,
          timestamp: new Date().toISOString()
        })
      }
    });
    
  } catch (error) {
    console.error('x402 proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
