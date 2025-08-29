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

// Storage key for location persistence
const LOCATION_STORAGE_KEY = 'currentLocationId';

// Helper functions for localStorage
const saveCurrentLocationId = (locationId: string | null) => {
  try {
    if (locationId) {
      localStorage.setItem(LOCATION_STORAGE_KEY, locationId);
    } else {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to save location to localStorage:', error);
  }
};

const getCurrentLocationId = (): string | null => {
  try {
    return localStorage.getItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read location from localStorage:', error);
    return null;
  }
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Modified setCurrentLocation to save to localStorage
  const setContextCurrentLocation = setCurrentLocation;
  const setCurrentLocationWithStorage = (location: Location | null) => {
    setContextCurrentLocation(location);
    saveCurrentLocationId(location?.id || null);
  };

  const fetchLocations = useCallback(async (businessId: string, options?: { forceRefresh?: boolean }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedLocations = await locationService.getLocations(businessId, options);
      setLocations(fetchedLocations);
      
      // Try to restore previously selected location
      if (fetchedLocations.length > 0) {
        const savedLocationId = getCurrentLocationId();
        const savedLocation = fetchedLocations.find(loc => loc.id === savedLocationId);
        
        // Set the saved location if it exists, otherwise set the first location
        if (savedLocation) {
          setContextCurrentLocation(savedLocation);
        } else if (!currentLocation && fetchedLocations.length > 0) {
          setContextCurrentLocation(fetchedLocations[0]);
        }
      } else {
        setContextCurrentLocation(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation]);

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
        setCurrentLocationWithStorage(updatedLocation);
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
        const remainingLocations = locations.filter(loc => loc.id !== locationId);
        setCurrentLocationWithStorage(remainingLocations.length > 0 ? remainingLocations[0] : null);
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
    setCurrentLocation: setCurrentLocationWithStorage,
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