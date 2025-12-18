/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route to forward requests to x402 resources
 * This bypasses CORS restrictions by making requests from the server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, headers, body: requestBody, params } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL is absolute
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Add query parameters if provided
    if (params && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([key, value]) => {
        if (key && value) {
          targetUrl.searchParams.append(key, value as string);
        }
      });
    }

    // Prepare headers for the proxied request
    const proxyHeaders: Record<string, string> = {
      'User-Agent': 'X402-Manager/1.0',
      ...headers,
    };

    // Remove potentially problematic headers
    delete proxyHeaders['host'];
    delete proxyHeaders['connection'];
    delete proxyHeaders['content-length'];

    // Prepare request options
    const requestOptions: RequestInit = {
      method: method || 'GET',
      headers: proxyHeaders,
      body: method !== 'GET' && requestBody ? requestBody : undefined,
    };

    // Make the proxied request
    const startTime = Date.now();
    const response = await fetch(targetUrl.toString(), requestOptions);
    const responseTime = Date.now() - startTime;

    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      // Filter out headers that shouldn't be forwarded
      if (
        !['content-encoding', 'transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())
      ) {
        responseHeaders[key] = value;
      }
    });

    // Get response body
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch (error) {
      console.error('Error reading response body:', error);
      responseBody = 'Unable to read response body';
    }

    // Return proxied response
    return NextResponse.json(
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: responseTime,
        url: targetUrl.toString(),
      },
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Proxied-By': 'X402-Manager',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

