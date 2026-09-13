export class ApiClientError extends Error {
  constructor(public message: string, public status?: number, public data?: any, public code?: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Base API client for all internal (staff) API calls.
 * Base path: /api/v1
 * 
 * Aligns with the standardized error schema produced by withApiHandler:
 * { success: false, error: { code, message, details, requestId } }
 */
export async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // All staff-facing APIs are versioned under /api/v1
  const response = await fetch(`/api/v1${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch (e) {
    // some endpoints might return 204 No Content
    data = null;
  }

  if (!response.ok) {
    // Parse standardized error schema from withApiHandler or direct API responses
    let errMessage = data?.message || data?.error?.message || (typeof data?.error === 'string' ? data.error : undefined);
    
    if (Array.isArray(data?.details) && data.details.length > 0) {
      const detailMsgs = data.details.map((d: any) => d.message || `${d.field}: invalid`).join(', ');
      errMessage = errMessage ? `${errMessage}: ${detailMsgs}` : detailMsgs;
    }
    
    if (!errMessage) {
      errMessage = response.statusText || `Request failed with status ${response.status}`;
    }
    
    const errCode = data?.code || data?.error?.code || 'UNKNOWN_ERROR';
    throw new ApiClientError(errMessage, response.status, data, errCode);
  }

  return data as T;
}
