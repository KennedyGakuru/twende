import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  // Replace these with real data later
  const totalTrips = 42;
  const totalEarnings = 2940;
  const totalDistance = 128; // km

  const weeklyData = [
    { day: 'Mon', trips: 5 },
    { day: 'Tue', trips: 8 },
    { day: 'Wed', trips: 7 },
    { day: 'Thu', trips: 6 },
    { day: 'Fri', trips: 10 },
    { day: 'Sat', trips: 4 },
    { day: 'Sun', trips: 2 },
  ];

  return (
    
    <ScrollView className="flex-1 bg-white dark:bg-black px-4 pt-6">
      <Text className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Analytics</Text>

      {/* Stats Cards */}
      <View className="flex-row justify-between mb-4">
        <View className="bg-primary-100 dark:bg-primary-900 p-4 rounded-xl w-[31%]">
          <Text className="text-gray-700 dark:text-white text-sm mb-1">Trips</Text>
          <Text className="text-xl font-bold text-primary-600 dark:text-primary-300">{totalTrips}</Text>
        </View>

        <View className="bg-primary-100 dark:bg-primary-900 p-4 rounded-xl w-[31%]">
          <Text className="text-gray-700 dark:text-white text-sm mb-1">Earnings</Text>
          <Text className="text-xl font-bold text-primary-600 dark:text-primary-300">{totalEarnings} KES</Text>
        </View>

        <View className="bg-primary-100 dark:bg-primary-900 p-4 rounded-xl w-[31%]">
          <Text className="text-gray-700 dark:text-white text-sm mb-1">Distance</Text>
          <Text className="text-xl font-bold text-primary-600 dark:text-primary-300">{totalDistance} km</Text>
        </View>
      </View>

      {/* Mock Chart */}
      <Text className="text-lg font-semibold text-gray-800 dark:text-white mb-2">This Week</Text>
      <View className="flex-row items-end justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-xl h-40">
        {weeklyData.map((item, index) => (
          <View key={index} className="items-center">
            <View
              className="w-3 bg-primary-500 dark:bg-primary-300 rounded"
              style={{ height: item.trips * 8 }}
            />
            <Text className="text-xs mt-1 text-gray-600 dark:text-gray-300">{item.day}</Text>
          </View>
        ))}
      </View>

      {/* Feedback placeholder */}
      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Driver Rating</Text>
        <View className="flex-row items-center">
          <Ionicons name="star" size={20} color="#fbbf24" />
          <Ionicons name="star" size={20} color="#fbbf24" />
          <Ionicons name="star" size={20} color="#fbbf24" />
          <Ionicons name="star-half" size={20} color="#fbbf24" />
          <Ionicons name="star-outline" size={20} color="#fbbf24" />
          <Text className="ml-2 text-gray-600 dark:text-gray-300">(3.5)</Text>
        </View>
      </View>
    </ScrollView>
  );
}
