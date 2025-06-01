import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/ui/Button';
import { useLocation } from 'hooks/useLocation';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import polyline from '@mapbox/polyline';

const TRACKING_DATA = {
  vehicleId: 'KBZ 123A',
  routeName: 'CBD to Westlands',
  driverName: 'John Doe',
  driverPhone: '+254 712 345 678',
  capacity: 33,
  availableSeats: 15,
  estimatedArrival: 5,
  currentSpeed: 35,
  currentLocation: { latitude: -1.284, longitude: 36.814 },
  destination: { latitude: -1.276, longitude: 36.8 },
  nextStops: [
    { id: '1', name: 'University Way', eta: 2, location: { latitude: -1.283, longitude: 36.81 } },
    { id: '2', name: 'Museum Hill', eta: 4, location: { latitude: -1.28, longitude: 36.805 } },
    { id: '3', name: 'Westlands Terminal', eta: 8, location: { latitude: -1.276, longitude: 36.8 } },
  ]
};

export default function LiveTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { location, startWatchingLocation } = useLocation();
  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const routeIndexRef = useRef(0);

  const [mapRegion, setMapRegion] = useState({
    latitude: TRACKING_DATA.currentLocation.latitude,
    longitude: TRACKING_DATA.currentLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [vehiclePosition, setVehiclePosition] = useState(TRACKING_DATA.currentLocation);
  const [remainingTime, setRemainingTime] = useState(TRACKING_DATA.estimatedArrival);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routePolyline, setRoutePolyline] = useState<{ latitude: number; longitude: number }[]>([]);

  const infoCardHeight = useSharedValue(150);
  const arrowRotation = useSharedValue(0);

  const decodePolyline = (encoded: string) => {
    const points = polyline.decode(encoded);
    return points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  };

  const fetchRoutePolyline = async () => {
    const origin = '-1.2864,36.8172';
    const destination = '-1.2760,36.8000';
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=AIzaSyBveic9ewdcYa6JBtTLQ1wjvH-LMMW4vMI`;
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('Directions API response:', data);

  if (data.status === 'OK' && data.routes.length > 0) {
    const points = data.routes[0].overview_polyline.points;
    return decodePolyline(points);
  } else {
    console.error('No route found or API error:', data.status);
    return [];
  }
};

  useEffect(() => {
    let isMounted = true;

    const initializeTracking = async () => {
      try {
        await startWatchingLocation();

        const polylinePoints = await fetchRoutePolyline();
        if (isMounted) {
          setRoutePolyline(polylinePoints);
          setIsLoading(false);

          movementIntervalRef.current = setInterval(() => {
            const nextIndex = (routeIndexRef.current + 1) % polylinePoints.length;
            routeIndexRef.current = nextIndex;
            setVehiclePosition(polylinePoints[nextIndex]);
          }, 3000);

          countdownIntervalRef.current = setInterval(() => {
            setRemainingTime((prev) => Math.max(0, prev - 0.1));
          }, 6000);
        }
      } catch (error) {
        console.error('Error initializing tracking:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    initializeTracking();

    return () => {
      isMounted = false;
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (location && !isLoading) {
      const newRegion = {
        latitude: (location.latitude + vehiclePosition.latitude) / 2,
        longitude: (location.longitude + vehiclePosition.longitude) / 2,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      const latDiff = Math.abs(newRegion.latitude - mapRegion.latitude);
      const lngDiff = Math.abs(newRegion.longitude - mapRegion.longitude);

      if (latDiff > 0.001 || lngDiff > 0.001) {
        setMapRegion(newRegion);
      }
    }
  }, [location?.latitude, location?.longitude, vehiclePosition.latitude, vehiclePosition.longitude]);

  const animatedInfoCardStyle = useAnimatedStyle(() => ({ height: infoCardHeight.value }));
  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(arrowRotation.value, [0, 1], [0, 180])}deg` }],
  }));

  const toggleInfoExpansion = () => {
    const newValue = !isInfoExpanded;
    setIsInfoExpanded(newValue);
    infoCardHeight.value = withTiming(newValue ? 350 : 150, { duration: 300 });
    arrowRotation.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };

  if (isLoading) {
    return <View className="flex-1 bg-white items-center justify-center"><Text className="text-neutral-600">Loading tracking data...</Text></View>;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between bg-white">
        <TouchableOpacity className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#404040" />
        </TouchableOpacity>
        <Text className="font-heading text-lg text-neutral-800">Live Tracking</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1">
        <MapView style={{ flex: 1 }} region={mapRegion} showsUserLocation showsCompass rotateEnabled provider={PROVIDER_GOOGLE}>
          <Polyline coordinates={routePolyline} strokeWidth={4} strokeColor="#0066ff" />
          <Marker coordinate={vehiclePosition} title={TRACKING_DATA.vehicleId}>
            <View className="bg-blue-500 rounded-full p-2"><Ionicons name="navigate" size={16} color="white" /></View>
          </Marker>
          {TRACKING_DATA.nextStops.map((stop) => (
            <Marker key={stop.id} coordinate={stop.location} title={stop.name}>
              <View className="bg-white rounded-full p-2 border-2 border-blue-500"><Ionicons name="location-sharp" size={16} color="#0066ff" /></View>
            </Marker>
          ))}
          <Marker coordinate={TRACKING_DATA.destination} title="Destination">
            <View className="bg-green-500 rounded-full p-2"><Ionicons name="location-sharp" size={16} color="white" /></View>
          </Marker>
        </MapView>
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
              <Text className="font-heading text-lg text-neutral-800">{TRACKING_DATA.vehicleId}</Text>
              <Text className="font-sans text-neutral-600">{TRACKING_DATA.routeName}</Text>
            </View>
          </View>
          
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
                  {TRACKING_DATA.availableSeats}/{TRACKING_DATA.capacity}
                </Text>
              </View>
            </View>
            
            <View className="items-center">
              <Text className="font-sans text-sm text-neutral-500">Speed</Text>
              <Text className="font-sans-medium text-lg text-neutral-800 mt-1">
                {TRACKING_DATA.currentSpeed} km/h
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
                    <Text className="font-sans-medium text-neutral-800">{TRACKING_DATA.driverName}</Text>
                  </View>
                </View>
                
                <TouchableOpacity className="bg-blue-100 p-2 rounded-full">
                  <Ionicons name="call" size={20} color="#0066ff" />
                </TouchableOpacity>
              </View>
              
              {/* Next stops */}
              <Text className="font-sans-medium text-neutral-700 mt-4 mb-2">Next Stops</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {TRACKING_DATA.nextStops.map((stop) => (
                  <View 
                    key={stop.id}
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