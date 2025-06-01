import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationHook {
  location: Coordinates | null;
  errorMsg: string | null;
  hasPermission: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  startWatchingLocation: () => Promise<void>;
  stopWatchingLocation: () => void;
}

export function useLocation(): LocationHook {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permissionGranted = status === 'granted';
      setHasPermission(permissionGranted);
      
      if (!permissionGranted) {
        setErrorMsg('Permission to access location was denied');
      }
      
      return permissionGranted;
    } catch (error) {
      setErrorMsg('Failed to request location permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const startWatchingLocation = async (): Promise<void> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      // Stop any existing subscription
      if (locationSubscription) {
        stopWatchingLocation();
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      });

      // Start watching for location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000,   // Or every 5 seconds
        },
        (newLocation) => {
          setLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      setErrorMsg('Error getting location');
    } finally {
      setIsLoading(false);
    }
  };

  const stopWatchingLocation = (): void => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  // Check permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      setIsLoading(false);
    })();

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return {
    location,
    errorMsg,
    hasPermission,
    isLoading,
    requestPermission,
    startWatchingLocation,
    stopWatchingLocation,
  };
}