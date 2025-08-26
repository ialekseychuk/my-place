/**
 * Simple API request function for the schedule system
 * @template T - The expected response type
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns Promise with the parsed JSON response
 */
export const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const defaultHeaders: Record<string, string> = {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

// Default export for convenience
export default {
  apiRequest
}