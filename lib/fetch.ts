/**
 * Custom fetch wrapper with error handling
 */
type FetchOptions = {
  headers?: Record<string, string>;
  timeout?: number;
} & Omit<RequestInit, "headers">;

class FetchError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function fetchAPI<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new FetchError(
        response.status,
        `HTTP ${response.status}: ${response.statusText}`,
        data
      );
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { FetchError };
