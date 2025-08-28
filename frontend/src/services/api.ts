// Simple in-memory cache for API requests
const requestCache = new Map<string, { data: any; timestamp: number }>()
const pendingRequests = new Map<string, Promise<any>>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Simple API request function for the schedule system with caching
 * @template T - The expected response type
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns Promise with the parsed JSON response
 */
export const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  // Create a cache key based on URL and options
  const cacheKey = `${url}-${JSON.stringify(options)}`
  const now = Date.now()
  
  // Check if we have a cached response that's still valid
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)!
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.data as T
    }
    // Remove expired cache entry
    requestCache.delete(cacheKey)
  }
  
  // Check if there's already a pending request for this key
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!
  }
  
  // Get the token from localStorage
  const token = localStorage.getItem('access_token')
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  // Only add Authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Create a new request promise
  const requestPromise = fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }).then(async (response) => {
    // Remove from pending requests when completed
    pendingRequests.delete(cacheKey)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.statusText} (${response.status})`)
    }

    // Handle empty responses
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) === 0) {
      const result = null as unknown as T
      // Cache the result
      requestCache.set(cacheKey, { data: result, timestamp: now })
      return result
    }

    const text = await response.text()
    if (!text) {
      const result = null as unknown as T
      // Cache the result
      requestCache.set(cacheKey, { data: result, timestamp: now })
      return result
    }

    try {
      const result = JSON.parse(text)
      // Cache the result
      requestCache.set(cacheKey, { data: result, timestamp: now })
      return result
    } catch (error) {
      throw new Error('Failed to parse API response')
    }
  }).catch((error) => {
    // Remove from pending requests when failed
    pendingRequests.delete(cacheKey)
    throw error
  })

  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise)
  
  return requestPromise
}

// Default export for convenience
export default {
  apiRequest
}