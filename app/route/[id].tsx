import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { LatLng, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from 'components/ui/Button';
import { formatCurrency } from 'lib/utilis';
import { supabase } from 'lib/supabase';
import { getDistance } from 'geolib';
import polyline from '@mapbox/polyline';
import type { Coordinate, RouteRaw, StageRaw, VehicleRaw, TransformedRouteItem, MarkerType } from 'types/route';

const { width, height } = Dimensions.get('window');

const decodePolyline = (encoded: string) => {
  try {
    const points = polyline.decode(encoded);
    return points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  } catch (error) {
    console.error('Error decoding polyline:', error);
    return [];
  }
};

const fetchRoutePolyline = async (origin: string, destination: string, stageCoordinates?: Coordinate[]) => {
  try {
    // Check if we have a valid API key
    if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found, using fallback coordinates');
      return stageCoordinates || [];
    }

    // Try different formats for the origin and destination
    const formats = [
      // Original format
      { origin, destination },
      // Try with coordinates if available from stages
      ...(stageCoordinates && stageCoordinates.length >= 2 ? [
        {
          origin: `${stageCoordinates[0].latitude},${stageCoordinates[0].longitude}`,
          destination: `${stageCoordinates[stageCoordinates.length - 1].latitude},${stageCoordinates[stageCoordinates.length - 1].longitude}`
        }
      ] : [])
    ];

    for (const { origin: orig, destination: dest } of formats) {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(orig)}&destination=${encodeURIComponent(dest)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&mode=driving`;
        
        //console.log('Trying route:', { origin: orig, destination: dest });
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
          const points = data.routes[0].overview_polyline.points;
          //console.log('Successfully fetched polyline');
          return decodePolyline(points);
        } else {
          console.warn(`Route attempt failed: ${data.status} - ${data.error_message || 'No error message'}`);
          // Continue to next format or fallback
        }
      } catch (formatError) {
        console.warn('Format attempt failed:', formatError);
        continue;
      }
    }

    // If all formats failed, return stage coordinates as fallback
    console.log('All route formats failed, using stage coordinates as fallback');
    return stageCoordinates || [];
    
  } catch (error) {
    console.error('Error fetching route:', error);
    return stageCoordinates || [];
  }
};

// ====================== DATA FETCHING ======================

const fetchRoutes = async (): Promise<RouteRaw[]> => {
  const { data, error } = await supabase
  .from('routes')
  .select(`
    id,
    name,
    start_lat,
    start_lng,
    end_lat,
    end_lng,
    start_location,
    end_location,
    fare_amount,
    estimated_time,
    description,
    distance,
    route_coordinates (
      latitude,
      longitude,
      point_order
    ),
    vehicles (
      id,
      plate_number,
      capacity,
      available
    )
  `);


  if (error) throw new Error(error.message);
  //console.log('Fetched routes from Supabase:', JSON.stringify(data, null, 2));
  return data ?? [];
};

const fetchStages = async (): Promise<StageRaw[]> => {
  const { data, error } = await supabase.from('stages').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
};

const fetchVehicles = async (): Promise<VehicleRaw[]> => {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
};

// Helper to determine the worst congestion level from a list
const getWorstCongestion = (congestions: string[]): string => {
  const priority = ['low', 'medium', 'high', 'severe'];
  const sorted = congestions
    .filter(Boolean)
    .sort((a, b) => priority.indexOf(b.toLowerCase()) - priority.indexOf(a.toLowerCase()));
  return sorted[0] || 'unknown';
};

const fetchAllData = async (): Promise<Record<string, TransformedRouteItem>> => {
  const [routes, stages, vehicles] = await Promise.all([
    fetchRoutes(),
    fetchStages(),
    fetchVehicles(),
  ]);

  // Group stages and vehicles by route_id
  const stagesByRouteId = stages.reduce<Record<string, StageRaw[]>>((acc, stage) => {
    if (!acc[stage.route_id]) acc[stage.route_id] = [];
    acc[stage.route_id].push(stage);
    return acc;
  }, {});

  const vehiclesByRouteId = vehicles.reduce<Record<string, VehicleRaw[]>>((acc, vehicle) => {
    if (!acc[vehicle.route_id]) acc[vehicle.route_id] = [];
    acc[vehicle.route_id].push(vehicle);
    return acc;
  }, {});

  // Transform data
  return routes.reduce<Record<string, TransformedRouteItem>>((acc, route) => {
    const routeStages = stagesByRouteId[route.id] || [];
    const worstCongestion = getWorstCongestion(routeStages.map(s => s.congestion));

    acc[route.id] = {
      id: route.id,
      name: route.name,
      startLocation: route.start_location,
      endLocation: route.end_location,
      fareAmount: route.fare_amount,
      estimatedTime: route.estimated_time,
      description: route.description,
      distance: route.distance,
      congestion: worstCongestion,
      congestionLevel: (['low', 'medium', 'high'].includes(worstCongestion.toLowerCase())
        ? (worstCongestion.toLowerCase() as 'low' | 'medium' | 'high')
        : 'low'),
       coordinates: route.route_coordinates
        .sort((a, b) => a.point_order - b.point_order)
        .map(({ latitude, longitude }) => ({ latitude, longitude })),
      stages: routeStages.map(stage => ({
        id: stage.id,
        name: stage.name,
        location: {
          latitude: stage.location_latitude,
          longitude: stage.location_longitude,
        },
        congestion: stage.congestion,
      })),
      vehicles: (vehiclesByRouteId[route.id] || []).map(vehicle => ({
        id: vehicle.id,
        plateNumber: vehicle.plate_number,
        location: {
          latitude: vehicle.location_latitude,
          longitude: vehicle.location_longitude,
        },
        capacity: vehicle.capacity,
        available: vehicle.available,
      })),
      // Add missing properties from route
      start_lat: route.start_lat,
      start_lng: route.start_lng,
      end_lat: route.end_lat,
      end_lng: route.end_lng,
      start_location: route.start_location,
      end_location: route.end_location,
    };
    return acc;
  }, {});
};


// ====================== MAIN COMPONENT ======================
export default function RouteDetailsScreen() {
  const { id } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);
  const [route, setRoute] = useState<TransformedRouteItem | null>(null);
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polylineLoading, setPolylineLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const routeId = Array.isArray(id) ? id[0] : id || '';
      if (!routeId) throw new Error('Missing route ID');

      const allRoutes = await fetchAllData();
      const selectedRoute = allRoutes[routeId];
      if (!selectedRoute) throw new Error('Route not found');

      setRoute(selectedRoute);
      //console.log('Selected route:', selectedRoute);


      // Set initial map region based on route coordinates or stages
      let initialRegion;
      if (selectedRoute.coordinates.length > 0) {
        const coords = selectedRoute.coordinates;
        const minLat = Math.min(...coords.map(c => c.latitude));
        const maxLat = Math.max(...coords.map(c => c.latitude));
        const minLng = Math.min(...coords.map(c => c.longitude));
        const maxLng = Math.max(...coords.map(c => c.longitude));
        
        initialRegion = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.3,
          longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.3,
        };
      } else if (selectedRoute.stages.length > 0) {
        const coords = selectedRoute.stages.map(s => s.location);
        const minLat = Math.min(...coords.map(c => c.latitude));
        const maxLat = Math.max(...coords.map(c => c.latitude));
        const minLng = Math.min(...coords.map(c => c.longitude));
        const maxLng = Math.max(...coords.map(c => c.longitude));
        
        initialRegion = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.3,
          longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.3,
        };
      } else {
        initialRegion = {
          latitude: -1.286389,
          longitude: 36.817223,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
      }

      setMapRegion(initialRegion);

      // Fetch polyline data with multiple fallback strategies
      setPolylineLoading(true);
      const origin = `${selectedRoute.start_lat},${selectedRoute.start_lng}`;
      const destination = `${selectedRoute.end_lat},${selectedRoute.end_lng}`;


      let polylineCoords: LatLng[] = [];

      if (origin && destination) {
        // Try to get Google Maps polyline with stage coordinates as fallback
        const stageCoordinates = selectedRoute.stages.map(stage => stage.location);
        polylineCoords = await fetchRoutePolyline(origin, destination, stageCoordinates);
        
        // If still no polyline, create one from available coordinates
        if (polylineCoords.length === 0) {
          if (selectedRoute.coordinates.length > 0) {
            polylineCoords = selectedRoute.coordinates;
            console.log('Using stored route coordinates');
          } else if (selectedRoute.stages.length >= 2) {
            // Create a simple straight-line path between stages
            polylineCoords = selectedRoute.stages.map(stage => stage.location);
            console.log('Using stage coordinates as polyline');
          }
        }
      } else if (selectedRoute.coordinates.length > 0) {
        polylineCoords = selectedRoute.coordinates;
        console.log('Using stored coordinates (no origin/destination)');
      } else if (selectedRoute.stages.length >= 2) {
        polylineCoords = selectedRoute.stages.map(stage => stage.location);
        console.log('Using stages as coordinates');
      }

      setRoutePolyline(polylineCoords);
      
      // Fit map to show the route if we have coordinates
      if (polylineCoords.length > 0 && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(polylineCoords, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          });
        }, 1500); // Increased delay to ensure map is ready
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      Alert.alert('Error', err.message || 'Failed to load route data');
    } finally {
      setLoading(false);
      setPolylineLoading(false);
    }
  };

  // Fetch data
  useEffect(() => {
    loadData();
  }, [id]);

  // Calculate time between stages (in minutes)
  const getStageTravelTime = (currentStage: Coordinate, nextStage: Coordinate) => {
    const distanceInMeters = getDistance(currentStage, nextStage);
    return Math.round((distanceInMeters / 1000) * 2);
  };

  // Enhanced navigation function with error handling
  const handleStartTracking = () => {
    if (!route) {
      console.log('Route is undefined.');
      return;
    }

    try {
      console.log('Starting tracking for route:', route.id);
       router.replace(`/route/live-tracking?id=${route.id}`);
      
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadData();
  };

  const handleShareRoute = async () => {
  try {
    if (!route) {
      console.warn('No route data to share.');
      return;
    }
    const message = ` Route: ${route.name}
    From: ${route.startLocation}
    To: ${route.endLocation}
   Fare: KES ${route.fareAmount}
   Estimated Time: ${route.estimatedTime} mins

   Shared via Twende App `;

    await Share.share({
      message,
    });
  } catch (error) {
    console.error('Error sharing route:', error);
  }
};



  // ====================== RENDER STATES ======================
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <View className="bg-white p-8 rounded-2xl shadow-sm items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600 font-medium">Loading route details...</Text>
        </View>
      </View>
    );
  }

  if (error || !route || !mapRegion) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <View className="bg-white p-8 rounded-2xl shadow-sm items-center max-w-sm">
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="warning" size={32} color="#ef4444" />
          </View>
          <Text className="text-center text-gray-800 font-semibold text-lg mb-2">
            Oops! Something went wrong
          </Text>
          <Text className="text-center text-gray-600 mb-6">
            {error || 'Failed to load route details'}
          </Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="bg-blue-500 px-6 py-3 rounded-xl flex-1"
              onPress={handleRetry}
            >
              <Text className="text-white font-semibold text-center">Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-200 px-6 py-3 rounded-xl flex-1"
              onPress={() => router.back()}
            >
              <Text className="text-gray-700 font-semibold text-center">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ====================== UI ======================
  const congestionColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  }[route.congestionLevel] || '#10b981';

  const congestionBgColor = {
    low: '#ecfdf5',
    medium: '#fffbeb',
    high: '#fef2f2',
  }[route.congestionLevel] || '#ecfdf5';

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" translucent={false} backgroundColor="white" />

      {/* Enhanced Header */}
      <View className="pt-12 pb-4 px-6 flex-row items-center justify-between bg-white shadow-sm">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="w-11 h-11 bg-gray-100 rounded-xl items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <Text className="font-bold text-lg text-gray-800 text-center" numberOfLines={1}>
            {route.name}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleShareRoute}
          className="w-11 h-11 bg-gray-100 rounded-xl items-center justify-center"
        >
          <Ionicons name="share-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Map */}
      <View className="h-72 w-full bg-gray-200 relative">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={mapRegion}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          loadingEnabled={true}
          mapType="standard"
        >
        {/* Enhanced Route polyline with multiple fallbacks */}
        {routePolyline.length > 0 && (
          <>
            {/* Shadow/border polyline */}
            <Polyline
              coordinates={routePolyline}
              strokeColor="rgba(35, 53, 192, 0.3)"
              strokeWidth={1}
              lineCap="round"
              lineJoin="round"
            />
            {/* Main polyline */}
            <Polyline
              coordinates={routePolyline}
              strokeColor="#3b82f6"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {/* Backup: Connect stages with simple lines if we have stages but no main polyline */}
        {routePolyline.length === 0 && route.stages.length >= 2 && (
          <Polyline
            coordinates={route.stages.map(stage => stage.location)}
            strokeColor="#f59e0b"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Last resort: Show stored route coordinates */}
        {routePolyline.length === 0 && route.stages.length < 2 && route.coordinates.length > 0 && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#10b981"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

          {/* Enhanced Stage markers */}
          {route.stages.map((stage, index) => (
            <Marker
              key={stage.id}
              coordinate={stage.location}
              title={stage.name}
              description={`Stage ${index + 1} • ${stage.congestion || 'Normal'} traffic`}
            >
              <View className="items-center">
                <View 
                  className={`rounded-full p-3 border-3 shadow-lg ${
                    index === 0 
                      ? 'bg-green-500 border-green-600' 
                      : index === route.stages.length - 1
                      ? 'bg-red-500 border-red-600'
                      : 'bg-blue-500 border-blue-600'
                  }`}
                >
                  <Ionicons 
                    name={
                      index === 0 
                        ? "play" 
                        : index === route.stages.length - 1
                        ? "stop"
                        : "location"
                    } 
                    size={18} 
                    color="white" 
                  />
                </View>
                <View className="bg-white px-2 py-1 rounded-full mt-1 shadow-sm">
                  <Text className="text-xs font-semibold text-gray-700">{index + 1}</Text>
                </View>
              </View>
            </Marker>
          ))}

          {/* Enhanced Vehicle markers */}
          {route.vehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              coordinate={vehicle.location}
              title={vehicle.plateNumber}
              description={`${vehicle.available}/${vehicle.capacity} seats available`}
            >
              <View className="items-center">
                <View className="bg-orange-500 rounded-full p-3 border-3 border-orange-600 shadow-lg">
                  <Ionicons name="bus" size={18} color="white" />
                </View>
                <View className="bg-white px-2 py-1 rounded-full mt-1 shadow-sm">
                  <Text className="text-xs font-bold text-orange-600">{vehicle.available}</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Polyline loading/status indicator */}
        {polylineLoading && (
          <View className="absolute top-4 left-4 bg-white px-3 py-2 rounded-full shadow-sm flex-row items-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="ml-2 text-xs text-gray-600">Loading route...</Text>
          </View>
        )}

        {/* Route status indicator */}
        {!polylineLoading && (
          <View className="absolute top-4 left-4 bg-white px-3 py-2 rounded-full shadow-sm flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${
              routePolyline.length > 0 ? 'bg-green-500' : 
              route.stages.length >= 2 ? 'bg-yellow-500' : 
              'bg-gray-400'
            }`} />
            <Text className="text-xs text-gray-600">
              {routePolyline.length > 0 ? 'Route loaded' : 
               route.stages.length >= 2 ? 'Stages connected' : 
               'Basic route'}
            </Text>
          </View>
        )}

        {/* Map controls */}
        <View className="absolute bottom-4 right-4 space-y-2">
          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center"
            onPress={() => {
              const coordsToFit = routePolyline.length > 0 ? routePolyline :
                                 route.stages.length >= 2 ? route.stages.map(s => s.location) :
                                 route.coordinates.length > 0 ? route.coordinates : [];
              
              if (coordsToFit.length > 0) {
                mapRef.current?.fitToCoordinates(coordsToFit, {
                  edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                  animated: true,
                });
              }
            }}
          >
            <Ionicons name="resize-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Enhanced Route Info Card */}
        <View className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          {/* Route Title & Description */}
          <View className="mb-6">
            <Text className="font-bold text-xl text-gray-800 mb-2">{route.name}</Text>
            {route.description && (
              <Text className="text-gray-600 leading-relaxed">{route.description}</Text>
            )}
          </View>

          {/* Start/End Locations */}
          <View className="space-y-4 mb-6">
            {[
              { 
                label: 'From', 
                value: route.startLocation,
                icon: 'radio-button-on', 
                color: '#10b981',
                bgColor: '#ecfdf5'
              },
              { 
                label: 'To', 
                value: route.endLocation,
                icon: 'location', 
                color: '#ef4444',
                bgColor: '#fef2f2'
              },
            ].map((item, idx) => (
              <View key={idx} className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500 mb-1">{item.label}</Text>
                  <Text className="font-semibold text-gray-800 leading-relaxed">{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Stats Grid */}
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row justify-between">
              {[
                { 
                  icon: 'time-outline', 
                  label: 'Duration', 
                  value: `${route.estimatedTime} min`,
                  color: '#3b82f6'
                },
                { 
                  icon: 'cash-outline', 
                  label: 'Fare', 
                  value: formatCurrency(route.fareAmount),
                  color: '#10b981'
                },
                { 
                  icon: route.congestionLevel === 'high' ? 'warning' : 'checkmark-circle', 
                  label: 'Traffic', 
                  value: route.congestionLevel?.toString() || 'low',
                  color: congestionColor,
                },
              ].map((item, idx) => (
                <View key={idx} className="items-center flex-1">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text className="font-bold text-gray-800 mb-1 capitalize">
                    {item.value}
                  </Text>
                  <Text className="text-xs text-gray-500 text-center">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Enhanced Stages List */}
        <View className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <Text className="font-bold text-lg text-gray-800 mb-4">Route Stages</Text>
          {route.stages.map((stage, index) => (
            <View key={stage.id} className="flex-row items-start mb-4 last:mb-0">
              {/* Stage Number & Connector */}
              <View className="mr-4 items-center">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center shadow-sm ${
                    index === 0
                      ? 'bg-green-500'
                      : index === route.stages.length - 1
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                >
                  <Text className="text-white font-bold text-sm">{index + 1}</Text>
                </View>
                {index < route.stages.length - 1 && (
                  <View className="w-0.5 h-12 bg-gray-300 my-2" />
                )}
              </View>

              {/* Stage Details */}
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 mb-1">{stage.name}</Text>
                {stage.congestion && (
                  <View className="flex-row items-center mb-2">
                    <View 
                      className="px-2 py-1 rounded-full mr-2"
                      style={{ backgroundColor: congestionBgColor }}
                    >
                      <Text 
                        className="text-xs font-medium capitalize"
                        style={{ color: congestionColor }}
                      >
                        {stage.congestion} traffic
                      </Text>
                    </View>
                  </View>
                )}
                {index < route.stages.length - 1 && (
                  <Text className="text-sm text-gray-500">
                    ≈ {getStageTravelTime(
                      stage.location,
                      route.stages[index + 1].location
                    )} min to next stage
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Enhanced Vehicles List */}
        <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <Text className="font-bold text-lg text-gray-800 mb-4">Available Vehicles</Text>
          {route.vehicles.length > 0 ? (
            route.vehicles.map((vehicle) => (
              <View
                key={vehicle.id}
                className="bg-gray-50 rounded-xl p-4 mb-3 last:mb-0"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-14 h-14 bg-blue-100 rounded-xl items-center justify-center mr-4">
                      <Ionicons name="bus" size={28} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800 text-lg">{vehicle.plateNumber}</Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="people" size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">
                          {vehicle.available}/{vehicle.capacity} seats available
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <View className={`w-2 h-2 rounded-full mr-2 ${vehicle.available > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Text className={`text-sm font-medium ${vehicle.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {vehicle.available > 0 ? 'Available' : 'Full'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center shadow-sm"
                    onPress={handleStartTracking}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">Track</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center py-8">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="bus-outline" size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-500 text-center">No vehicles currently available</Text>
              <Text className="text-sm text-gray-400 text-center mt-1">Please check back later</Text>
            </View>
          )}
        </View>
        
        {/* Bottom spacing for safe area */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}