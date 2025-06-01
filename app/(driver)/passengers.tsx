{/*import React, { useState } from 'react';
import { ScrollView, TextInput, Alert, Text, View } from 'react-native';
import { Button } from 'components/ui/Button';
import { MotiView } from 'moti';
import { supabase } from 'lib/supabase'; 
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function CreateRouteScreen() {
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

  const handleSubmit = async () => {
    // Basic validation
    if (!routeName || !startLocation || !endLocation || !fareAmount || !estimatedTime || !vehiclePlate || !vehicleSeats || !vehicleLat || !vehicleLng) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const routeId = uuidv4();
      const vehicleId = uuidv4();

      // Insert route
      let { error: routeError } = await supabase
        .from('routes')
        .insert({
          id: routeId,
          name: routeName,
          start_location: startLocation,
          end_location: endLocation,
          fare_amount: Number(fareAmount),
          estimated_time: Number(estimatedTime),
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (routeError) throw routeError;

      // Insert vehicle linked to route
      let { error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          id: vehicleId,
          route_id: routeId,
          plate_number: vehiclePlate,
          capacity: Number(vehicleSeats),
          available: Number(vehicleSeats), // assuming initially all seats available
          latitude: Number(vehicleLat),
          longitude: Number(vehicleLng),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (vehicleError) throw vehicleError;

      Alert.alert('Success', 'Route and vehicle created successfully!');

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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  */}
{/*
  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12 space-y-8">
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
      >
        <Text className="text-2xl font-bold text-neutral-800">Add New Route</Text>
      </MotiView>
*/}
      {/* ROUTE DETAILS */}
    {/*    <View className="space-y-4">
        {[
          { placeholder: 'Route Name', state: routeName, setState: setRouteName },
          { placeholder: 'Start Location', state: startLocation, setState: setStartLocation },
          { placeholder: 'End Location', state: endLocation, setState: setEndLocation },
          { placeholder: 'Fare Amount (KES)', state: fareAmount, setState: setFareAmount, keyboardType: 'numeric' as const },
          { placeholder: 'Estimated Time (min)', state: estimatedTime, setState: setEstimatedTime, keyboardType: 'numeric' as const },
          { placeholder: 'Description', state: description, setState: setDescription, multiline: true },
        ].map((input, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 * index, duration: 300 }}
          >
            <TextInput
              placeholder={input.placeholder}
              value={input.state}
              onChangeText={input.setState}
              keyboardType={input.keyboardType}
              multiline={input.multiline}
              className="border border-neutral-300 rounded-xl px-4 py-3 text-base mt-4"
            />
          </MotiView>
        ))}
      </View>
      
      
*/}
      {/* VEHICLE DETAILS */}
  {/*    <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 600, duration: 400 }}
      >
        <Text className="text-xl font-semibold text-neutral-700 pt-4">Vehicle Info</Text>
      </MotiView>

      <View className="space-y-4">
        {[
          { placeholder: 'Plate Number', state: vehiclePlate, setState: setVehiclePlate },
          { placeholder: 'Available Seats', state: vehicleSeats, setState: setVehicleSeats, keyboardType: 'numeric' as const },
          { placeholder: 'Latitude', state: vehicleLat, setState: setVehicleLat, keyboardType: 'numeric' as const },
          { placeholder: 'Longitude', state: vehicleLng, setState: setVehicleLng, keyboardType: 'numeric' as const },
        ].map((input, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 700 + index * 100, duration: 300 }}
          >
            <TextInput
              placeholder={input.placeholder}
              value={input.state}
              onChangeText={input.setState}
              keyboardType={input.keyboardType}
              className="border border-neutral-300 rounded-xl px-4 py-3 text-base mt-4"
            />
          </MotiView>
        ))}
      </View>

      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1200, duration: 400 }}
      >
        <Button
          className="mt-4"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Route'}
        </Button>
      </MotiView>
    </ScrollView>
  );
}
*/}
