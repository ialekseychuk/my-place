/**
 * Simple API request function for the schedule system
 * @template T - The expected response type
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns Promise with the parsed JSON response
 */
export const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  // Get the token from localStorage
  const token = localStorage.getItem('access_token');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Only add Authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.statusText} (${response.status})`);
  }

  // Handle empty responses
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) === 0) {
    return null as unknown as T;
  }

  const text = await response.text();
  if (!text) {
    return null as unknown as T;
  }

  try {
    const result = JSON.parse(text);
    return result;
  } catch (error) {
    throw new Error('Failed to parse API response');
  }
}

// Default export for convenience
export default {
  apiRequest
}