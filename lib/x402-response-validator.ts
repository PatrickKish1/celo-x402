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
 * Validates by checking keys (not values) against the schema
 * Handles both full schema objects (with input/output) and direct output schemas
 */
export function validateResponseAgainstSchema(
  responseData: any,
  outputSchema?: any
): ValidationResult {
  // Handle case where outputSchema might be the full schema or just the output part
  let schema: any = null;
  
  if (!outputSchema) {
    // No schema to validate against
    return {
      isValid: true,
      hasData: responseData != null,
      dataType: typeof responseData === 'object' ? 'json' : 'text',
    };
  }

  // Extract the output section if it exists
  if (outputSchema.output) {
    schema = outputSchema.output;
  } else if (outputSchema.properties || outputSchema.type) {
    // Schema is already the output part
    schema = outputSchema;
  } else {
    // No valid schema structure
    return {
      isValid: true,
      hasData: responseData != null,
      dataType: typeof responseData === 'object' ? 'json' : 'text',
    };
  }

  const warnings: string[] = [];

  // Check if response matches expected structure (checking keys, not values)
  if (typeof schema === 'object' && !Array.isArray(schema)) {
    const schemaProperties = schema.properties || {};
    const schemaKeys = Object.keys(schemaProperties);
    const requiredFields = schema.required || [];
    const schemaType = schema.type || 'object';

    // Handle array responses
    if (schemaType === 'array' || Array.isArray(schema.items)) {
      if (!Array.isArray(responseData)) {
        return {
          isValid: false,
          hasData: false,
          dataType: 'json',
          error: 'Response is not an array, but schema expects an array',
        };
      }
      
      // Validate first item in array against schema
      if (responseData.length > 0 && schema.items) {
        const itemSchema = schema.items;
        const firstItem = responseData[0];
        if (typeof firstItem === 'object' && itemSchema.properties) {
          const itemProperties = Object.keys(itemSchema.properties);
          const itemKeys = Object.keys(firstItem);
          const missingKeys = itemProperties.filter(key => !itemKeys.includes(key));
          
          if (missingKeys.length > 0 && itemSchema.required) {
            const missingRequired = missingKeys.filter(key => itemSchema.required.includes(key));
            if (missingRequired.length > 0) {
              return {
                isValid: false,
                hasData: true,
                dataType: 'json',
                error: `Array items missing required keys: ${missingRequired.join(', ')}`,
                warnings,
              };
            }
          }
        }
      }
      
      return {
        isValid: responseData.length > 0,
        hasData: responseData.length > 0,
        dataType: 'json',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    // Handle object responses
    if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)) {
      const responseKeys = Object.keys(responseData);
      
      // If schema has properties defined, validate against them
      if (schemaKeys.length > 0) {
        // Check for required fields first (these must exist)
        if (requiredFields.length > 0) {
          const missingRequired = requiredFields.filter(
            (field: string) => !responseKeys.includes(field)
          );

          if (missingRequired.length > 0) {
            return {
              isValid: false,
              hasData: true,
              dataType: 'json',
              error: `Missing required keys from output schema: ${missingRequired.join(', ')}`,
              warnings,
            };
          }
        }

        // Check if response has all expected keys from output.properties
        // This is important - we want to ensure the response matches the expected structure
        const missingExpectedKeys = schemaKeys.filter(
          (key: string) => !responseKeys.includes(key)
        );

        // If more than 30% of expected keys are missing, consider it invalid
        // (allows for some flexibility but ensures core structure matches)
        const missingPercentage = missingExpectedKeys.length / schemaKeys.length;
        if (missingPercentage > 0.3 && schemaKeys.length > 0) {
          return {
            isValid: false,
            hasData: true,
            dataType: 'json',
            error: `Response missing expected keys from output schema: ${missingExpectedKeys.slice(0, 5).join(', ')}${missingExpectedKeys.length > 5 ? '...' : ''}`,
            warnings: [
              `Expected ${schemaKeys.length} keys, found ${responseKeys.length}`,
              ...warnings
            ],
          };
        }

        // Warn about missing optional keys (but don't fail)
        if (missingExpectedKeys.length > 0) {
          warnings.push(`Response missing optional keys: ${missingExpectedKeys.join(', ')}`);
        }

        // Check if response has unexpected keys (extra fields are OK, just warn)
        const unexpectedKeys = responseKeys.filter(
          (key: string) => !schemaKeys.includes(key)
        );
        if (unexpectedKeys.length > 0) {
          warnings.push(`Response contains additional keys (not in schema): ${unexpectedKeys.join(', ')}`);
        }

        // Success: response has all required keys and most expected keys
        return {
          isValid: true,
          hasData: true,
          dataType: 'json',
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      } else {
        // Schema has no properties defined, just check that response is an object with data
        const hasData = responseKeys.length > 0;
        return {
          isValid: hasData,
          hasData,
          dataType: 'json',
          error: hasData ? undefined : 'Response object is empty',
        };
      }
    } else {
      return {
        isValid: false,
        hasData: false,
        dataType: 'json',
        error: 'Response is not an object, but schema expects an object',
      };
    }
  }

  // Check for empty/null values
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

