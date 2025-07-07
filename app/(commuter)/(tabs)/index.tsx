import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput, Platform, StatusBar,Animated,RefreshControl} from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from 'hooks/useLocation';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/ui/Button';
import { Link, router } from 'expo-router';
import { formatCurrency, getTimeBasedGreeting } from 'lib/utilis';
import CustomMapView from 'components/map/CustomMapView';
import { supabase } from 'lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

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

const quickActions = [
  { id: 1, title: 'Live Tracking', icon: 'location', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 2, title: 'Route Planner', icon: 'map', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 3, title: 'Saved Routes', icon: 'bookmark', color: '#f59e0b', bgColor: '#fffbeb' },
  { id: 4, title: 'History', icon: 'time', color: '#8b5cf6', bgColor: '#f3e8ff' },
];

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
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [mapRegion, setMapRegion] = useState({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    startWatchingLocation();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
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

      if (!error) {
        setPopularRoutes(data ?? []);
        setAllPopularRoutes(data ?? []);
      }
      setLoadingRoutes(false);
    };

    fetchRoutes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

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
    <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={{
          paddingTop: Platform.OS === 'ios' ? 50 : ((StatusBar.currentHeight ?? 0) + 20),
          paddingBottom: 20,
          paddingHorizontal: 24,
        }}
      >
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View className="flex-1">
            <Text className="text-slate-600 text-base font-medium">{greeting}</Text>
            {isLoading ? (
              <View className="flex-row items-center mt-1">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="ml-2 text-slate-400">Loading...</Text>
              </View>
            ) : (
              <Text className="text-slate-900 text-2xl font-bold mt-1">
                {userName ? `${userName}! 👋` : 'Welcome! 👋'}
              </Text>
            )}
          </View>
          
          <TouchableOpacity className="relative">
            <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-lg border border-slate-100">
              <Ionicons name="notifications" size={24} color="#64748b" />
            </View>
            <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">3</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Section */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 24,
            marginTop: 8,
          }}
        >
          {showSearchInput ? (
            <BlurView intensity={80} className="rounded-2xl overflow-hidden">
              <View className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl">
                <View className="flex-row items-center">
                  <View className="flex-1 flex-row items-center bg-slate-100 rounded-xl px-4 py-3">
                    <Ionicons name="search" size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-3 text-slate-800 text-base"
                      placeholder="Where are you headed?"
                      placeholderTextColor="#94a3b8"
                      value={searchQuery}
                      onChangeText={searchRoutes}
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity
                    className="ml-3 w-12 h-12 bg-red-500 rounded-xl items-center justify-center"
                    onPress={clearSearch}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          ) : (
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100"
              onPress={() => setShowSearchInput(true)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center">
                    <Ionicons name="search" size={20} color="#3b82f6" />
                  </View>
                  <Text className="ml-3 text-slate-500 text-base">Where are you headed?</Text>
                </View>
                <View className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl items-center justify-center">
                  <Ionicons name="location" size={18} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Quick Actions */}
        {/*<Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            paddingHorizontal: 24,
            marginTop: 24,
          }}
        >
          <Text className="text-slate-800 text-lg font-bold mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                className="w-[48%] mb-4"
                activeOpacity={0.7}
              >
                <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: action.bgColor }}
                  >
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text className="text-slate-800 font-semibold text-sm">{action.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Live Map */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            paddingHorizontal: 24,
            marginTop: 8,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-800 text-lg font-bold">Live Vehicles</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-blue-600 font-semibold mr-1">View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          
          <View className="h-48 rounded-2xl overflow-hidden shadow-lg border border-slate-100">
            {location ? (
              <CustomMapView
                region={mapRegion}
                markers={vehicleMarkers}
                showsUserLocation
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-slate-100">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-slate-500 mt-2">Loading map...</Text>
              </View>
            )}
            
            {/* Map Overlay */}
            <View className="absolute top-4 left-4 bg-white/90 backdrop-blur-xl rounded-xl px-3 py-2">
              <Text className="text-slate-800 font-semibold text-sm">
                {nearbyVehicles.length} vehicles nearby
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Popular Routes */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            paddingHorizontal: 24,
            marginTop: 32,
            paddingBottom: 100,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-800 text-lg font-bold">Popular Routes</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-blue-600 font-semibold mr-1">See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {loadingRoutes ? (
              <View className="flex-row">
                {[1, 2, 3].map((i) => (
                  <View key={i} className="w-72 h-32 bg-slate-200 rounded-2xl mr-4 animate-pulse" />
                ))}
              </View>
            ) : routesToRender.length === 0 ? (
              <View className="w-72 h-32 bg-slate-100 rounded-2xl items-center justify-center">
                <Text className="text-slate-500">No routes found</Text>
              </View>
            ) : (
              routesToRender.map((route, index) => (
                <TouchableOpacity
                  key={route.id}
                  className="mr-4"
                  style={{ width: width * 0.8 }}
                  onPress={() => handleRoutePress(route.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    className="rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
                  >
                    <View className="p-5">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-slate-800 text-lg font-bold flex-1">
                          {route.name}
                        </Text>
                        <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                          <View className="w-3 h-3 bg-green-500 rounded-full" />
                        </View>
                      </View>

                      <View className="flex-row items-center mb-4">
                        <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                          <Ionicons name="location" size={16} color="#3b82f6" />
                        </View>
                        <Text className="text-slate-600 ml-3 flex-1" numberOfLines={1}>
                          {route.start_location} → {route.end_location}
                        </Text>
                      </View>

                      <View className="flex-row justify-between">
                        <View className="flex-row items-center bg-blue-50 rounded-xl px-3 py-2">
                          <Ionicons name="time" size={16} color="#3b82f6" />
                          <Text className="text-blue-700 font-semibold ml-2">
                            {route.estimated_time}min
                          </Text>
                        </View>

                        <View className="flex-row items-center bg-green-50 rounded-xl px-3 py-2">
                          <Ionicons name="cash" size={16} color="#10b981" />
                          <Text className="text-green-700 font-semibold ml-2">
                            {formatCurrency(route.fare_amount)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}