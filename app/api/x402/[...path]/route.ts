/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { x402PaymentProcessor } from '@/lib/x402-payment-processor';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Extract the path from the URL
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    
    // Check for x402 payment header
    const paymentHeaderRaw = request.headers.get('x-payment');
    
    if (!paymentHeaderRaw) {
      // Return 402 Payment Required with payment instructions
      const paymentHeader = x402PaymentProcessor.generatePaymentHeader(
        '50000',
        '100000',
        'base',
        process.env.RECEIVER_WALLET || '0xYourWalletAddress',
        300
      );
      
      return new NextResponse(JSON.stringify({
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: 'base',
          maxAmountRequired: '50000',
          resource: request.url,
          description: 'Access to x402-protected API endpoint',
          mimeType: 'application/json',
          payTo: process.env.RECEIVER_WALLET || '0xYourWalletAddress',
          maxTimeoutSeconds: 300,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
          extra: {
            name: 'USD Coin',
            version: '2'
          }
        }],
        error: 'Payment Required'
      }), {
        status: 402,
        headers: {
          'content-type': 'application/json',
          'x-payment': paymentHeader,
        }
      });
    }
    
    // Parse payment payload
    let paymentPayload;
    try {
      paymentPayload = JSON.parse(Buffer.from(paymentHeaderRaw, 'base64').toString());
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid payment header format' },
        { status: 400 }
      );
    }

    // Build payment requirements
    const paymentRequirements = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '50000',
      resource: request.url,
      description: 'Access to x402-protected API endpoint',
      mimeType: 'application/json',
      payTo: process.env.RECEIVER_WALLET || '0xYourWalletAddress',
      maxTimeoutSeconds: 300,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      extra: {
        name: 'USD Coin',
        version: '2'
      }
    };
    
    // Process payment with real CDP facilitator
    const paymentResult = await x402PaymentProcessor.processPayment(
      paymentPayload,
      paymentRequirements
    );
    
    if (paymentResult.status !== 'success') {
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          details: paymentResult.error 
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
        amount: x402PaymentProcessor.formatUSDCAmount(paymentResult.amount),
        reference: paymentResult.reference,
        transactionHash: paymentResult.transactionHash,
        payer: paymentResult.payer,
        network: paymentResult.network
      },
      data: {
        // Mock API response data - in production, this would proxy to real API
        endpoint: path,
        result: 'success',
        message: 'Your x402 payment has been processed and the requested resource is now available'
      }
    }, {
      headers: {
        'x-payment-response': JSON.stringify({
          status: 'success',
          amount: paymentResult.amount,
          reference: paymentResult.reference,
          transactionHash: paymentResult.transactionHash,
          timestamp: paymentResult.timestamp
        })
      }
    });
    
  } catch (error) {
    console.error('x402 proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const paymentHeaderRaw = request.headers.get('x-payment');
    
    if (!paymentHeaderRaw) {
      const paymentHeader = x402PaymentProcessor.generatePaymentHeader(
        '100000',
        '200000',
        'base',
        process.env.RECEIVER_WALLET || '0xYourWalletAddress',
        300
      );
      
      return new NextResponse(JSON.stringify({
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: 'base',
          maxAmountRequired: '100000',
          resource: request.url,
          description: 'Access to x402-protected API endpoint (POST)',
          mimeType: 'application/json',
          payTo: process.env.RECEIVER_WALLET || '0xYourWalletAddress',
          maxTimeoutSeconds: 300,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          extra: {
            name: 'USD Coin',
            version: '2'
          }
        }],
        error: 'Payment Required'
      }), {
        status: 402,
        headers: {
          'content-type': 'application/json',
          'x-payment': paymentHeader,
        }
      });
    }
    
    // Parse payment payload
    let paymentPayload;
    try {
      paymentPayload = JSON.parse(Buffer.from(paymentHeaderRaw, 'base64').toString());
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid payment header format' },
        { status: 400 }
      );
    }

    // Build payment requirements
    const paymentRequirements = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '100000',
      resource: request.url,
      description: 'Access to x402-protected API endpoint (POST)',
      mimeType: 'application/json',
      payTo: process.env.RECEIVER_WALLET || '0xYourWalletAddress',
      maxTimeoutSeconds: 300,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      extra: {
        name: 'USD Coin',
        version: '2'
      }
    };
    
    // Process payment
    const paymentResult = await x402PaymentProcessor.processPayment(
      paymentPayload,
      paymentRequirements
    );
    
    if (paymentResult.status !== 'success') {
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          details: paymentResult.error 
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
        amount: x402PaymentProcessor.formatUSDCAmount(paymentResult.amount),
        reference: paymentResult.reference,
        transactionHash: paymentResult.transactionHash,
        payer: paymentResult.payer,
        network: paymentResult.network
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
          amount: paymentResult.amount,
          reference: paymentResult.reference,
          transactionHash: paymentResult.transactionHash,
          timestamp: paymentResult.timestamp
        })
      }
    });
    
  } catch (error) {
    console.error('x402 proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
