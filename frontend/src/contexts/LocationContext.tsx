import { locationService } from '@/services/location';
import type { Location, LocationRequest } from '@/types/location';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface LocationContextType {
  locations: Location[];
  currentLocation: Location | null;
  setCurrentLocation: (location: Location | null) => void;
  fetchLocations: (businessId: string, options?: { forceRefresh?: boolean }) => Promise<void>;
  createLocation: (businessId: string, locationData: Omit<Location, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Promise<Location>;
  updateLocation: (businessId: string, locationId: string, locationData: Partial<Omit<Location, 'id' | 'business_id' | 'created_at' | 'updated_at'>>) => Promise<Location>;
  deleteLocation: (businessId: string, locationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearLocationCache: (businessId: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLocations = useCallback(async (businessId: string, options?: { forceRefresh?: boolean }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedLocations = await locationService.getLocations(businessId, options);
      setLocations(fetchedLocations);
      
      // Set the first location as current if none is selected and locations exist
      if ((!currentLocation || !locations.some(loc => loc.id === currentLocation.id)) && fetchedLocations.length > 0) {
        setCurrentLocation(fetchedLocations[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, locations]);

  const createLocation = async (
    businessId: string,
    locationData: Omit<Location, 'id' | 'business_id' | 'created_at' | 'updated_at'>
  ): Promise<Location> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newLocation = await locationService.createLocation(businessId, locationData);
      setLocations(prev => [...prev, newLocation]);
      return newLocation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = async (
    businessId: string,
    locationId: string,
    locationData: Partial<Omit<Location, 'id' | 'business_id' | 'created_at' | 'updated_at'>>
  ): Promise<Location> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert Partial type to LocationRequest by providing default values for missing fields
      const requestData: LocationRequest = {
        name: locationData.name || '',
        address: locationData.address || '',
        city: locationData.city || '',
        contact_info: locationData.contact_info || '',
        timezone: locationData.timezone || 'UTC'
      };
      
      const updatedLocation = await locationService.updateLocation(businessId, locationId, requestData);
      setLocations(prev => prev.map(loc => loc.id === locationId ? updatedLocation : loc));
      
      // Update current location if it was the one being updated
      if (currentLocation && currentLocation.id === locationId) {
        setCurrentLocation(updatedLocation);
      }
      
      return updatedLocation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLocation = async (businessId: string, locationId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await locationService.deleteLocation(businessId, locationId);
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      
      // Clear current location if it was the one being deleted
      if (currentLocation && currentLocation.id === locationId) {
        setCurrentLocation(locations.length > 1 ? locations[0] : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocationCache = useCallback((businessId: string) => {
    locationService.clearCache(businessId);
  }, []);

  const value: LocationContextType = {
    locations,
    currentLocation,
    setCurrentLocation,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    isLoading,
    error,
    clearLocationCache
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};