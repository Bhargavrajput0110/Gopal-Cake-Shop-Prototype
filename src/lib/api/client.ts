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
    // Parse the standardized error schema from withApiHandler
    const errMessage = data?.error?.message || data?.error || response.statusText;
    const errCode = data?.error?.code || 'UNKNOWN_ERROR';
    throw new ApiClientError(errMessage, response.status, data, errCode);
  }

  return data as T;
}
