import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from 'lib/supabase'; 

export default function CreateStageScreen() {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [congestion, setCongestion] = useState('');

  const handleSubmit = async () => {
    if (!name || !latitude || !longitude || !congestion) {
      Alert.alert('All fields are required');
      return;
    }

    const { error } = await supabase.from('stages').insert({
      name,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      congestion,
    });

    if (error) {
      Alert.alert('Error creating stage', error.message);
    } else {
      Alert.alert('Stage created successfully!');
      setName('');
      setLatitude('');
      setLongitude('');
      setCongestion('');
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
        keyboardType="numeric"
        className="border border-neutral-300 p-3 rounded-xl mb-4"
      />
      <TextInput
        placeholder="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
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
