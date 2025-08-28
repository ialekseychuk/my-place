import type { Location, LocationRequest } from '@/types/location';
import { apiRequest } from './api';
import { locationMonitor } from '@/utils/locationMonitor';

interface LocationServiceOptions {
  forceRefresh?: boolean;
  cacheTTL?: number;
}

class EnhancedLocationService {
  private requestCache: Map<string, { data: Location[], timestamp: number, error?: Error }> = new Map();
  private pendingRequests: Map<string, Promise<Location[]>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private readonly CACHE_TTL: number = 5 * 60 * 1000; // 5 minutes
  private readonly ERROR_CACHE_TTL: number = 10 * 1000; // 10 seconds
  private readonly MIN_REQUEST_INTERVAL: number = 1000; // 1 second
  private debugMode: boolean = false;

  constructor() {
    // Clean up old cache entries periodically
    setInterval(() => this.cleanupCache(), 60 * 1000); // Every minute
  }

  async getLocations(businessId: string, options: LocationServiceOptions = {}): Promise<Location[]> {
    const { forceRefresh = false, cacheTTL = this.CACHE_TTL } = options;
    
    // Validate businessId
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    // Log the request for monitoring
    locationMonitor.logRequest(businessId);
    
    // Check if we should use cache
    if (!forceRefresh && this.isCacheValid(businessId, cacheTTL)) {
      const cached = this.getCachedData(businessId);
      if (cached.error) throw cached.error;
      
      // Log cache hit for monitoring
      locationMonitor.logCacheHit(businessId);
      
      if (this.debugMode) {
        console.log(`[LocationService] Returning cached data for business ${businessId}`);
      }
      
      return cached.data;
    }

    // Check for pending requests
    if (this.hasPendingRequest(businessId)) {
      // Log pending request for monitoring
      locationMonitor.logPendingRequest(businessId);
      
      if (this.debugMode) {
        console.log(`[LocationService] Returning pending request for business ${businessId}`);
      }
      return this.getPendingRequest(businessId);
    }

    // Check request throttling
    if (!this.canMakeRequest(businessId)) {
      if (this.debugMode) {
        console.log(`[LocationService] Request throttled for business ${businessId}, waiting...`);
      }
      
      await this.waitForThrottle(businessId);
      // After waiting, check cache again
      if (!forceRefresh && this.isCacheValid(businessId, cacheTTL)) {
        const cached = this.getCachedData(businessId);
        if (cached.error) throw cached.error;
        
        // Log cache hit for monitoring
        locationMonitor.logCacheHit(businessId);
        
        if (this.debugMode) {
          console.log(`[LocationService] Returning cached data after throttle for business ${businessId}`);
        }
        
        return cached.data;
      }
    }

    // Make the actual request
    if (this.debugMode) {
      console.log(`[LocationService] Making new request for business ${businessId}`);
    }
    
    return this.makeRequest(businessId);
  }

  async getLocation(businessId: string, locationId: string): Promise<Location> {
    // For single location requests, we'll bypass cache for now
    return await apiRequest<Location>(
      `/api/v1/businesses/${businessId}/locations/${locationId}`
    );
  }

  async createLocation(businessId: string, location: LocationRequest): Promise<Location> {
    if (this.debugMode) {
      console.log(`[LocationService] Creating new location for business ${businessId}`);
    }
    
    const result = await apiRequest<Location>(
      `/api/v1/businesses/${businessId}/locations`,
      {
        method: 'POST',
        body: JSON.stringify(location)
      }
    );
    
    // Clear cache for this business since we've added a new location
    this.clearCache(businessId);
    
    return result;
  }

  async updateLocation(businessId: string, locationId: string, location: LocationRequest): Promise<Location> {
    if (this.debugMode) {
      console.log(`[LocationService] Updating location ${locationId} for business ${businessId}`);
    }
    
    const result = await apiRequest<Location>(
      `/api/v1/businesses/${businessId}/locations/${locationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(location)
      }
    );
    
    // Clear cache for this business since we've updated a location
    this.clearCache(businessId);
    
    return result;
  }

  async deleteLocation(businessId: string, locationId: string): Promise<void> {
    if (this.debugMode) {
      console.log(`[LocationService] Deleting location ${locationId} for business ${businessId}`);
    }
    
    await apiRequest<void>(
      `/api/v1/businesses/${businessId}/locations/${locationId}`,
      {
        method: 'DELETE'
      }
    );
    
    // Clear cache for this business since we've deleted a location
    this.clearCache(businessId);
  }

  public clearCache(businessId: string): void {
    if (this.debugMode) {
      console.log(`[LocationService] Clearing cache for business ${businessId}`);
    }
    
    this.requestCache.delete(businessId);
  }

  public clearAllCache(): void {
    if (this.debugMode) {
      console.log(`[LocationService] Clearing all cache`);
    }
    
    this.requestCache.clear();
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled) {
      console.log('[LocationService] Debug mode enabled');
    } else {
      console.log('[LocationService] Debug mode disabled');
    }
  }

  // Debugging utilities
  public getCacheStats(): { 
    totalEntries: number; 
    pendingRequests: number; 
    lastRequestTimes: number 
  } {
    return {
      totalEntries: this.requestCache.size,
      pendingRequests: this.pendingRequests.size,
      lastRequestTimes: this.lastRequestTime.size
    };
  }

  public inspectCache(): void {
    console.log('Location Service Cache:');
    for (const [key, value] of this.requestCache.entries()) {
      console.log(`  ${key}:`, {
        timestamp: new Date(value.timestamp).toISOString(),
        hasError: !!value.error,
        dataLength: value.data?.length || 0
      });
    }
  }

  public clearCacheForBusiness(businessId: string): void {
    this.requestCache.delete(businessId);
    this.pendingRequests.delete(businessId);
    this.lastRequestTime.delete(businessId);
  }

  private async makeRequest(businessId: string): Promise<Location[]> {
    // Set up pending request tracking
    const requestPromise = apiRequest<{ locations: Location[] }>(
      `/api/v1/businesses/${businessId}/locations`
    )
      .then(data => {
        // Cache successful response
        this.cacheResponse(businessId, data.locations);
        return data.locations;
      })
      .catch(error => {
        // Cache error for a shorter period
        this.cacheError(businessId, error);
        throw error;
      })
      .finally(() => {
        // Clean up pending request
        this.pendingRequests.delete(businessId);
        this.lastRequestTime.set(businessId, Date.now());
      });
      
    this.pendingRequests.set(businessId, requestPromise);
    return requestPromise;
  }

  private isCacheValid(businessId: string, cacheTTL: number): boolean {
    const cached = this.requestCache.get(businessId);
    if (!cached) return false;
    
    // For errors, use shorter TTL
    const ttl = cached.error ? this.ERROR_CACHE_TTL : cacheTTL;
    return (Date.now() - cached.timestamp) < ttl;
  }

  private getCachedData(businessId: string): { data: Location[], error?: Error } {
    return this.requestCache.get(businessId) || { data: [], error: new Error('No cached data') };
  }

  private cacheResponse(businessId: string, data: Location[]): void {
    this.requestCache.set(businessId, {
      data,
      timestamp: Date.now()
    });
  }

  private cacheError(businessId: string, error: Error): void {
    this.requestCache.set(businessId, {
      data: [],
      timestamp: Date.now(),
      error
    });
  }

  private hasPendingRequest(businessId: string): boolean {
    return this.pendingRequests.has(businessId);
  }

  private getPendingRequest(businessId: string): Promise<Location[]> {
    return this.pendingRequests.get(businessId) || Promise.reject(new Error('No pending request'));
  }

  private canMakeRequest(businessId: string): boolean {
    const lastTime = this.lastRequestTime.get(businessId) || 0;
    return (Date.now() - lastTime) >= this.MIN_REQUEST_INTERVAL;
  }

  private async waitForThrottle(businessId: string): Promise<void> {
    const lastTime = this.lastRequestTime.get(businessId) || 0;
    const timeToWait = this.MIN_REQUEST_INTERVAL - (Date.now() - lastTime);
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.requestCache.entries()) {
      const ttl = value.error ? this.ERROR_CACHE_TTL : this.CACHE_TTL;
      if ((now - value.timestamp) >= ttl) {
        this.requestCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (this.debugMode && cleanedCount > 0) {
      console.log(`[LocationService] Cleaned up ${cleanedCount} expired cache entries`);
    }
  }
}

export const enhancedLocationService = new EnhancedLocationService();