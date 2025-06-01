import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, MapViewProps } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInRight, } from 'react-native-reanimated';
import { JSX } from 'nativewind/jsx-runtime';
import { supabase } from 'lib/supabase';

type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  trailingIcon?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({ children, onPress, className, trailingIcon }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#2563eb', 
      paddingVertical: 10, 
      paddingHorizontal: 16,
      borderRadius: 8 
    }}
  >
    <Text style={{ 
      color: 'white', 
      fontWeight: '600', 
      marginRight: trailingIcon ? 6 : 0 
    }}>{children}</Text>
    {trailingIcon}
  </TouchableOpacity>
);

type Location = { latitude: number; longitude: number } | null;

const useLocation = () => {
  const [location, setLocation] = useState<Location>(null);

  const startWatchingLocation = () => {
    setTimeout(() => {
      setLocation({ latitude: -1.286389, longitude: 36.817223 });
    }, 2000);
  };

  return { location, startWatchingLocation };
};

const CustomMapView = (props: JSX.IntrinsicAttributes & JSX.IntrinsicClassAttributes<MapView> & Readonly<MapViewProps>) => (
  <MapView
    provider={PROVIDER_GOOGLE}
    {...props}
  >
    {props.children}
  </MapView>
);

type Stage = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: number;
  congestion: 'low' | 'medium' | 'high' | string;
};

export default function StagesScreen() {
  const router = useRouter();
  const { location, startWatchingLocation } = useLocation();
  const [stages, setStages] = useState<Stage[]>([]);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  const [mapRegion, setMapRegion] = useState({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'routes' | 'congestion'>('name');

  useEffect(() => {
    startWatchingLocation();
    fetchStages();
  }, []);

  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [location]);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('stages').select('*');
      
      if (error) {
        throw error;
      }

      if (data) {
        const stagesData = data.map(stage => ({
          id: stage.id || 'unknown',
          name: stage.name || 'Unknown Stage',
          latitude: stage.latitude || 0,
          longitude: stage.longitude || 0,
          routes: stage.routes || 0,
          congestion: stage.congestion || 'unknown'
        }));
        setStages(stagesData);
        setAllStages(stagesData);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch stages');
      }
      console.error('Error fetching stages:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchRoutes = (query: string) => {
    if (!query.trim()) {
      setStages(allStages);
      return;
    }

    const filtered = allStages.filter(stage => 
      stage.name.toLowerCase().includes(query.toLowerCase()) ||
      stage.routes.toString().includes(query)
    );
    
    setStages(filtered);
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    searchRoutes(term);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setStages(allStages);
    setShowSearchInput(false);
  };

  const handleStagePress = (stageId: string) => {
    setSelectedStage(stageId);
    const stage = stages.find(s => s.id === stageId);
    if (stage) {
      setMapRegion({
        latitude: stage.latitude,
        longitude: stage.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#737373';
    }
  };

  const sortedStages = [...stages].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'routes') return b.routes - a.routes;
    if (sortBy === 'congestion') {
      const congestionOrder = { high: 3, medium: 2, low: 1, unknown: 0 };
      return congestionOrder[b.congestion as keyof typeof congestionOrder] - 
             congestionOrder[a.congestion as keyof typeof congestionOrder];
    }
    return 0;
  });

  const renderStageItem = ({ item, index }: { item: Stage; index: number }) => (
    <Animated.View
      entering={SlideInRight.delay(index * 50)}
      style={{
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        padding: 16,
        backgroundColor: selectedStage === item.id ? '#eff6ff' : 'white',
        borderColor: selectedStage === item.id ? '#3b82f6' : '#e5e5e5',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleStagePress(item.id)}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>{item.name}</Text>
        <Text style={{ color: '#6b7280', marginTop: 4 }}>{item.routes} routes available</Text>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ 
            width: 12, 
            height: 12, 
            borderRadius: 6, 
            backgroundColor: getCongestionColor(item.congestion) 
          }} />
          <Text style={{ marginLeft: 8, textTransform: 'capitalize', color: '#374151' }}>
            {item.congestion} congestion
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const handleNavigateToDetails = (stageId: string) => {
    try {
      router.push({
        pathname: "/(tabs)/stages/details" as any,
        params: { id: stageId }
      });
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <Text style={{ fontSize: 18, color: '#ef4444' }}>{error}</Text>
        <Button onPress={fetchStages}>
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingTop: 24, paddingBottom: 16, paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937' }}>Matatu Stages</Text>
        <Text style={{ color: '#6b7280', marginTop: 4 }}>Find stages and available routes</Text>
      </View>

      {/* Search Bar */}
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
              placeholder="Search routes..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchRoutes(text);
              }}
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
              <Text style={{ marginLeft: 8, color: '#9ca3af' }}>Search routes...</Text>
            </View>
            <View style={{ backgroundColor: '#3b82f6', padding: 6, borderRadius: 20 }}>
              <Ionicons name="location" size={16} color="white" />
            </View>
          </TouchableOpacity>
        )}
        
        {/* Quick search buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
        >
          {['CBD', 'Westlands', 'Karen', 'Eastlands', 'Odeon'].map((term) => (
            <TouchableOpacity
              key={term}
              style={{
                backgroundColor: searchQuery === term ? '#3b82f6' : '#e5e7eb',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginRight: 8
              }}
              onPress={() => handleQuickSearch(term)}
            >
              <Text style={{ 
                color: searchQuery === term ? 'white' : '#374151', 
                fontSize: 14 
              }}>{term}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* View toggle and sort controls */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 24, 
        marginBottom: 12 
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#f5f5f5', 
          padding: 4, 
          borderRadius: 8 
        }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: viewMode === 'map' ? 'white' : 'transparent',
              shadowColor: viewMode === 'map' ? '#000' : 'transparent',
              shadowOffset: viewMode === 'map' ? { width: 0, height: 1 } : { width: 0, height: 0 },
              shadowOpacity: viewMode === 'map' ? 0.1 : 0,
              shadowRadius: viewMode === 'map' ? 2 : 0,
              elevation: viewMode === 'map' ? 2 : 0,
            }}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={16} color={viewMode === 'map' ? '#3b82f6' : '#737373'} />
            <Text style={{ 
              marginLeft: 4, 
              fontWeight: '500', 
              color: viewMode === 'map' ? '#3b82f6' : '#6b7280' 
            }}>Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
              shadowColor: viewMode === 'list' ? '#000' : 'transparent',
              shadowOffset: viewMode === 'list' ? { width: 0, height: 1 } : { width: 0, height: 0 },
              shadowOpacity: viewMode === 'list' ? 0.1 : 0,
              shadowRadius: viewMode === 'list' ? 2 : 0,
              elevation: viewMode === 'list' ? 2 : 0,
            }}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? '#3b82f6' : '#737373'} />
            <Text style={{ 
              marginLeft: 4, 
              fontWeight: '500', 
              color: viewMode === 'list' ? '#3b82f6' : '#6b7280' 
            }}>List</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6
          }}
          onPress={() => {
            if (sortBy === 'name') setSortBy('routes');
            else if (sortBy === 'routes') setSortBy('congestion');
            else setSortBy('name');
          }}
        >
          <Text style={{ color: '#6b7280', marginRight: 4 }}>
            Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          </Text>
          <Ionicons name="caret-down" size={16} color="#737373" />
        </TouchableOpacity>
      </View>

      {/* Search Results Info */}
      {searchQuery && (
        <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            {stages.length} results for "{searchQuery}"
          </Text>
        </View>
      )}

      {/* Main Content */}
      {viewMode === 'map' ? (
        <View style={{ flex: 1, minHeight: 300 }}>
          <CustomMapView
            style={{ flex: 1 }}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onRegionChangeComplete={setMapRegion}
          >
            {stages.map((stage) => (
              <Marker
                key={stage.id}
                coordinate={{
                  latitude: stage.latitude,
                  longitude: stage.longitude,
                }}
                pinColor={getCongestionColor(stage.congestion)}
                onPress={() => handleStagePress(stage.id)}
              >
                <Callout tooltip>
                  <TouchableOpacity
                    style={{
                      backgroundColor: 'white',
                      padding: 16,
                      borderRadius: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                    }}
                    onPress={() => handleNavigateToDetails(stage.id)}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '600' }}>{stage.name}</Text>
                    <Text style={{ color: '#6b7280' }}>{stage.routes} routes</Text>
                    <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="speedometer" size={16} color={getCongestionColor(stage.congestion)} />
                      <Text style={{ 
                        marginLeft: 4, 
                        color: '#1f2937', 
                        textTransform: 'capitalize' 
                      }}>{stage.congestion} congestion</Text>
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <Button trailingIcon={<Ionicons name="chevron-forward" size={16} color="white" />}>
                        View Routes
                      </Button>
                    </View>
                  </TouchableOpacity>
                </Callout>
              </Marker>
            ))}
          </CustomMapView>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={sortedStages}
            renderItem={renderStageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ 
              paddingHorizontal: 24, 
              paddingBottom: 30,
              flexGrow: 1
            }}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </View>
      )}
    </SafeAreaView>
  );
}