import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

export default function SaccoDashboardScreen() {
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [65000, 59000, 80000, 81000, 56000, 95000, 70000],
      },
    ],
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="pt-14 pb-4 px-6 bg-white">
        <Text className="font-heading text-2xl text-neutral-800">Dashboard</Text>
        <Text className="font-sans text-neutral-600 mt-1">
          Metro Shuttle SACCO Overview
        </Text>
      </View>
      
      <ScrollView className="flex-1 px-6">
        {/* Quick Stats */}
        <View className="flex-row flex-wrap -mx-2 mt-4">
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-white p-4 rounded-xl border border-neutral-200">
              <View className="w-10 h-10 bg-warning-100 rounded-full items-center justify-center mb-2">
                <Ionicons name='bus' size={20} color="#f59e0b" />
              </View>
              <Text className="font-heading text-2xl text-neutral-800">42</Text>
              <Text className="font-sans text-neutral-500">Active Vehicles</Text>
            </View>
          </View>
          
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-white p-4 rounded-xl border border-neutral-200">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mb-2">
                <Ionicons name='person' size={20} color="#0066ff" />
              </View>
              <Text className="font-heading text-2xl text-neutral-800">56</Text>
              <Text className="font-sans text-neutral-500">Total Drivers</Text>
            </View>
          </View>
          
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-white p-4 rounded-xl border border-neutral-200">
              <View className="w-10 h-10 bg-success-100 rounded-full items-center justify-center mb-2">
                <Ionicons name='cash' size={20} color="#00cc99" />
              </View>
              <Text className="font-heading text-2xl text-neutral-800">95K</Text>
              <Text className="font-sans text-neutral-500">Today's Revenue</Text>
            </View>
          </View>
          
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-white p-4 rounded-xl border border-neutral-200">
              <View className="w-10 h-10 bg-error-100 rounded-full items-center justify-center mb-2">
                <Ionicons name='alert' size={20} color="#ef4444" />
              </View>
              <Text className="font-heading text-2xl text-neutral-800">3</Text>
              <Text className="font-sans text-neutral-500">Issues Reported</Text>
            </View>
          </View>
        </View>
        
        {/* Revenue Chart */}
        <View className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-heading text-lg text-neutral-800">Weekly Revenue</Text>
            <View className="flex-row items-center">
              <Ionicons name='chevron-up' size={16} color="#00cc99" />
              <Text className="font-sans-medium text-success-500 ml-1">+12.5%</Text>
            </View>
          </View>
          
          <LineChart
            data={chartData}
            width={320}
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(246, 153, 11, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
        
        {/* Active Routes */}
        <Text className="font-heading text-lg text-neutral-800 mb-3">Active Routes</Text>
        <View className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200 mb-6">
          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-warning-100 rounded-full items-center justify-center">
                <Ionicons name='map-sharp' size={20} color="#f59e0b" />
              </View>
              <View className="ml-3">
                <Text className="font-sans-medium text-neutral-800">CBD - Westlands</Text>
                <Text className="font-sans text-neutral-500">8 vehicles active</Text>
              </View>
            </View>
            <Text className="font-sans-medium text-success-500">KES 25,000</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-warning-100 rounded-full items-center justify-center">
                <Ionicons name='map-sharp' size={20} color="#f59e0b" />
              </View>
              <View className="ml-3">
                <Text className="font-sans-medium text-neutral-800">CBD - Eastleigh</Text>
                <Text className="font-sans text-neutral-500">6 vehicles active</Text>
              </View>
            </View>
            <Text className="font-sans-medium text-success-500">KES 18,500</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-warning-100 rounded-full items-center justify-center">
                <Ionicons name='map-sharp' size={20} color="#f59e0b" />
              </View>
              <View className="ml-3">
                <Text className="font-sans-medium text-neutral-800">Westlands - Karen</Text>
                <Text className="font-sans text-neutral-500">5 vehicles active</Text>
              </View>
            </View>
            <Text className="font-sans-medium text-success-500">KES 15,000</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}