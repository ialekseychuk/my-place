import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useLocation as useLocationHook } from 'react-router-dom';

export function LocationSelector() {
  const { locations, currentLocation, setCurrentLocation, fetchLocations, isLoading, error } = useLocation();
  const { user } = useAuth();
  const location = useLocationHook();

  // Fetch locations when user is available
  useEffect(() => {
    if (user?.business_id) {
      // Only force refresh if it's the primary locations page
      const isLocationsPage = location.pathname === '/locations';
      fetchLocations(user.business_id, { forceRefresh: isLocationsPage });
    }
  }, [user?.business_id, fetchLocations, location.pathname]);

  const handleLocationChange = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setCurrentLocation(location);
    }
  };

  const handleRefresh = () => {
    if (user?.business_id) {
      fetchLocations(user.business_id, { forceRefresh: true });
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-500">
        <span>Ошибка загрузки локаций</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Загрузка локаций...</span>
      </div>
    );
  }

  // Don't render if no locations
  if (locations.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Нет доступных локаций</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">Локация:</span>
      <Select 
        value={currentLocation?.id || ''} 
        onValueChange={handleLocationChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Выберите локацию">
            {currentLocation?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        className="h-8 px-2"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}