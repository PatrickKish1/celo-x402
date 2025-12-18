/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * Response Validation Service
 * Validates that x402 endpoints actually return data, not just 200 with empty responses
 */

export interface ValidationResult {
  isValid: boolean;
  hasData: boolean;
  dataType?: 'json' | 'text' | 'binary' | 'empty';
  dataSize?: number;
  error?: string;
  warnings?: string[];
}

export interface ValidationOptions {
  minDataSize?: number; // Minimum bytes for valid response
  requireJson?: boolean; // Require valid JSON
  requireFields?: string[]; // Required fields in JSON response
  timeout?: number; // Request timeout in ms
}

/**
 * Validate that an x402 endpoint returns actual data
 */
export async function validateEndpointResponse(
  url: string,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const {
    minDataSize = 10, // At least 10 bytes
    requireJson = false,
    requireFields = [],
    timeout = 10000,
  } = options;

  try {
    // Make a test request (without payment to see if it returns 402)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    // If 402, that's expected - endpoint is working
    if (response.status === 402) {
      return {
        isValid: true,
        hasData: false, // No data yet, but endpoint is valid
        dataType: 'empty',
        dataSize: 0,
        warnings: ['Endpoint requires payment (expected for x402)'],
      };
    }

    // If not 200, endpoint might be broken
    if (response.status !== 200) {
      return {
        isValid: false,
        hasData: false,
        error: `Endpoint returned status ${response.status}`,
      };
    }

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const isText = contentType.includes('text/');

    let bodyText: string;
    let dataSize: number;

    if (isJson || isText) {
      bodyText = await response.text();
      dataSize = new Blob([bodyText]).size;
    } else {
      // For binary data, get as blob
      const blob = await response.blob();
      dataSize = blob.size;
      bodyText = '';
    }

    // Check minimum size
    if (dataSize < minDataSize) {
      return {
        isValid: false,
        hasData: false,
        dataType: isJson ? 'json' : isText ? 'text' : 'binary',
        dataSize,
        error: `Response too small (${dataSize} bytes, minimum ${minDataSize} bytes)`,
      };
    }

    // Validate JSON if required
    if (requireJson || isJson) {
      try {
        const jsonData = JSON.parse(bodyText);

        // Check for empty objects/arrays
        if (typeof jsonData === 'object') {
          if (Array.isArray(jsonData) && jsonData.length === 0) {
            return {
              isValid: false,
              hasData: false,
              dataType: 'json',
              dataSize,
              error: 'Response is an empty array',
            };
          }

          if (!Array.isArray(jsonData) && Object.keys(jsonData).length === 0) {
            return {
              isValid: false,
              hasData: false,
              dataType: 'json',
              dataSize,
              error: 'Response is an empty object',
            };
          }

          // Check for required fields
          if (requireFields.length > 0) {
            const missingFields = requireFields.filter(field => !(field in jsonData));
            if (missingFields.length > 0) {
              return {
                isValid: false,
                hasData: true,
                dataType: 'json',
                dataSize,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                warnings: ['Response missing some expected fields'],
              };
            }
          }
        }

        return {
          isValid: true,
          hasData: true,
          dataType: 'json',
          dataSize,
        };
      } catch (parseError) {
        return {
          isValid: false,
          hasData: false,
          dataType: 'text',
          dataSize,
          error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
        };
      }
    }

    // For non-JSON responses, just check size
    return {
      isValid: true,
      hasData: dataSize >= minDataSize,
      dataType: isText ? 'text' : 'binary',
      dataSize,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isValid: false,
        hasData: false,
        error: 'Request timeout',
      };
    }

    return {
      isValid: false,
      hasData: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate multiple endpoints in batch
 */
export async function validateEndpointsBatch(
  urls: string[],
  options: ValidationOptions = {}
): Promise<Map<string, ValidationResult>> {
  const results = new Map<string, ValidationResult>();

  // Validate in parallel with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async url => {
        const result = await validateEndpointResponse(url, options);
        return { url, result };
      })
    );

    batchResults.forEach(({ url, result }) => {
      results.set(url, result);
    });

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Check if response has meaningful data based on output schema
 */
export function validateResponseAgainstSchema(
  responseData: any,
  outputSchema?: any
): ValidationResult {
  if (!outputSchema || !outputSchema.output) {
    // No schema to validate against
    return {
      isValid: true,
      hasData: responseData != null,
      dataType: typeof responseData === 'object' ? 'json' : 'text',
    };
  }

  const schema = outputSchema.output;
  const warnings: string[] = [];

  // Check if response matches expected structure
  if (typeof schema === 'object' && !Array.isArray(schema)) {
    const requiredFields = Object.keys(schema.properties || {}).filter(
      (key: string) => schema.required?.includes(key)
    );

    if (requiredFields.length > 0 && typeof responseData === 'object') {
      const missingFields = requiredFields.filter(
        (field: string) => !(field in responseData)
      );

      if (missingFields.length > 0) {
        return {
          isValid: false,
          hasData: true,
          dataType: 'json',
          error: `Missing required fields from schema: ${missingFields.join(', ')}`,
          warnings,
        };
      }
    }
  }

  // Check for empty/null values in critical fields
  if (typeof responseData === 'object' && responseData !== null) {
    const hasData = Object.keys(responseData).length > 0;
    if (!hasData) {
      return {
        isValid: false,
        hasData: false,
        dataType: 'json',
        error: 'Response object is empty',
      };
    }
  }

  return {
    isValid: true,
    hasData: true,
    dataType: 'json',
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

