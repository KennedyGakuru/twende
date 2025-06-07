import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Dimensions } from 'react-native';
import MapView, { LatLng, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/ui/Button';
import { useLocation } from 'hooks/useLocation';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import polyline from '@mapbox/polyline';
import { supabase } from 'lib/supabase';

interface TrackingData {
  vehicleId: string;
  routeName: string;
  driverName: string;
  capacity: number;
  availableSeats: number;
  currentSpeed: number;
  estimatedArrival: number;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  nextStops: Array<{
    id: string;
    name: string;
    location: {
      latitude: number;
      longitude: number;
    };
    eta: string;
  }>;
}

export default function LiveTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  const { location, startWatchingLocation } = useLocation();
  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const routeIndexRef = useRef(0);
  const mapRef = useRef<MapView>(null);

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [vehiclePosition, setVehiclePosition] = useState<{latitude: number; longitude: number} | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routePolyline, setRoutePolyline] = useState<{ latitude: number; longitude: number }[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [isAutoFollow, setIsAutoFollow] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const infoCardHeight = useSharedValue(150);
  const arrowRotation = useSharedValue(0);

  const decodePolyline = (encoded: string) => {
    try {
      const points = polyline.decode(encoded);
      return points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
    } catch (error) {
      console.error('Error decoding polyline:', error);
      return [];
    }
  };

  const fetchRoutePolyline = async (origin: string, destination: string) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
     const response = await fetch(url);
     const data = await response.json();
     //console.log("Directions URL:", url);
     //console.log('My Google Maps API key is:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);



      if (data.status === 'OK' && data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        return decodePolyline(points);
      } else {
        console.error('No route found or API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      return [];
    }
  };

  const fetchTrackingData = async () => {
  try {
    // Fetch vehicles for this route (by route_id)
    const { data: vehicles, error: vehicleError } = await supabase
     .from('vehicles')
     .select(`
      *,
      vehicle_profiles(*),
      routes (
      end_lat,
      end_lng,
      name
      )
      `)
     .eq('route_id', id);

    if (vehicleError) {
      console.error('Error fetching vehicles:', vehicleError);
      setError('Failed to fetch vehicles');
      setIsLoading(false);
      return;
    }

    if (!vehicles || vehicles.length === 0) {
      setError(`No vehicles found for route ID: ${id}`);
      setIsLoading(false);
      return;
    }

    const vehicle = vehicles[0];
    const profile = vehicle.vehicle_profiles?.[0] || {};
    const route = vehicle.routes;

    const mockTracking = {
    vehicle_id: vehicle.id,
    current_location: {
    latitude: -1.2921, // Nairobi CBD center
    longitude: 36.8219
  },
  destination: {
    latitude: route?.end_lat ?? -1.2864,   // fallback if route is missing
    longitude: route?.end_lng ?? 36.8230
  },
  current_speed: 45,
  estimated_arrival: 15,
  capacity: vehicle.capacity || 50,
  available_seats: vehicle.available || 20
};


    // Combine vehicle, profile, and mock tracking into one object
    const combinedData = {
      ...mockTracking,
      vehicle_info: vehicle,
      vehicle_profile: profile,
      route_info: vehicle.routes || null,
      driver_name: profile.driver_name || 'Driver Name',
      driver_phone: profile.driver_phone || null,
      plate_number: profile.plate_number || vehicle.plate_number
    };

    // Transform data for UI usage
    const transformedData = transformDatabaseData(combinedData);
    setTrackingData(transformedData);

    // Initialize map tracking logic with combined data
    initializeTracking(combinedData);

  } catch (error) {
    console.error('Error in fetchTrackingData:', error);
    setError('Failed to load tracking data');
    setIsLoading(false);
  }
};


  // Transform database data to match your interface
  const transformDatabaseData = (combinedData: any): TrackingData => {
  const vehicle = combinedData.vehicle_info || {};
  const profile = combinedData.vehicle_profile || {};
  const route = combinedData.route_info || {};
  const tracking = combinedData;

  return {
    vehicleId: vehicle.id || 'Unknown Vehicle',
    routeName: route.name || route.route_name || 'Route Name',
    driverName: profile.driver_name || 'Driver Name',
    capacity: vehicle.capacity || tracking.capacity || 50,
    availableSeats: vehicle.available || tracking.available_seats || 20,
    currentSpeed: tracking.current_speed || 45,
    estimatedArrival: tracking.estimated_arrival || 15,
    currentLocation: tracking.current_location || {
      latitude: -1.2921,
      longitude: 36.8219,
    },
    destination: tracking.destination || {
      latitude: -1.2864,
      longitude: 36.8230,
    },
    nextStops: route.stops || []
  };
};

  const initializeTracking = async (dbData: any) => {
    try {
      const currentLoc = dbData.current_location || dbData.currentLocation;
      
      // Ensure current location exists and has valid coordinates
      if (currentLoc && 
          typeof currentLoc.latitude === 'number' && 
          typeof currentLoc.longitude === 'number') {
        
        setVehiclePosition(currentLoc);
        setRemainingTime(dbData.estimated_arrival || dbData.estimatedArrival || 15);

        const initialRegion = {
          latitude: currentLoc.latitude,
          longitude: currentLoc.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(initialRegion);

        // Only fetch route if we have valid destination
        const dest = dbData.destination;
        if (dest && 
            typeof dest.latitude === 'number' && 
            typeof dest.longitude === 'number') {
          
          const polylinePoints = await fetchRoutePolyline(
            `${currentLoc.latitude},${currentLoc.longitude}`,
            `${dest.latitude},${dest.longitude}`
          );

          setRoutePolyline(polylinePoints);

          // Start movement simulation only if we have route points
          if (polylinePoints.length > 0) {
            movementIntervalRef.current = setInterval(() => {
              const nextIndex = (routeIndexRef.current + 1) % polylinePoints.length;
              routeIndexRef.current = nextIndex;
              setVehiclePosition(polylinePoints[nextIndex]);
            }, 3000);
          }
        }

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setRemainingTime((prev) => Math.max(0, prev - 0.1));
        }, 6000);

        setIsLoading(false);
        setError(null);
      } else {
        setError('Invalid location data in database');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initializing tracking:', error);
      setError('Failed to initialize tracking');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await startWatchingLocation();
        if (isMounted) {
          await fetchTrackingData();
        }
      } catch (error) {
        console.error('Error initializing:', error);
        if (isMounted) {
          setError('Failed to initialize location services');
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
  if (!mapReady || !location || !vehiclePosition || isLoading || !isAutoFollow) return;

  const newRegion = {
    latitude: (location.latitude + vehiclePosition.latitude) / 2,
    longitude: (location.longitude + vehiclePosition.longitude) / 2,
    latitudeDelta: Math.abs(location.latitude - vehiclePosition.latitude) * 1.5 + 0.01,
    longitudeDelta: Math.abs(location.longitude - vehiclePosition.longitude) * 1.5 + 0.01,
  };

  if (mapRef.current) {
    mapRef.current.animateToRegion(newRegion, 1000);
  }
}, [
  location?.latitude,
  location?.longitude,
  vehiclePosition?.latitude,
  vehiclePosition?.longitude,
  mapReady,
  isAutoFollow, // 👈 Depend on this too
]);


  const animatedInfoCardStyle = useAnimatedStyle(() => ({ 
    height: infoCardHeight.value 
  }));
  
  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(arrowRotation.value, [0, 1], [0, 180])}deg` }],
  }));

  const toggleInfoExpansion = () => {
    const newValue = !isInfoExpanded;
    setIsInfoExpanded(newValue);
    infoCardHeight.value = withTiming(newValue ? 350 : 150, { duration: 300 });
    arrowRotation.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };

  // Show error state
  if (error) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="pt-14 pb-4 px-6 flex-row items-center justify-between bg-white">
          <TouchableOpacity 
            className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center" 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#404040" />
          </TouchableOpacity>
          <Text className="font-heading text-lg text-neutral-800">Live Tracking</Text>
          <View className="w-10" />
        </View>
        
        <View className="flex-1 items-center justify-center px-6">
          <Image
                    source={require('../../assets/404 Error .png')}
                    style={{
                        width: Dimensions.get('window').width * 0.85,
                        height: Dimensions.get('window').height * 0.4,
                      }}
                    resizeMode='contain'
                    />
          <Text className="font-heading text-xl text-neutral-800 mt-4 text-center">
            Tracking Unavailable
          </Text>
          <Text className="font-sans text-neutral-600 mt-2 text-center">
            {error}
          </Text>
          <Button 
            variant="primary" 
            className="mt-6"
            onPress={() => {
              setError(null);
              setIsLoading(true);
              fetchTrackingData();
            }}
          >
            <Text>Retry</Text>
          </Button>
        </View>
      </View>
    );
  }

  // Show loading state
  if (isLoading || !trackingData || !vehiclePosition) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="bus" size={48} color="#0066ff" />
        <Text className="text-neutral-600 mt-4">Loading tracking data...</Text>
        <Text className="text-neutral-400 mt-2 text-sm">Vehicle ID: {id}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between bg-white">
        <TouchableOpacity 
          className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center" 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#404040" />
        </TouchableOpacity>
        <Text className="font-heading text-lg text-neutral-800">Live Tracking</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1">
        {mapRegion && (
          <MapView 
            ref={mapRef}
            style={{ flex: 1 }} 
            initialRegion={mapRegion}
            showsUserLocation 
            showsCompass 
            rotateEnabled 
            provider={PROVIDER_GOOGLE}
            onMapReady={() => setMapReady(true)}
            onPanDrag={() => setIsAutoFollow(false)} // 👈 This disables auto-follow
            onRegionChangeComplete={() => setIsAutoFollow(false)} // Optional
            loadingEnabled={true}
          >
            {routePolyline.length > 0 && (
              <Polyline 
                coordinates={routePolyline} 
                strokeWidth={4} 
                strokeColor="#0066ff" 
              />
            )}
            
            {vehiclePosition && (
              <Marker 
                coordinate={vehiclePosition} 
                title={trackingData.vehicleId}
                identifier="vehicle"
              >
                <View className="bg-blue-500 rounded-full p-2">
                  <Ionicons name="navigate" size={16} color="white" />
                </View>
              </Marker>
            )}
            
            {trackingData.nextStops?.map((stop, index) => (
              <Marker 
                key={stop.id || index} 
                coordinate={stop.location} 
                title={stop.name}
                identifier={`stop-${index}`}
              >
                <View className="bg-white rounded-full p-2 border-2 border-blue-500">
                  <Ionicons name="location-sharp" size={16} color="#0066ff" />
                </View>
              </Marker>
            ))}
            
            {trackingData.destination && (
              <Marker 
                coordinate={trackingData.destination} 
                title="Destination"
                identifier="destination"
              >
                <View className="bg-green-500 rounded-full p-2">
                  <Ionicons name="location-sharp" size={16} color="white" />
                </View>
              </Marker>
            )}
          </MapView>
        )}
      </View>

      {/* Live tracking info card */}
      <Animated.View 
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-md px-6 py-4"
        style={animatedInfoCardStyle}
      >
        <TouchableOpacity 
          className="absolute top-2 right-0 left-0 h-8 items-center justify-center"
          onPress={toggleInfoExpansion}
        >
          <Animated.View style={animatedArrowStyle}>
            <Ionicons name="chevron-up" size={24} color="#404040" />
          </Animated.View>
        </TouchableOpacity>
        
        <View className="mt-4">
          {/* Vehicle info */}
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
              <Ionicons name="bus" size={20} color="#0066ff" />
            </View>
            <View className="ml-3">
              <Text className="font-heading text-lg text-neutral-800">{trackingData.vehicleId}</Text>
              <Text className="font-sans text-neutral-600">{trackingData.routeName}</Text>
            </View>
          </View>
          <TouchableOpacity className="absolute bottom-30 right-0 bg-gray-300 p-2.5 rounded-lg shadow-md shadow-black/10"
           onPress={() => setIsAutoFollow(true)}
             >
           <Text style={{ fontWeight: 'bold', color: '#333' }}>Follow Vehicle</Text>
          </TouchableOpacity>

          
          {/* ETA info */}
          <View className="flex-row justify-between mt-6">
            <View className="items-center">
              <Text className="font-sans text-sm text-neutral-500">ETA</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="time" size={16} color="#0066ff" />
                <Text className="font-sans-medium text-lg text-neutral-800 ml-1">
                  {Math.ceil(remainingTime)} min
                </Text>
              </View>
            </View>
            
            <View className="items-center">
              <Text className="font-sans text-sm text-neutral-500">Available</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="people" size={16} color="#0066ff" />
                <Text className="font-sans-medium text-lg text-neutral-800 ml-1">
                  {trackingData.availableSeats}/{trackingData.capacity}
                </Text>
              </View>
            </View>
            
            <View className="items-center">
              <Text className="font-sans text-sm text-neutral-500">Speed</Text>
              <Text className="font-sans-medium text-lg text-neutral-800 mt-1">
                {trackingData.currentSpeed} km/h
              </Text>
            </View>
          </View>
          
          {/* Expanded content */}
          {isInfoExpanded && (
            <>
              <View className="h-px bg-neutral-200 my-4" />
              
              {/* Driver info */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                    <Ionicons name="person" size={20} color="#00cc99" />
                  </View>
                  <View className="ml-3">
                    <Text className="font-sans text-sm text-neutral-500">Driver</Text>
                    <Text className="font-sans-medium text-neutral-800">{trackingData.driverName}</Text>
                  </View>
                </View>
                
                <TouchableOpacity className="bg-blue-100 p-2 rounded-full">
                  <Ionicons name="call" size={20} color="#0066ff" />
                </TouchableOpacity>
              </View>
              
              {/* Next stops */}
              {trackingData.nextStops && trackingData.nextStops.length > 0 && (
                <>
                  <Text className="font-sans-medium text-neutral-700 mt-4 mb-2">Next Stops</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                  >
                    {trackingData.nextStops.map((stop, index) => (
                      <View 
                        key={stop.id || index}
                        className="mr-3 bg-neutral-100 px-4 py-2 rounded-lg flex-row items-center"
                      >
                        <Ionicons name="location-sharp" size={16} color="#0066ff" />
                        <View className="ml-2">
                          <Text className="font-sans-medium text-neutral-800">{stop.name}</Text>
                          <Text className="font-sans text-xs text-neutral-500">~{stop.eta} min</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
              
              {/* Action buttons */}
              <View className="flex-row justify-between mt-4">
                <Button 
                  variant="outline"
                  className="flex-1 mr-3"
                  onPress={() => console.log('Report issue pressed')}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="warning" size={18} color="#f59e0b" />
                    <Text className="ml-2">Report Issue</Text>
                  </View>
                </Button>
                
                <Button 
                  variant="primary"
                  className="flex-1"
                  onPress={() => router.push('/(tabs)/reporting')}
                >
                  <Text>Update Fare</Text>
                </Button>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}



