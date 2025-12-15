import { NextRequest, NextResponse } from 'next/server';

// Proxy to backend API for discovery (backend handles rate limiting and caching)
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    
    // Build backend API URL with query params
    const backendUrl = new URL(`${BACKEND_API_URL}/api/discovery`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    console.log(`Proxying discovery request to backend: ${backendUrl.toString()}`);

    // Make request to backend API (backend handles rate limiting and caching)
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

