import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from 'lib/supabase';

export default function CreateStageScreen() {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [routes, setRoutes] = useState('');
  const [congestion, setCongestion] = useState('');

  const handleSubmit = async () => {
    // Validate inputs
    if (!name || !latitude || !longitude || !routes || !congestion) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    // Validate congestion
    const allowedCongestion = ['low', 'medium', 'high'];
    if (!allowedCongestion.includes(congestion.toLowerCase())) {
      Alert.alert('Error', 'Congestion must be: low, medium, or high');
      return;
    }

    // Validate routes (must be integer)
    const routesNumber = parseInt(routes);
    if (isNaN(routesNumber)) {
      Alert.alert('Error', 'Routes must be a number');
      return;
    }

    // Validate coordinates
    const latNumber = parseFloat(latitude);
    const lngNumber = parseFloat(longitude);
    if (isNaN(latNumber) || isNaN(lngNumber)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    try {
      const { error } = await supabase.from('stages').insert({
        name,
        latitude: latNumber,
        longitude: lngNumber,
        routes: routesNumber,
        congestion: congestion.toLowerCase() 
      });

      if (error) throw error;

      Alert.alert('Success', 'Stage created successfully!');
      // Reset form
      setName('');
      setLatitude('');
      setLongitude('');
      setCongestion('');
      setRoutes('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create stage');
    }
  };

  return (
    <View className="flex-1 bg-white pt-14 px-6">
      <StatusBar style="dark" />
      <Text className="text-2xl font-heading text-neutral-800 mb-6">Create Stage</Text>

      <TextInput
        placeholder="Stage Name"
        value={name}
        onChangeText={setName}
        className="border border-neutral-300 p-3 rounded-xl mb-4"
      />

      <TextInput
        placeholder="Latitude"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numbers-and-punctuation"
        className="border border-neutral-300 p-3 rounded-xl mb-4"
      />

      <TextInput
        placeholder="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numbers-and-punctuation"
        className="border border-neutral-300 p-3 rounded-xl mb-4"
      />

      <TextInput
        placeholder="Number of Routes (integer)"
        value={routes}
        onChangeText={setRoutes}
        keyboardType="number-pad"
        className="border border-neutral-300 p-3 rounded-xl mb-4"
      />

      <TextInput
        placeholder="Congestion (low, medium, high)"
        value={congestion}
        onChangeText={setCongestion}
        className="border border-neutral-300 p-3 rounded-xl mb-6"
      />

      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-green-700 py-4 rounded-xl items-center"
      >
        <Text className="text-white text-lg font-bold">Submit Stage</Text>
      </TouchableOpacity>
    </View>
  );
}