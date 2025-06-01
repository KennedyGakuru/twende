import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from 'components/ui/Button';
import { formatCurrency } from 'lib/utilis';
import { supabase } from 'lib/supabase';
import { getDistance } from 'geolib';
import type { Coordinate, RouteRaw, StageRaw, VehicleRaw, TransformedRouteItem, MarkerType } from 'types/route';

const { width } = Dimensions.get('window');

// ====================== DATA FETCHING ======================

const fetchRoutes = async (): Promise<RouteRaw[]> => {
  const { data, error } = await supabase
    .from('routes')
    .select(`
      id,
      name,
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
      )
    `);

  if (error) throw new Error(error.message);
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
    };
    return acc;
  }, {});
};

// ====================== MAIN COMPONENT ======================
export default function RouteDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [route, setRoute] = useState<TransformedRouteItem | null>(null);
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const routeId = Array.isArray(id) ? id[0] : id || '';
        if (!routeId) throw new Error('Missing route ID');

        const allRoutes = await fetchAllData();
        const selectedRoute = allRoutes[routeId];
        if (!selectedRoute) throw new Error('Route not found');

        setRoute(selectedRoute);
        setMapRegion({
          latitude: selectedRoute.coordinates[0]?.latitude ?? -1.286389,
          longitude: selectedRoute.coordinates[0]?.longitude ?? 36.817223,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Calculate time between stages (in minutes)
  const getStageTravelTime = (currentStage: Coordinate, nextStage: Coordinate) => {
    const distanceInMeters = getDistance(currentStage, nextStage);
    return Math.round((distanceInMeters / 1000) * 2);
  };

  // Fixed navigation function
  const handleStartTracking = () => {
    if (!route) {
      console.log('Route is undefined.');
      return;
    }

    try {
      console.log('Starting tracking for route:', route.id);
      //console.log('Current pathname:', router.pathname);
      
      // Use query string format which is more reliable
      //router.push(`/route/live-tracking?id=${route.id}`);
      
      // Alternative approaches if the above doesn't work:
      // router.navigate(`/route/live-tracking?id=${route.id}`);
      // or
       router.replace(`/route/live-tracking?id=${route.id}`);
      
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // ====================== RENDER STATES ======================
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0066ff" />
        <Text className="mt-4 text-neutral-600">Loading route details...</Text>
      </View>
    );
  }

  if (error || !route || !mapRegion) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Ionicons name="warning" size={48} color="#ef4444" />
        <Text className="mt-4 text-center text-neutral-800 font-sans-medium">
          {error || 'Failed to load route details'}
        </Text>
        <TouchableOpacity
          className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-sans-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ====================== UI ======================
  const congestionColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  }[route.congestionLevel];

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" translucent={false} backgroundColor="white" />

      {/* Header */}
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between bg-white border-b border-neutral-200">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#404040" />
        </TouchableOpacity>
        <Text className="font-heading text-lg text-neutral-800">{route.name}</Text>
        <View className="w-10" />
      </View>

      {/* Map - Replaced CustomMapView with standard MapView */}
      <View className="h-64 w-full">
        <MapView
          style={{ flex: 1 }}
          region={mapRegion}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          {/* Route polyline */}
          {route.coordinates.length > 0 && (
            <Polyline
              coordinates={route.coordinates}
              strokeWidth={4}
              strokeColor="#0066ff"
            />
          )}

          {/* Stage markers */}
          {route.stages.map((stage, index) => (
            <Marker
              key={stage.id}
              coordinate={stage.location}
              title={stage.name}
              description={`Stage ${index + 1}`}
            >
              <View className="bg-white rounded-full p-2 border-2 border-blue-500">
                <Ionicons name="location-sharp" size={16} color="#0066ff" />
              </View>
            </Marker>
          ))}

          {/* Vehicle markers */}
          {route.vehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              coordinate={vehicle.location}
              title={vehicle.plateNumber}
              description={`${vehicle.available} seats available`}
            >
              <View className="bg-blue-500 rounded-full p-2">
                <Ionicons name="bus" size={16} color="white" />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 bg-white px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Route Info Card */}
        <View className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-4">
          {/* Start/End Locations */}
          {[
            { label: 'From', value: route.startLocation, icon: 'location-sharp', color: '#737373' },
            { label: 'To', value: route.endLocation, icon: 'location-sharp', color: '#0066ff' },
          ].map((item, idx) => (
            <View key={idx} className="flex-row items-start mb-3">
              <Ionicons name={item.icon as any} size={18} color={item.color} />
              <View className="ml-2 flex-1">
                <Text className="font-sans text-sm text-neutral-500">{item.label}</Text>
                <Text className="font-sans-medium text-neutral-800 mt-1">{item.value}</Text>
              </View>
            </View>
          ))}

          <View className="h-px bg-neutral-200 my-3" />

          {/* Stats Row */}
          <View className="flex-row justify-between">
            {[
              { icon: 'time-outline', label: 'Est. Time', value: `${route.estimatedTime} min` },
              { icon: 'cash-outline', label: 'Fare', value: formatCurrency(route.fareAmount) },
              { 
                icon: 'alert-circle-outline', 
                label: 'Traffic', 
                value: route.congestionLevel?.toString() || 'low',
                color: congestionColor,
              },
            ].map((item, idx) => (
              <View key={idx} className="items-center">
                <View className="flex-row items-center">
                  <Ionicons name={item.icon as any} size={16} color={item.color || '#0066ff'} />
                  <Text className="font-sans-medium text-neutral-700 ml-1 capitalize">
                    {item.value}
                  </Text>
                </View>
                <Text className="font-sans text-xs text-neutral-500 mt-1">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stages List */}
        <Text className="font-heading text-lg text-neutral-800 mb-3">Stages</Text>
        <View className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
          {route.stages.map((stage, index) => (
            <View key={stage.id} className="flex-row items-start mb-4">
              {/* Stage Number + Connector Line */}
              <View className="mr-3 items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    index === 0
                      ? 'bg-blue-500'
                      : index === route.stages.length - 1
                      ? 'bg-green-500'
                      : 'bg-orange-500'
                  }`}
                >
                  <Text className="text-white font-sans-bold">{index + 1}</Text>
                </View>
                {index < route.stages.length - 1 && (
                  <View className="w-1 h-10 bg-neutral-300 my-1" />
                )}
              </View>

              {/* Stage Details */}
              <View className="flex-1">
                <Text className="font-sans-medium text-neutral-800">{stage.name}</Text>
                {index < route.stages.length - 1 && (
                  <Text className="font-sans text-sm text-neutral-500 mt-1 mb-2">
                    {getStageTravelTime(
                      stage.location,
                      route.stages[index + 1].location
                    )} minutes to next stage
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Vehicles List */}
        <Text className="font-heading text-lg text-neutral-800 mb-3">Available Vehicles</Text>
        {route.vehicles.length > 0 ? (
          route.vehicles.map((vehicle) => (
            <View
              key={vehicle.id}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-3 flex-row items-center"
            >
              <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center mr-3">
                <Ionicons name="bus" size={24} color="#0066ff" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-medium text-neutral-800">{vehicle.plateNumber}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="person" size={16} color="#737373" />
                  <Text className="font-sans text-neutral-600 ml-1">
                    {vehicle.available}/{vehicle.capacity} seats available
                  </Text>
                </View>
              </View>
              
              {/* Fixed Track Button */}
              <TouchableOpacity
                className="bg-white border border-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                onPress={handleStartTracking}
                activeOpacity={0.7}
              >
                <Ionicons name="navigate" size={16} color="#0066ff" />
                <Text className="text-blue-500 font-sans-medium ml-2">Track</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text className="font-sans text-neutral-500 mb-6">No vehicles available</Text>
        )}
        
        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}