import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Button } from 'components/ui/Button';
import { supabase } from 'lib/supabase';
import { decode } from '@mapbox/polyline'

const GOOGLE_API_KEY = 'AIzaSyBveic9ewdcYa6JBtTLQ1wjvH-LMMW4vMI'; 

export default function AdminRoutesScreen() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('routes').select('*');
    if (error) {
      Alert.alert('Error fetching routes', error.message);
    } else {
      setRoutes(data);
    }
    setLoading(false);
  };

  const generateRoutePath = async (route: { start_lat: any; start_lng: any; end_lat: any; end_lng: any; id: any; }) => {
    try {
      const origin = `${route.start_lat},${route.start_lng}`;
      const destination = `${route.end_lat},${route.end_lng}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const json = await response.json();

      if (!json.routes || !json.routes[0]) {
        throw new Error('No route found');
      }

      const encodedPolyline = json.routes[0].overview_polyline.points;
      const decodedPoints = decode(encodedPolyline);

      const formattedPoints = decodedPoints.map(([lat, lng], index) => ({
        route_id: route.id,
        latitude: lat,
        longitude: lng,
        point_order: index,
      }));

      // Optional: Clear existing coordinates for this route
      await supabase.from('route_coordinates').delete().eq('route_id', route.id);

      const { error: insertError } = await supabase.from('route_coordinates').insert(formattedPoints);
      if (insertError) {
        throw insertError;
      }

      Alert.alert('✅ Success', `Route generated with ${formattedPoints.length} points!`);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      Alert.alert('❌ Error generating route', errorMessage);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-2 text-gray-500">Loading routes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-white dark:bg-black">
      <Text className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Sacco Routes
      </Text>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={fetchRoutes}
        renderItem={({ item }) => (
          <View className="p-4 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow">
            <Text className="text-lg font-semibold text-black dark:text-white">{item.name}</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              {item.start_location} ➜ {item.end_location}
            </Text>
            <Button
              className="mt-3 bg-green-600"
              onPress={() => generateRoutePath(item)}
            >
              Generate Road Route
            </Button>
          </View>
        )}
      />
    </View>
  );
}
