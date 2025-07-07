import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from 'components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from 'lib/supabase';
import * as Location from 'expo-location';
import TripFormModal from 'components/ui/TripFormModal';

type TripData = {
  routeId: string;
  vehicleId: string;
  routeName: string;
  vehiclePlate: string;
};

type VehicleStatus = {
  current_location: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  current_speed: number;
  available_seats: number;
  updated_at: string;
};

type RouteDetails = {
  name: string;
  start_location: string;
  end_location: string;
  stops?: Array<{ name: string; lat: number; lng: number }>;
};

export default function DriverRouteScreen() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<
    | { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
    | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [passengerCount, setPassengerCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [activeTime, setActiveTime] = useState(0);

  // Fetch initial location
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    };

    getLocation();
  }, []);

  // Fetch trip data when on duty
  useEffect(() => {
    if (!isOnDuty || !tripData) return;

    const fetchTripData = async () => {
      setLoading(true);
      try {
        // Fetch vehicle status
        const { data: statusData, error: statusError } = await supabase
          .from('vehicle_status')
          .select('*')
          .eq('vehicle_id', tripData.vehicleId)
          .single();

        if (statusError) throw statusError;
        setVehicleStatus(statusData);

        // Fetch route details
        const { data: routeData, error: routeError } = await supabase
          .from('routes')
          .select('name, start_location, end_location, stops')
          .eq('id', tripData.routeId)
          .single();

        if (routeError) throw routeError;
        setRouteDetails(routeData);

        // Fetch passenger count and earnings (mock - replace with real data)
        const { count } = await supabase
          .from('passengers')
          .select('*', { count: 'exact' })
          .eq('vehicle_id', tripData.vehicleId);

        setPassengerCount(count || 0);
        setEarnings(count ? count * 150 : 0); // Assuming 150 KES per passenger

      } catch (error) {
        console.error('Error fetching trip data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();

    // Set up real-time subscription for vehicle status updates
    const subscription = supabase
      .channel('vehicle_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicle_status',
          filter: `vehicle_id=eq.${tripData.vehicleId}`
        },
        (payload) => {
          setVehicleStatus(payload.new);
        }
      )
      .subscribe();

    // Update active time every minute
    const timeInterval = setInterval(() => {
      setActiveTime(prev => prev + 1);
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(timeInterval);
    };
  }, [isOnDuty, tripData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Re-fetch location
    const location = await Location.getCurrentPositionAsync({});
    setCurrentLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setRefreshing(false);
  };

  const handleShiftToggle = () => {
    if (!isOnDuty) {
      setShowTripForm(true);
    } else {
      // End shift logic
      setTripData(null);
      setVehicleStatus(null);
      setRouteDetails(null);
      setPassengerCount(0);
      setEarnings(0);
      setActiveTime(0);
      setIsOnDuty(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!currentLocation) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0066ff" />
        <Text className="mt-4 text-neutral-600">Getting your location...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="pt-14 pb-4 px-6 bg-white">
        <Text className="font-heading text-2xl text-neutral-800">
          {routeDetails?.name || 'Your Route'}
        </Text>
        <Text className="font-sans text-neutral-600 mt-1">
          {routeDetails 
            ? `${routeDetails.start_location} to ${routeDetails.end_location}`
            : 'Not currently on duty'}
        </Text>
      </View>
      
      {/* Map View */}
      <View className="h-64">
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          region={currentLocation}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {vehicleStatus && (
            <>
              <Marker
                coordinate={{
                  latitude: vehicleStatus.current_location.latitude,
                  longitude: vehicleStatus.current_location.longitude
                }}
              >
                <View className="bg-primary-500 p-2 rounded-full">
                  <Ionicons name="bus" size={20} color="white" />
                </View>
              </Marker>
              
              <Polyline
                coordinates={[
                  {
                    latitude: vehicleStatus.current_location.latitude,
                    longitude: vehicleStatus.current_location.longitude
                  },
                  {
                    latitude: vehicleStatus.destination.latitude,
                    longitude: vehicleStatus.destination.longitude
                  }
                ]}
                strokeColor="#0066ff"
                strokeWidth={3}
              />
              
              <Marker
                coordinate={{
                  latitude: vehicleStatus.destination.latitude,
                  longitude: vehicleStatus.destination.longitude
                }}
              >
                <View className="bg-success-500 p-2 rounded-full">
                  <Ionicons name="flag" size={20} color="white" />
                </View>
              </Marker>
            </>
          )}
        </MapView>
      </View>
      
      {/* Status and Stats */}
      <ScrollView 
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0066ff']}
          />
        }
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="font-sans-medium text-neutral-800">Status</Text>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${isOnDuty ? 'bg-success-500' : 'bg-neutral-400'}`} />
              <Text className={`font-sans ${isOnDuty ? 'text-success-500' : 'text-neutral-500'}`}>
                {isOnDuty ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
          </View>
          
          <Button
            variant={isOnDuty ? 'outline' : 'primary'}
            onPress={handleShiftToggle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={isOnDuty ? '#0066ff' : 'white'} />
            ) : (
              isOnDuty ? 'End Shift' : 'Start Shift'
            )}
          </Button>

          <TripFormModal
            visible={showTripForm}
            onClose={() => setShowTripForm(false)}
            onSubmit={(data) => {
              setTripData(data);
              setIsOnDuty(true);
              setShowTripForm(false);
            }}
          />
        </View>
        
        {/* Stats Cards */}
        <View className="flex-row justify-between mb-6">
          <View className="items-center flex-1">
            <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mb-2">
              <Ionicons name='person' size={24} color="#0066ff" />
            </View>
            <Text className="font-heading text-xl text-neutral-800">
              {passengerCount}
            </Text>
            <Text className="font-sans text-neutral-500">Passengers</Text>
          </View>
          
          <View className="items-center flex-1">
            <View className="w-12 h-12 bg-success-100 rounded-full items-center justify-center mb-2">
              <Ionicons name='cash' size={24} color="#00cc99" />
            </View>
            <Text className="font-heading text-xl text-neutral-800">
              KES {earnings.toLocaleString()}
            </Text>
            <Text className="font-sans text-neutral-500">Today's Earnings</Text>
          </View>
          
          <View className="items-center flex-1">
            <View className="w-12 h-12 bg-warning-100 rounded-full items-center justify-center mb-2">
              <Ionicons name='time' size={24} color="#f59e0b" />
            </View>
            <Text className="font-heading text-xl text-neutral-800">
              {formatTime(activeTime)}
            </Text>
            <Text className="font-sans text-neutral-500">Time Active</Text>
          </View>
        </View>
        
        {/* Next Stops */}
        {routeDetails?.stops && routeDetails.stops.length > 0 && (
          <>
            <Text className="font-heading text-lg text-neutral-800 mb-3">Next Stops</Text>
            <View className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
              {routeDetails.stops.map((stop, index) => (
                <TouchableOpacity 
                  key={index}
                  className="p-4 flex-row items-center"
                  onPress={() => {
                    setCurrentLocation(prev => ({
                      latitude: stop.lat,
                      longitude: stop.lng,
                      latitudeDelta: prev?.latitudeDelta ?? 0.01,
                      longitudeDelta: prev?.longitudeDelta ?? 0.01
                    }));
                  }}
                >
                  <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center">
                    <Text className="font-sans-bold text-primary-500">{index + 1}</Text>
                  </View>
                  <View className="ml-3">
                    <Text className="font-sans-medium text-neutral-800">{stop.name}</Text>
                    <Text className="font-sans text-neutral-500">
                      {index === 0 ? 'Next stop' : `${index * 5 + 2} minutes away`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        
        {/* Vehicle Status */}
        {vehicleStatus && (
          <View className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <Text className="font-heading text-lg text-neutral-800 mb-3">Vehicle Status</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="font-sans text-neutral-600">Current Speed:</Text>
              <Text className="font-sans-bold text-neutral-800">
                {vehicleStatus.current_speed} km/h
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="font-sans text-neutral-600">Available Seats:</Text>
              <Text className="font-sans-bold text-neutral-800">
                {vehicleStatus.available_seats}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-sans text-neutral-600">Last Updated:</Text>
              <Text className="font-sans-bold text-neutral-800">
                {new Date(vehicleStatus.updated_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}