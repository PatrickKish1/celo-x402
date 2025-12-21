import { NextRequest, NextResponse } from 'next/server';

// Proxy to backend API for reports
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/reports
 * Get list of services with validation issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build backend API URL with query params
    const backendUrl = new URL(`${BACKEND_API_URL}/api/reports`);
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
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Reports proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown proxy error' },
      { status: 500 }
    );
  }
}

