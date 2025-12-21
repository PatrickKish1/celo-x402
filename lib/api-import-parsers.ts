/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export interface ParsedEndpoint {
  endpoint: string;
  method: string;
  description?: string;
  queryParams?: Record<string, { type: string; required?: boolean; description?: string }>;
  pathParams?: Record<string, { type: string; description?: string }>;
  requestBody?: any;
  headers?: Record<string, string>;
  outputSchema?: any;
  expectedStatusCode?: number;
}

export interface ParsedApi {
  name: string;
  description?: string;
  baseUrl?: string;
  endpoints: ParsedEndpoint[];
}

/**
 * Parse Swagger/OpenAPI JSON or YAML
 */
export async function parseSwaggerOpenAPI(
  content: string | object,
  isYaml: boolean = false
): Promise<ParsedApi> {
  let spec: any;

  if (typeof content === 'string') {
    if (isYaml) {
      // For YAML, you'd need a YAML parser like 'js-yaml'
      // For now, we'll assume JSON
      throw new Error('YAML parsing not yet implemented. Please provide JSON format.');
    }
    spec = JSON.parse(content);
  } else {
    spec = content;
  }

  const endpoints: ParsedEndpoint[] = [];
  const paths = spec.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) continue;
      if (!operation || typeof operation !== 'object') continue;

      const op = operation as any;

      // Extract query parameters
      const queryParams: Record<string, any> = {};
      if (op.parameters) {
        for (const param of op.parameters) {
          if (param.in === 'query') {
            queryParams[param.name] = {
              type: param.schema?.type || param.type || 'string',
              required: param.required || false,
              description: param.description,
            };
          }
        }
      }

      // Extract path parameters
      const pathParams: Record<string, any> = {};
      if (op.parameters) {
        for (const param of op.parameters) {
          if (param.in === 'path') {
            pathParams[param.name] = {
              type: param.schema?.type || param.type || 'string',
              description: param.description,
            };
          }
        }
      }

      // Extract request body
      let requestBody: any = null;
      if (op.requestBody) {
        const content = op.requestBody.content;
        if (content) {
          const jsonContent = content['application/json'];
          if (jsonContent?.schema) {
            requestBody = jsonContent.schema;
          }
        }
      }

      // Extract response schema (use 200 response)
      let outputSchema: any = null;
      if (op.responses) {
        const successResponse = op.responses['200'] || op.responses['201'] || op.responses['204'];
        if (successResponse?.content?.['application/json']?.schema) {
          outputSchema = successResponse.content['application/json'].schema;
        }
      }

      // Extract headers
      const headers: Record<string, string> = {};
      if (op.parameters) {
        for (const param of op.parameters) {
          if (param.in === 'header') {
            headers[param.name] = param.schema?.default || '';
          }
        }
      }

      endpoints.push({
        endpoint: path,
        method: method.toUpperCase(),
        description: op.summary || op.description,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        pathParams: Object.keys(pathParams).length > 0 ? pathParams : undefined,
        requestBody,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        outputSchema,
        expectedStatusCode: 200,
      });
    }
  }

  return {
    name: spec.info?.title || 'Imported API',
    description: spec.info?.description,
    baseUrl: spec.servers?.[0]?.url || spec.host ? `${spec.schemes?.[0] || 'https'}://${spec.host}${spec.basePath || ''}` : undefined,
    endpoints,
  };
}

/**
 * Parse Postman Collection v2.1
 */
export function parsePostmanCollection(collection: any): ParsedApi {
  const endpoints: ParsedEndpoint[] = [];

  function processItem(item: any, baseUrl?: string) {
    if (item.request) {
      const request = item.request;
      const url = request.url || {};

      // Build endpoint path
      let endpoint = '/';
      if (typeof url === 'string') {
        endpoint = url;
      } else if (url.path) {
        if (Array.isArray(url.path)) {
          endpoint = '/' + url.path.join('/');
        } else {
          endpoint = url.path;
        }
      }

      // Extract query parameters
      const queryParams: Record<string, any> = {};
      if (url.query) {
        for (const q of url.query) {
          queryParams[q.key] = {
            type: 'string',
            required: !q.disabled,
            description: q.description,
          };
        }
      }

      // Extract path variables (from URL variables)
      const pathParams: Record<string, any> = {};
      if (url.variable) {
        for (const v of url.variable) {
          pathParams[v.key] = {
            type: 'string',
            description: v.description,
          };
        }
      }

      // Extract headers
      const headers: Record<string, string> = {};
      if (request.header) {
        for (const h of request.header) {
          if (!h.disabled) {
            headers[h.key] = h.value || '';
          }
        }
      }

      // Extract request body
      let requestBody: any = null;
      if (request.body) {
        if (request.body.mode === 'raw' && request.body.raw) {
          try {
            requestBody = JSON.parse(request.body.raw);
          } catch {
            requestBody = { type: 'string', example: request.body.raw };
          }
        } else if (request.body.formdata) {
          requestBody = { type: 'object', properties: {} };
          for (const f of request.body.formdata) {
            requestBody.properties[f.key] = { type: f.type || 'string' };
          }
        } else if (request.body.urlencoded) {
          requestBody = { type: 'object', properties: {} };
          for (const f of request.body.urlencoded) {
            requestBody.properties[f.key] = { type: 'string' };
          }
        }
      }

      // Extract response schema (from example response)
      let outputSchema: any = null;
      if (request.response && request.response.length > 0) {
        const exampleResponse = request.response[0];
        if (exampleResponse.body) {
          try {
            const parsed = JSON.parse(exampleResponse.body);
            outputSchema = inferSchemaFromObject(parsed);
          } catch {
            // Not JSON, skip
          }
        }
      }

      endpoints.push({
        endpoint,
        method: request.method || 'GET',
        description: item.description || request.description,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        pathParams: Object.keys(pathParams).length > 0 ? pathParams : undefined,
        requestBody,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        outputSchema,
        expectedStatusCode: 200,
      });
    }

    // Process nested items (folders)
    if (item.item && Array.isArray(item.item)) {
      for (const subItem of item.item) {
        processItem(subItem, baseUrl);
      }
    }
  }

  // Process collection items
  if (collection.item && Array.isArray(collection.item)) {
    const baseUrl = collection.variable?.find((v: any) => v.key === 'baseUrl')?.value;
    for (const item of collection.item) {
      processItem(item, baseUrl);
    }
  }

  return {
    name: collection.info?.name || 'Imported Postman Collection',
    description: collection.info?.description,
    baseUrl: collection.variable?.find((v: any) => v.key === 'baseUrl')?.value,
    endpoints,
  };
}

/**
 * Parse Insomnia Collection
 */
export function parseInsomniaCollection(collection: any): ParsedApi {
  const endpoints: ParsedEndpoint[] = [];

  const resources = collection.resources || [];

  for (const resource of resources) {
    if (resource._type === 'request') {
      const url = resource.url || '';

      // Parse URL to extract path and query
      const urlObj = new URL(url.startsWith('http') ? url : `https://example.com${url}`);
      const endpoint = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      // Extract query parameters
      const queryParams: Record<string, any> = {};
      for (const [key, value] of searchParams.entries()) {
        queryParams[key] = {
          type: 'string',
          required: false,
        };
      }

      // Extract headers
      const headers: Record<string, string> = {};
      if (resource.headers) {
        for (const header of resource.headers) {
          if (!header.disabled) {
            headers[header.name] = header.value || '';
          }
        }
      }

      // Extract request body
      let requestBody: any = null;
      if (resource.body) {
        if (resource.body.mimeType === 'application/json' && resource.body.text) {
          try {
            requestBody = JSON.parse(resource.body.text);
          } catch {
            requestBody = { type: 'string', example: resource.body.text };
          }
        }
      }

      endpoints.push({
        endpoint,
        method: resource.method || 'GET',
        description: resource.name,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        requestBody,
        expectedStatusCode: 200,
      });
    }
  }

  return {
    name: collection.name || 'Imported Insomnia Collection',
    description: collection.description,
    endpoints,
  };
}

/**
 * Infer JSON schema from an object
 */
function inferSchemaFromObject(obj: any): any {
  if (obj === null) return { type: 'null' };
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return {
        type: 'array',
        items: inferSchemaFromObject(obj[0]),
      };
    }
    return { type: 'array' };
  }
  if (typeof obj === 'object') {
    const properties: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      properties[key] = inferSchemaFromObject(value);
    }
    return {
      type: 'object',
      properties,
    };
  }
  return { type: typeof obj };
}

/**
 * Fetch and parse Swagger/OpenAPI from URL
 */
export async function fetchSwaggerFromUrl(url: string): Promise<ParsedApi> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const isYaml = contentType.includes('yaml') || contentType.includes('yml') || url.endsWith('.yaml') || url.endsWith('.yml');
  
  const text = await response.text();
  return parseSwaggerOpenAPI(text, isYaml);
}

