/**
 * Location Service Monitor
 * Utility for monitoring and debugging the enhanced location service
 */

class LocationServiceMonitor {
  private isEnabled: boolean = false;
  private requestCount: number = 0;
  private cacheHitCount: number = 0;
  private pendingRequestCount: number = 0;
  
  enable(): void {
    this.isEnabled = true;
    console.log('[LocationMonitor] Monitoring enabled');
  }
  
  disable(): void {
    this.isEnabled = false;
    console.log('[LocationMonitor] Monitoring disabled');
  }
  
  logRequest(businessId: string): void {
    if (!this.isEnabled) return;
    
    this.requestCount++;
    console.log(`[LocationMonitor] Request #${this.requestCount} for business ${businessId}`);
  }
  
  logCacheHit(businessId: string): void {
    if (!this.isEnabled) return;
    
    this.cacheHitCount++;
    console.log(`[LocationMonitor] Cache hit #${this.cacheHitCount} for business ${businessId}`);
  }
  
  logPendingRequest(businessId: string): void {
    if (!this.isEnabled) return;
    
    this.pendingRequestCount++;
    console.log(`[LocationMonitor] Pending request #${this.pendingRequestCount} for business ${businessId}`);
  }
  
  getStats(): { 
    totalRequests: number; 
    cacheHits: number; 
    pendingRequests: number;
    cacheHitRate: number;
  } {
    const cacheHitRate = this.requestCount > 0 ? (this.cacheHitCount / this.requestCount) * 100 : 0;
    
    return {
      totalRequests: this.requestCount,
      cacheHits: this.cacheHitCount,
      pendingRequests: this.pendingRequestCount,
      cacheHitRate
    };
  }
  
  resetStats(): void {
    this.requestCount = 0;
    this.cacheHitCount = 0;
    this.pendingRequestCount = 0;
    console.log('[LocationMonitor] Stats reset');
  }
  
  printStats(): void {
    const stats = this.getStats();
    console.log('[LocationMonitor] Stats:', stats);
  }
}

export const locationMonitor = new LocationServiceMonitor();