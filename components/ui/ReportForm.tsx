import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/ui/Button';
import Slider from '@react-native-community/slider';

type Props = {
  reportType: 'fare' | 'traffic' | 'incident';
  popularRoutes: any[];
  onSubmit: (payload: any, tableName: string) => void;
  onCancel: () => void;
  handleGetLocation: () => void;
  location: { lat: number; lng: number } | null;
  formAnimatedStyle: any;
};

export const ReportForm = ({
  reportType,
  popularRoutes,
  onSubmit,
  onCancel,
  handleGetLocation,
  location,
  formAnimatedStyle,
}: Props) => {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [fareAmount, setFareAmount] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [congestionLevel, setCongestionLevel] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tableName = {
    fare: 'fare_reports',
    traffic: 'traffic_reports',
    incident: 'incident_reports',
  }[reportType];

  const handleSubmit = () => {
    if (!selectedRoute) {
      alert('Please select a route');
      return;
    }

    let payload: any = {
      route_id: selectedRoute,
      reported_at: new Date().toISOString(),
    };

    if (reportType === 'fare') {
      if (!fareAmount) return alert('Please enter fare amount');
      payload.fare_amount = parseFloat(fareAmount);
    }

    if (reportType === 'traffic') {
    if (!description || !congestionLevel || !location) {
    return alert('Please provide all traffic report details and add location');
     }
     payload.description = description;
     payload.congestion_level = congestionLevel;
     payload.location = location;
    }

   if (reportType === 'incident') {
  if (!incidentType || !description || !location) {
    return alert('Please complete all incident details and add location');
  }
    payload.incident_type = incidentType;
    payload.description = description;
   payload.location = location;
}


    setIsSubmitting(true);
    onSubmit(payload, tableName);
  };

  return (
    <ScrollView style={formAnimatedStyle}>
      <View className="pt-2">
        <Text className="font-sans-medium text-neutral-700 mb-3">Select a route:</Text>
        {popularRoutes.map((route) => (
          <TouchableOpacity
            key={route.id}
            className={`bg-white border rounded-xl p-4 mb-3 ${
              selectedRoute === route.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'
            }`}
            onPress={() => setSelectedRoute(route.id)}
          >
            <Text className="font-sans-medium text-neutral-800">{route.name}</Text>
          </TouchableOpacity>
        ))}

        {selectedRoute && (
          <>
            {reportType === 'fare' && (
              <>
                <Text className="font-sans-medium text-neutral-700 mt-2 mb-2">
                  Enter the new fare amount:
                </Text>
                <View className="bg-white border border-neutral-200 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="cash-outline" size={20} color="#737373" />
                    <TextInput
                      className="flex-1 ml-2 font-sans text-lg text-neutral-800"
                      placeholder="Enter amount"
                      value={fareAmount}
                      onChangeText={setFareAmount}
                      keyboardType="numeric"
                    />
                    <Text className="font-sans-medium text-neutral-700">KES</Text>
                  </View>
                </View>
              </>
            )}

            {reportType === 'traffic' && (
              <>
                <Text className="font-sans-medium text-neutral-700 mt-2 mb-2">
                  Describe the traffic situation:
                </Text>
                <TextInput
                  className="bg-white border border-neutral-200 rounded-xl p-4 mb-4 font-sans text-neutral-800"
                  placeholder="E.g., Heavy traffic at junction"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <Text className="font-sans-medium text-neutral-700 mb-2">Congestion Level:</Text>
                <View className="bg-white border border-neutral-200 rounded-xl p-4 mb-4">
                  <Slider
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={congestionLevel}
                    onValueChange={setCongestionLevel}
                  />
                  <Text className="text-neutral-700 font-sans mt-2">Level: {congestionLevel}</Text>
                </View>
              </>
            )}

            {reportType === 'incident' && (
              <>
                <Text className="font-sans-medium text-neutral-700 mt-2 mb-2">
                  Select incident type:
                </Text>
                <View className="bg-white border border-neutral-200 rounded-xl p-4 mb-4">
                  {['FIGHT', 'THEFT', 'HARASSMENT'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`py-2 px-3 rounded-lg mb-2 ${
                        incidentType === type
                          ? 'bg-red-100 border border-red-400'
                          : 'bg-neutral-100'
                      }`}
                      onPress={() => setIncidentType(type)}
                    >
                      <Text className="text-neutral-800 font-sans">{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  className="bg-white border border-neutral-200 rounded-xl p-4 mb-4 font-sans text-neutral-800"
                  placeholder="Describe the incident"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </>
            )}

            <View className="flex-row mb-4">
              <TouchableOpacity
                className="flex-row items-center bg-neutral-100 rounded-lg p-3 mr-3"
                onPress={handleGetLocation}
              >
                <Ionicons name="location-outline" size={18} color="#525252" />
                <Text className="font-sans text-neutral-700 ml-2">
                  {location ? 'Location added' : 'Add location'}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              variant="primary"
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth
              size="lg"
            >
              Submit Report
            </Button>

            <Button variant="text" onPress={onCancel} fullWidth className="mt-3">
              Cancel
            </Button>
          </>
        )}
      </View>
    </ScrollView>
  );
};
