import { NextRequest, NextResponse } from 'next/server';

// Proxy to backend API for validation
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/validate?userAddress=0x...
 * Get validation usage stats for a user
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    
    // Build backend API URL with query params
    const backendUrl = new URL(`${BACKEND_API_URL}/api/validate`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    // Make request to backend API
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Validate proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown proxy error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/validate
 * Validate an x402 service
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // Build backend API URL
    const backendUrl = `${BACKEND_API_URL}/api/validate`;

    // Make request to backend API
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Validate proxy error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

