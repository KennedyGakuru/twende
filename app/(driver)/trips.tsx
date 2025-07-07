import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

const mockTrips = [
  {
    id: 'trip-1',
    status: 'upcoming',
    route: 'CBD - Rongai',
    date: '2025-06-10',
    time: '09:00 AM',
    fare: 70,
  },
  {
    id: 'trip-2',
    status: 'completed',
    route: 'CBD - Kahawa West',
    date: '2025-06-07',
    time: '05:30 PM',
    fare: 80,
  },
  {
    id: 'trip-3',
    status: 'cancelled',
    route: 'CBD - Gikambura',
    date: '2025-06-05',
    time: '11:15 AM',
    fare: 50,
  },
];

const statusTabs = ['upcoming', 'completed', 'cancelled'];

export default function TripsScreen() {
  const [selectedStatus, setSelectedStatus] = useState('upcoming');

  const filteredTrips = mockTrips.filter(trip => trip.status === selectedStatus);

  return (
    <View className="flex-1 bg-white dark:bg-black px-4 pt-6 ">
      <Text className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">My Trips</Text>

      {/* Status Tabs */}
      <View className="flex-row justify-around mb-4">
        {statusTabs.map(status => (
          <TouchableOpacity
            key={status}
            className={twMerge(
              'px-4 py-2 rounded-full',
              selectedStatus === status
                ? 'bg-primary-500'
                : 'bg-gray-200 dark:bg-gray-700'
            )}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              className={twMerge(
                'text-sm font-medium',
                selectedStatus === status
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-200'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip List */}
      {filteredTrips.length > 0 ? (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-lg font-semibold text-gray-800 dark:text-white">
                  {item.route}
                </Text>
                <Text className="text-primary-600 font-medium">{item.fare} KES</Text>
              </View>
              <Text className="text-gray-500 dark:text-gray-400">{item.date} • {item.time}</Text>
            </View>
          )}
        />
      ) : (
        <View className="items-center mt-10">
          <Ionicons name="information-circle-outline" size={40} color="#888" />
          <Text className="text-gray-600 dark:text-gray-300 mt-2">No {selectedStatus} trips</Text>
        </View>
      )}
    </View>
  );
}
