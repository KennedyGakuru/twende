import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput, Platform, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from 'hooks/useLocation';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/ui/Button';
import { Link, router } from 'expo-router';
import { formatCurrency, getTimeBasedGreeting } from 'lib/utilis';
import CustomMapView from 'components/map/CustomMapView';
import { supabase } from 'lib/supabase';

const { width } = Dimensions.get('window');

const nearbyVehicles = [
  { id: '1', latitude: -1.2864, longitude: 36.8172, routeName: '105' },
  { id: '2', latitude: -1.2934, longitude: 36.8215, routeName: '237' },
  { id: '3', latitude: -1.2815, longitude: 36.8125, routeName: '111' },
];

type RouteRaw = {
  id: string;
  name: string;
  start_location: string;
  end_location: string;
  fare_amount: number;
  estimated_time: number;
};

export default function HomeScreen() {
  const { location, startWatchingLocation } = useLocation();
  const greeting = getTimeBasedGreeting();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [popularRoutes, setPopularRoutes] = useState<RouteRaw[]>([]);
  const [allPopularRoutes, setAllPopularRoutes] = useState<RouteRaw[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [mapRegion, setMapRegion] = useState({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    startWatchingLocation();
  }, []);

  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location]);

  const handleRoutePress = (routeId: string) => {
    router.push(`/route/${routeId}`);
  };

  const vehicleMarkers = nearbyVehicles.map(vehicle => ({
    coordinate: {
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
    },
    title: `Route ${vehicle.routeName}`,
    type: 'vehicle' as const,
    routes: vehicle.routeName,
  }));

  useEffect(() => {
    const fetchUserData = async () => {
      const session = supabase.auth.session();
      const user = session?.user;

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_name')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setUserName(data.user_name);
        } else {
          console.warn('Failed to fetch user name:', error?.message);
        }
      }

      setIsLoading(false);
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchRoutes = async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id,
          name,
          start_location,
          end_location,
          fare_amount,
          estimated_time
        `);

      if (error) {
        console.error('Error fetching routes:', error.message);
      } else {
        setPopularRoutes(data ?? []);
        setAllPopularRoutes(data ?? []);
      }

      setLoadingRoutes(false);
    };

    fetchRoutes();
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    setAllPopularRoutes(popularRoutes);
    setShowSearchInput(false);
  };

  function searchRoutes(text: string) {
    const filtered = popularRoutes.filter(route =>
      route.name.toLowerCase().includes(text.toLowerCase()) ||
      route.start_location.toLowerCase().includes(text.toLowerCase()) ||
      route.end_location.toLowerCase().includes(text.toLowerCase())
    );
    setSearchQuery(text);
    setAllPopularRoutes(filtered);
  }

  const routesToRender = searchQuery ? allPopularRoutes : popularRoutes;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="white" />
      {Platform.OS === 'android' && (
        <View style={{ height: StatusBar.currentHeight, backgroundColor: 'white' }} />
      )}

      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between bg-white">
        <View className="flex-1">
          <Text className="font-sans text-neutral-600">{greeting},</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <Text className="font-heading text-lg text-neutral-800">
              {userName ? ` ${userName}` : 'Guest'}! 👋
            </Text>
          )}
        </View>
        <TouchableOpacity className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center">
          <Ionicons name="menu" size={20} color="#404040" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        {showSearchInput ? (
          <View style={{
            backgroundColor: '#f5f5f5',
            borderRadius: 25,
            paddingHorizontal: 16,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="search" size={18} color="#737373" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                paddingVertical: 8,
                fontSize: 16,
                color: '#1f2937'
              }}
              placeholder="Where are you going..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={searchRoutes}
              autoFocus
            />
            <TouchableOpacity
              style={{ backgroundColor: '#ef4444', padding: 6, borderRadius: 20, marginLeft: 8 }}
              onPress={clearSearch}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 25,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onPress={() => setShowSearchInput(true)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="search" size={18} color="#737373" />
              <Text style={{ marginLeft: 8, color: '#9ca3af' }}>Where are you going...</Text>
            </View>
            <View style={{ backgroundColor: '#3b82f6', padding: 6, borderRadius: 20 }}>
              <Ionicons name="location" size={16} color="white" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View className="h-64 w-full">
        {location ? (
          <CustomMapView
            region={mapRegion}
            markers={vehicleMarkers}
            showsUserLocation
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-neutral-100">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        )}
      </View>

      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-heading text-lg text-neutral-800">Popular Routes</Text>
          <Button variant="text" size="sm">See All</Button>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {loadingRoutes ? (
            <Text className="text-neutral-500">Loading routes...</Text>
          ) : routesToRender.length === 0 ? (
            <Text className="text-neutral-500">No routes found.</Text>
          ) : (
            routesToRender.map((route) => (
              <TouchableOpacity
                key={route.id}
                className="bg-white mr-4 rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
                style={{ width: width * 0.75 }}
                onPress={() => handleRoutePress(route.id)}
              >
                <View className="p-4">
                  <Text className="font-heading text-base text-neutral-800 mb-2">{route.name}</Text>

                  <View className="flex-row items-center mb-1">
                    <Ionicons name="location" size={16} color="#404040" />
                    <Text className="font-sans text-neutral-600 ml-2">
                      {route.start_location} to {route.end_location}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mt-3">
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={16} color="#0066ff" />
                      <Text className="font-sans-medium text-neutral-700 ml-1">
                        {route.estimated_time} min
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Ionicons name="cash" size={16} color="#0066ff" />
                      <Text className="font-sans-medium text-neutral-700 ml-1">
                        {formatCurrency(route.fare_amount)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <View className="bg-white pb-6 pt-2 px-6 border-t border-neutral-200">
        <View className="flex-row justify-between">
          <Link href="/reporting" asChild>
            <Button
              variant="outline"
              leadingIcon={<Ionicons name="add" size={18} color="#525252" />}
              className="flex-1 mr-3"
            >
              Report Fare
            </Button>
          </Link>

          <Link href="/stages" asChild>
            <Button
              variant="primary"
              leadingIcon={<Ionicons name="location" size={18} color="white" />}
              className="flex-1"
            >
              Nearby Stages
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}
