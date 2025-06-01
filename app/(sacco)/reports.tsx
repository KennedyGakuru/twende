import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsScreen() {
  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <StatusBar style="dark" />
      <Text className="text-2xl font-heading text-neutral-800 mb-6">Daily Reports</Text>

      {/* Summary Cards */}
      <View className="flex-row justify-between mb-6">
        <View className="bg-primary-100 p-4 rounded-xl flex-1 mr-2">
          <Ionicons name="car" size={24} color="#4f46e5" />
          <Text className="mt-2 font-heading text-xl text-neutral-800">120</Text>
          <Text className="text-neutral-500">Trips Today</Text>
        </View>

        <View className="bg-success-100 p-4 rounded-xl flex-1 mx-2">
          <Ionicons name="cash" size={24} color="#059669" />
          <Text className="mt-2 font-heading text-xl text-neutral-800">KES 85,000</Text>
          <Text className="text-neutral-500">Total Earnings</Text>
        </View>

        <View className="bg-warning-100 p-4 rounded-xl flex-1 ml-2">
          <Ionicons name="time" size={24} color="#f59e0b" />
          <Text className="mt-2 font-heading text-xl text-neutral-800">320h</Text>
          <Text className="text-neutral-500">Total Hours</Text>
        </View>
      </View>

      {/* Route Breakdown */}
      <Text className="font-heading text-lg text-neutral-800 mb-3">By Route</Text>
      <View className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
        <View className="p-4 flex-row justify-between">
          <Text className="text-neutral-800">CBD - Westlands</Text>
          <Text className="text-neutral-600">KES 25,000</Text>
        </View>
        <View className="p-4 flex-row justify-between">
          <Text className="text-neutral-800">CBD - Rongai</Text>
          <Text className="text-neutral-600">KES 30,000</Text>
        </View>
        <View className="p-4 flex-row justify-between">
          <Text className="text-neutral-800">CBD - Umoja</Text>
          <Text className="text-neutral-600">KES 30,000</Text>
        </View>
      </View>
    </View>
  );
}
