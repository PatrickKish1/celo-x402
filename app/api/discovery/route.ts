import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from '../../../lib/rate-limiter';

const CDP_BAZAAR_URL = 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources';

export async function GET(request: NextRequest) {
  try {
    // Wait for rate limit token before making request
    await rateLimiters.cdp.waitForToken();
    
    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    
    // Build CDP API URL with query params
    const cdpUrl = new URL(CDP_BAZAAR_URL);
    searchParams.forEach((value, key) => {
      cdpUrl.searchParams.append(key, value);
    });

    console.log(`Proxying CDP Bazaar request: ${cdpUrl.toString()} (${rateLimiters.cdp.getTokenCount().toFixed(2)} tokens available)`);

    // Make request to CDP API from server-side (no CORS issues)
    const response = await fetch(cdpUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'X402-Manager/1.0',
      },
    });

    if (!response.ok) {
      // If rate limited, return 429 with retry-after header
      if (response.status === 429) {
        console.error('CDP API rate limited - this should not happen with our rate limiter!');
        return NextResponse.json(
          { error: 'Rate limited. Please try again in a moment.' },
          { 
            status: 429,
            headers: {
              'Retry-After': '2',
            }
          }
        );
      }
      
      console.error('CDP API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `CDP API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`Successfully proxied ${data.items?.length || 0} services`);

    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown proxy error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

