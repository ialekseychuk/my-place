import { enhancedLocationService } from './enhancedLocationService';

// Mock the apiRequest function
jest.mock('./api', () => ({
  apiRequest: jest.fn()
}));

describe('EnhancedLocationService', () => {
  const { apiRequest } = require('./api');
  
  beforeEach(() => {
    jest.clearAllMocks();
    enhancedLocationService.clearAllCache();
  });

  it('should deduplicate concurrent requests', async () => {
    // Mock the API response
    const mockLocations = [{ id: '1', name: 'Location 1' }];
    apiRequest.mockResolvedValue({ locations: mockLocations });

    const businessId = 'test-business';
    
    // Make multiple simultaneous requests
    const promises = [
      enhancedLocationService.getLocations(businessId),
      enhancedLocationService.getLocations(businessId),
      enhancedLocationService.getLocations(businessId)
    ];
    
    const results = await Promise.all(promises);
    
    // All results should be identical
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
    
    // API should only be called once
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it('should respect cache TTL', async () => {
    // Set a short TTL for testing
    (enhancedLocationService as any).CACHE_TTL = 100; // 100ms for testing
    
    const mockLocations = [{ id: '1', name: 'Location 1' }];
    apiRequest.mockResolvedValue({ locations: mockLocations });

    const businessId = 'test-business';
    
    // First request
    const result1 = await enhancedLocationService.getLocations(businessId);
    
    // Second request should use cache
    const result2 = await enhancedLocationService.getLocations(businessId);
    expect(result1).toBe(result2);
    
    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Third request should make new request
    const result3 = await enhancedLocationService.getLocations(businessId);
    expect(result3).not.toBe(result1);
    
    // API should be called twice
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it('should bypass cache when forceRefresh is true', async () => {
    const mockLocations = [{ id: '1', name: 'Location 1' }];
    apiRequest.mockResolvedValue({ locations: mockLocations });

    const businessId = 'test-business';
    
    // First request
    const result1 = await enhancedLocationService.getLocations(businessId);
    
    // Second request with forceRefresh should make new request
    const result2 = await enhancedLocationService.getLocations(businessId, { forceRefresh: true });
    expect(result2).not.toBe(result1);
    
    // API should be called twice
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
});