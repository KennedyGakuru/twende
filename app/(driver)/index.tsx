import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from 'components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import CustomMapView from 'components/map/CustomMapView';
import TripFormModal from 'components/ui/TripFormModal';

type TripData = {
  routeId: string;
  vehicleId: string;
  routeName: string;
  vehiclePlate: string;
  vehicleLat: string;
  vehicleLng: string;
};

export default function DriverRouteScreen() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [tripData, setTripData] = useState<TripData | null>(null); // holds route + vehicle info
  const [currentLocation] = useState({
    latitude: -1.2864,
    longitude: 36.8172,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const handleShiftToggle = () => {
    if (!isOnDuty) {
      setShowTripForm(true); // show form first
    } else {
      setTripData(null); // clear trip info
      setIsOnDuty(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="pt-14 pb-4 px-6 bg-white">
        <Text className="font-heading text-2xl text-neutral-800">Your Route</Text>
        <Text className="font-sans text-neutral-600 mt-1">
          CBD to Westlands via Uhuru Highway
        </Text>
      </View>
      
      {/* Map View */}
      <View className="h-64">
     <View className="h-64">
     <CustomMapView region={currentLocation} showsUserLocation>
      <Marker coordinate={currentLocation}>
      <View className="bg-success-500 p-2 rounded-full">
        <Ionicons name="navigate" size={20} color="white" />
      </View>
      </Marker>
     </CustomMapView>
</View>

</View>

      
      {/* Status and Stats */}
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="font-sans-medium text-neutral-800">Status</Text>
            <Text className={`font-sans ${isOnDuty ? 'text-success-500' : 'text-neutral-500'}`}>
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </Text>
          </View>
          
          <Button
        variant={isOnDuty ? 'outline' : 'primary'}
        onPress={handleShiftToggle}
      >
        {isOnDuty ? 'End Shift' : 'Start Shift'}
      </Button>

      <TripFormModal
        visible={showTripForm}
        onClose={() => setShowTripForm(false)}
        onSubmit={(data) => {
          setTripData(data);
          setIsOnDuty(true);
        }}
      />
        </View>
        
        <View className="flex-row justify-between mb-6">
          <View className="items-center flex-1">
            <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mb-2">
              <Ionicons name='person' size={24} color="#0066ff" />
            </View>
            <Text className="font-heading text-xl text-neutral-800">24</Text>
            <Text className="font-sans text-neutral-500">Passengers</Text>
          </View>
          
          <View className="items-center flex-1">
            <View className="w-12 h-12 bg-success-100 rounded-full items-center justify-center mb-2">
              <Ionicons name='cash' size={24} color="#00cc99" />
            </View>
            <Text className="font-heading text-xl text-neutral-800">KES 4,500</Text>
            <Text className="font-sans text-neutral-500">Today's Earnings</Text>
          </View>
          
          <View className="items-center flex-1">
            <View className="w-12 h-12 bg-warning-100 rounded-full items-center justify-center mb-2">
              <Ionicons name='time' size={24} color="#f59e0b" />
            </View>
            <Text className="font-heading text-xl text-neutral-800">8h 30m</Text>
            <Text className="font-sans text-neutral-500">Time Active</Text>
          </View>
        </View>
        
        {/* Next Stops */}
        <Text className="font-heading text-lg text-neutral-800 mb-3">Next Stops</Text>
        <View className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
          <View className="p-4 flex-row items-center">
            <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center">
              <Text className="font-sans-bold text-primary-500">1</Text>
            </View>
            <View className="ml-3">
              <Text className="font-sans-medium text-neutral-800">University Way</Text>
              <Text className="font-sans text-neutral-500">2 minutes away</Text>
            </View>
          </View>
          
          <View className="p-4 flex-row items-center">
            <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center">
              <Text className="font-sans-bold text-primary-500">2</Text>
            </View>
            <View className="ml-3">
              <Text className="font-sans-medium text-neutral-800">Museum Hill</Text>
              <Text className="font-sans text-neutral-500">5 minutes away</Text>
            </View>
          </View>
          
          <View className="p-4 flex-row items-center">
            <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center">
              <Text className="font-sans-bold text-primary-500">3</Text>
            </View>
            <View className="ml-3">
              <Text className="font-sans-medium text-neutral-800">Westlands</Text>
              <Text className="font-sans text-neutral-500">10 minutes away</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}