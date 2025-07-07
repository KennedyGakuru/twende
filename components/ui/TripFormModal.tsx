import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Button } from 'components/ui/Button';
import { supabase } from 'lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import Ionicons from '@expo/vector-icons/Ionicons';

type TripFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    routeId: string;
    vehicleId: string;
    routeName: string;
    vehiclePlate: string;
  }) => void;
};

export default function TripFormModal({ visible, onClose, onSubmit }: TripFormModalProps) {
  // Form states
  const [routeName, setRouteName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [fareAmount, setFareAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [description, setDescription] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: '',
    longitude: ''
  });
  const [locationLoading, setLocationLoading] = useState(false);
  
  
  const [loading, setLoading] = useState(false);
  type Route = {
    id: string;
    name: string;
    start_location: string;
    end_location: string;
    fare_amount?: number;
    estimated_time?: number;
    [key: string]: any; 
  };

  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Fetch available routes when modal opens
  useEffect(() => {
    if (visible) {
      fetchRoutes();
      getCurrentLocation();
    }
  }, [visible]);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, name, start_location, end_location, fare_amount, estimated_time');
      
      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to fetch available routes');
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString()
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get current location. Please enter manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = () => {
    // Required fields validation
    const requiredFields = [
      { value: vehiclePlate, name: 'Vehicle Plate Number' },
      { value: vehicleCapacity, name: 'Vehicle Capacity' },
      { value: driverName, name: 'Driver Name' },
      { value: currentLocation.latitude, name: 'Latitude' },
      { value: currentLocation.longitude, name: 'Longitude' }
    ];

    // Route can be either selected or created
    if (!selectedRoute) {
      requiredFields.push(
        { value: routeName, name: 'Route Name' },
        { value: startLocation, name: 'Start Location' },
        { value: endLocation, name: 'End Location' }
      );
    }

    const missingFields = requiredFields.filter(field => !field.value.trim());
    if (missingFields.length > 0) {
      Alert.alert('Missing Fields', `Please fill in: ${missingFields.map(f => f.name).join(', ')}`);
      return false;
    }

    // Numeric fields validation
    const numericFields = [
      { value: fareAmount, name: 'Fare Amount' },
      { value: vehicleCapacity, name: 'Vehicle Capacity' },
      { value: currentLocation.latitude, name: 'Latitude' },
      { value: currentLocation.longitude, name: 'Longitude' }
    ];

    if (estimatedTime) numericFields.push({ value: estimatedTime, name: 'Estimated Time' });

    for (const field of numericFields) {
      if (field.value && isNaN(Number(field.value))) {
        Alert.alert('Invalid Input', `${field.name} must be a valid number`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const routeId = selectedRoute?.id || uuidv4();
    const vehicleId = uuidv4();

    try {
      // Create new route if not selected
      if (!selectedRoute) {
        const { error: routeError } = await supabase.from('routes').insert({
          id: routeId,
          name: routeName,
          start_location: startLocation,
          end_location: endLocation,
          fare_amount: fareAmount ? Number(fareAmount) : null,
          estimated_time: estimatedTime ? Number(estimatedTime) : null,
          description: description || null,
          created_at: new Date().toISOString(),
        });

        if (routeError) throw new Error(`Route creation failed: ${routeError.message}`);
      }

      // Create vehicle record
      const { error: vehicleError } = await supabase.from('vehicles').upsert({
        id: vehicleId,
        route_id: routeId,
        plate_number: vehiclePlate,
        capacity: Number(vehicleCapacity),
        available: Number(vehicleCapacity),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (vehicleError) {
        if (!selectedRoute) {
          await supabase.from('routes').delete().eq('id', routeId);
        }
        throw new Error(`Vehicle creation failed: ${vehicleError.message}`);
      }

      // Create vehicle status
      const { error: statusError } = await supabase.from('vehicle_status').upsert({
        vehicle_id: vehicleId,
        current_location: {
          latitude: Number(currentLocation.latitude),
          longitude: Number(currentLocation.longitude)
        },
        destination: selectedRoute 
          ? { latitude: selectedRoute.end_lat, longitude: selectedRoute.end_lng }
          : { latitude: Number(currentLocation.latitude), longitude: Number(currentLocation.longitude) },
        current_speed: 0,
        available_seats: Number(vehicleCapacity),
        updated_at: new Date().toISOString()
      });

      if (statusError) {
        await supabase.from('vehicles').delete().eq('id', vehicleId);
        if (!selectedRoute) {
          await supabase.from('routes').delete().eq('id', routeId);
        }
        throw new Error(`Status creation failed: ${statusError.message}`);
      }

      // Create vehicle profile
      const { error: profileError } = await supabase.from('vehicle_profiles').upsert({
        vehicle_id: vehicleId,
        driver_name: driverName,
        driver_phone: driverPhone,
        plate_number: vehiclePlate,
        notes: notes || null,
        updated_at: new Date().toISOString()
      });

      if (profileError) {
        await supabase.from('vehicle_status').delete().eq('vehicle_id', vehicleId);
        await supabase.from('vehicles').delete().eq('id', vehicleId);
        if (!selectedRoute) {
          await supabase.from('routes').delete().eq('id', routeId);
        }
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // Reset form
      resetForm();

      // Callback with minimal data
      onSubmit({ 
        routeId, 
        vehicleId, 
        routeName: selectedRoute?.name || routeName, 
        vehiclePlate 
      });
      
      onClose();
      Alert.alert('Success', 'Trip data saved successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      Alert.alert('Submission Error', message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRouteName('');
    setStartLocation('');
    setEndLocation('');
    setFareAmount('');
    setEstimatedTime('');
    setDescription('');
    setVehiclePlate('');
    setVehicleCapacity('');
    setDriverName('');
    setDriverPhone('');
    setNotes('');
    setCurrentLocation({ latitude: '', longitude: '' });
    setSelectedRoute(null);
  };

  const handleRouteSelect = (route: Route | null) => {
    setSelectedRoute(route);
    // Auto-fill some fields from selected route
    if (route) {
      setRouteName(route.name);
      setStartLocation(route.start_location);
      setEndLocation(route.end_location);
      setFareAmount(route.fare_amount?.toString() || '');
      setEstimatedTime(route.estimated_time?.toString() || '');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 500 }} className="mb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-2">Start New Trip</Text>
            <Text className="text-base text-gray-600">Select a route or create a new one</Text>
          </MotiView>

          {/* Route Selection */}
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200, duration: 400 }} className="mb-6">
            <Text className="text-xl font-semibold text-gray-700 mb-3">Available Routes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row space-x-3">
                {routes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    onPress={() => handleRouteSelect(route)}
                    className={`px-4 py-3 rounded-xl border ${selectedRoute?.id === route.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-medium ${selectedRoute?.id === route.id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {route.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {route.start_location} → {route.end_location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </MotiView>

          {/* Route Details (only shown if no route selected) */}
          {!selectedRoute && (
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 400, duration: 400 }} className="mb-8">
              <Text className="text-xl font-semibold text-gray-700 mb-4">Create New Route</Text>
              
                <TextInput
                  placeholder="Route Name *"
                  placeholderTextColor="#9CA3AF"
                  value={routeName}
                  onChangeText={setRouteName}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mb-4"
                />
                <TextInput
                  placeholder="Start Location *"
                  placeholderTextColor="#9CA3AF"
                  value={startLocation}
                  onChangeText={setStartLocation}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mb-4"
                />
                <TextInput
                  placeholder="End Location *"
                  placeholderTextColor="#9CA3AF"
                  value={endLocation}
                  onChangeText={setEndLocation}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mb-4"
                />
                <View className="flex-row space-x-3">
                  <TextInput
                    placeholder="Fare Amount"
                    placeholderTextColor="#9CA3AF"
                    value={fareAmount}
                    onChangeText={setFareAmount}
                    keyboardType="numeric"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mx-3 mb-4"
                  />
                  <TextInput
                    placeholder="Est. Time (min)"
                    placeholderTextColor="#9CA3AF"
                    value={estimatedTime}
                    onChangeText={setEstimatedTime}
                    keyboardType="numeric"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mb-4 mx-4"
                  />
                </View>
                <TextInput
                  placeholder="Description"
                  placeholderTextColor="#9CA3AF"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-20 pt-3"
                  style={{ textAlignVertical: 'top' }}
                />
              
            </MotiView>
          )}

          {/* Vehicle Information */}
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 600, duration: 400 }} className="mb-8">
            <Text className="text-xl font-semibold text-gray-700 mb-4">Vehicle Information</Text>
            
              <TextInput
                placeholder="Plate Number *"
                placeholderTextColor="#9CA3AF"
                value={vehiclePlate}
                onChangeText={setVehiclePlate}
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mb-4"
              />
              <TextInput
                placeholder="Capacity (Seats) *"
                placeholderTextColor="#9CA3AF"
                value={vehicleCapacity}
                onChangeText={setVehicleCapacity}
                keyboardType="numeric"
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mb-4"
              />
              <View className="flex-row space-x-3">
                <TextInput
                  placeholder="Driver Name *"
                  placeholderTextColor="#9CA3AF"
                  value={driverName}
                  onChangeText={setDriverName}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mx-2"
                />
                <TextInput
                  placeholder="Driver Phone"
                  placeholderTextColor="#9CA3AF"
                  value={driverPhone}
                  onChangeText={setDriverPhone}
                  keyboardType="phone-pad"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mx-2"
                />
              </View>
              <TextInput
                placeholder="Notes"
                placeholderTextColor="#9CA3AF"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-16 pt-3 mt-4"
                style={{ textAlignVertical: 'top' }}
              />
            
          </MotiView>

          {/* Current Location */}
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 800, duration: 400 }} className="mb-8">
            <Text className="text-xl font-semibold text-gray-700 mb-4">Current Location</Text>
            <View className="space-y-4">
              <View className="flex-row items-center space-x-3">
                <Button 
                  variant="outline" 
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex-1 min-h-12 rounded-xl"
                >
                  <View className="flex-row items-center space-x-2">
                    <Ionicons name="locate" size={18} color="#3B82F6" />
                    <Text className="text-blue-500">
                      {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                    </Text>
                  </View>
                </Button>
              </View>
              <View className="flex-row space-x-3">
                <TextInput
                  placeholder="Latitude *"
                  placeholderTextColor="#9CA3AF"
                  value={currentLocation.latitude}
                  onChangeText={(text) => setCurrentLocation(prev => ({ ...prev, latitude: text }))}
                  keyboardType="numeric"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mt-4 mx-3"
                />
                <TextInput
                  placeholder="Longitude *"
                  placeholderTextColor="#9CA3AF"
                  value={currentLocation.longitude}
                  onChangeText={(text) => setCurrentLocation(prev => ({ ...prev, longitude: text }))}
                  keyboardType="numeric"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12 mt-4 mx-3"
                />
              </View>
            </View>
          </MotiView>

          {/* Action Buttons */}
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1000, duration: 400 }} className="mt-4 space-y-3">
            <Button onPress={handleSubmit} disabled={loading} className="min-h-12 rounded-xl mb-4">
              {loading ? 'Saving Trip Data...' : 'Start Trip'}
            </Button>
            <Button variant="outline" onPress={onClose} className="min-h-12 rounded-xl">
              Cancel
            </Button>
          </MotiView>
        </ScrollView>
      </View>
    </Modal>
  );
}