import React from 'react';
import { View, Text, FlatList, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const fleetData = [
  { id: '1', name: 'Matatu 001', route: 'CBD - Westlands' },
  { id: '2', name: 'Matatu 002', route: 'CBD - Rongai' },
  { id: '3', name: 'Matatu 003', route: 'CBD - Umoja' },
];

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-14">
      <StatusBar style="dark" />
      <Text className="text-3xl font-bold text-neutral-800 mb-4">Fleet Overview</Text>

      <FlatList
        data={fleetData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-gray-100 p-4 rounded-xl mb-3">
            <Text className="text-lg font-semibold text-neutral-700">{item.name}</Text>
            <Text className="text-neutral-500">Route: {item.route}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}