import React, { useState } from 'react';
import { Modal, View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { MotiView } from 'moti';
import { Button } from 'components/ui/Button';
import { supabase } from 'lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

type TripFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    routeId: string;
    vehicleId: string;
    routeName: string;
    vehiclePlate: string;
    vehicleLat: string;
    vehicleLng: string;
  }) => void;
};

export default function TripFormModal({ visible, onClose, onSubmit }: TripFormModalProps) {
  const [routeName, setRouteName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [fareAmount, setFareAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [description, setDescription] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleSeats, setVehicleSeats] = useState('');
  const [vehicleLat, setVehicleLat] = useState('');
  const [vehicleLng, setVehicleLng] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const requiredFields = [
      { value: routeName, name: 'Route Name' },
      { value: startLocation, name: 'Start Location' },
      { value: endLocation, name: 'End Location' },
      { value: fareAmount, name: 'Fare Amount' },
      { value: vehiclePlate, name: 'Vehicle Plate' },
      { value: vehicleSeats, name: 'Vehicle Seats' },
      { value: vehicleLat, name: 'Latitude' },
      { value: vehicleLng, name: 'Longitude' }
    ];

    const missingFields = requiredFields.filter(field => !field.value.trim());
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Fields', 
        `Please fill in: ${missingFields.map(f => f.name).join(', ')}`
      );
      return false;
    }

    // Validate numeric fields
    const numericFields = [
      { value: fareAmount, name: 'Fare Amount' },
      { value: vehicleSeats, name: 'Vehicle Seats' },
      { value: vehicleLat, name: 'Latitude' },
      { value: vehicleLng, name: 'Longitude' }
    ];

    if (estimatedTime.trim()) {
      numericFields.push({ value: estimatedTime, name: 'Estimated Time' });
    }

    for (const field of numericFields) {
      if (isNaN(Number(field.value))) {
        Alert.alert('Invalid Input', `${field.name} must be a valid number`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const routeId = uuidv4();
    const vehicleId = uuidv4();

    try {
      console.log('Inserting route data...');

      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .insert({
          id: routeId,
          name: routeName,
          start_location: startLocation,
          end_location: endLocation,
          fare_amount: Number(fareAmount),
          estimated_time: estimatedTime ? Number(estimatedTime) : null,
          description: description || null,
          created_at: new Date().toISOString(),
        })
        .select();

      if (routeError) {
        console.error('Route insert error:', routeError);
        throw new Error(`Route creation failed: ${routeError.message}`);
      }

      console.log('Route inserted successfully, inserting vehicle...');

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          id: vehicleId,
          route_id: routeId,
          plate_number: vehiclePlate,
          capacity: Number(vehicleSeats),
          available: Number(vehicleSeats),
          latitude: Number(vehicleLat),
          longitude: Number(vehicleLng),
          created_at: new Date().toISOString(),
        })
        .select();

      if (vehicleError) {
        console.error('Vehicle insert error:', vehicleError);
        // Clean up the route if vehicle insertion fails
        await supabase.from('routes').delete().eq('id', routeId);
        throw new Error(`Vehicle creation failed: ${vehicleError.message}`);
      }

      console.log('Vehicle inserted successfully');

      // Clear form
      setRouteName('');
      setStartLocation('');
      setEndLocation('');
      setFareAmount('');
      setEstimatedTime('');
      setDescription('');
      setVehiclePlate('');
      setVehicleSeats('');
      setVehicleLat('');
      setVehicleLng('');

      onSubmit({ routeId, vehicleId, routeName, vehiclePlate, vehicleLat, vehicleLng });
      onClose();
      
      Alert.alert('Success', 'Trip created successfully!');
    } catch (err) {
      console.error('Submission error:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      Alert.alert('Submission Error', message);
    } finally {
      setLoading(false);
    }
  };

  const routeInputs = [
    { placeholder: 'Route Name *', state: routeName, setState: setRouteName },
    { placeholder: 'Start Location *', state: startLocation, setState: setStartLocation },
    { placeholder: 'End Location *', state: endLocation, setState: setEndLocation },
    { placeholder: 'Fare Amount (KES) *', state: fareAmount, setState: setFareAmount, keyboardType: 'numeric' as const },
    { placeholder: 'Estimated Time (min)', state: estimatedTime, setState: setEstimatedTime, keyboardType: 'numeric' as const },
    { placeholder: 'Description', state: description, setState: setDescription, multiline: true },
  ];

  const vehicleInputs = [
    { placeholder: 'Plate Number *', state: vehiclePlate, setState: setVehiclePlate },
    { placeholder: 'Available Seats *', state: vehicleSeats, setState: setVehicleSeats, keyboardType: 'numeric' as const },
    { placeholder: 'Latitude *', state: vehicleLat, setState: setVehicleLat, keyboardType: 'numeric' as const },
    { placeholder: 'Longitude *', state: vehicleLng, setState: setVehicleLng, keyboardType: 'numeric' as const },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            className="mb-8"
          >
            <Text className="text-3xl font-bold text-gray-800 mb-2">Add New Route</Text>
            <Text className="text-base text-gray-600">Create a new route and assign a vehicle</Text>
          </MotiView>

          {/* Route Details Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200, duration: 400 }}
            className="mb-8"
          >
            <Text className="text-xl font-semibold text-gray-700 mb-4">Route Details</Text>
            <View className="space-y-4">
              {routeInputs.map((input, index) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 300 + index * 100, duration: 300 }}
                  className="w-full"
                  style={{ marginBottom: 16 }}
                >
                  <TextInput
                    placeholder={input.placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={input.state}
                    onChangeText={input.setState}
                    keyboardType={input.keyboardType}
                    multiline={input.multiline}
                    numberOfLines={input.multiline ? 3 : 1}
                    className={`border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white ${
                      input.multiline ? 'min-h-20 pt-3' : 'min-h-12'
                    }`}
                    style={{ textAlignVertical: input.multiline ? 'top' : 'center' }}
                  />
                </MotiView>
              ))}
            </View>
          </MotiView>

          {/* Vehicle Details Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 800, duration: 400 }}
            className="mb-8"
          >
            <Text className="text-xl font-semibold text-gray-700 mb-4">Vehicle Information</Text>
            <View className="space-y-4">
              {vehicleInputs.map((input, index) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 900 + index * 100, duration: 300 }}
                  className="w-full"
                  style={{ marginBottom: 16 }}
                >
                  <TextInput
                    placeholder={input.placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={input.state}
                    onChangeText={input.setState}
                    keyboardType={input.keyboardType}
                    className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 bg-white min-h-12"
                  />
                </MotiView>
              ))}
            </View>
          </MotiView>

          {/* Action Buttons */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1300, duration: 400 }}
            className="mt-4 space-y-3"
          >
            <Button
              onPress={handleSubmit}
              disabled={loading}
              className="min-h-12 rounded-xl"
            >
              {loading ? 'Creating Route...' : 'Create Route'}
            </Button>
            
            <Button
              variant="outline"
              onPress={onClose}
              className="min-h-12 rounded-xl"
            >
              Cancel
            </Button>
          </MotiView>
        </ScrollView>
      </View>
    </Modal>
  );
}