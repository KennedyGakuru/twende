import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/ui/Button';
import { useLocation } from 'hooks/useLocation';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, FadeIn, SlideInRight} from 'react-native-reanimated';
import { supabase } from 'lib/supabase';
import * as Location from 'expo-location';
import { ReportForm } from 'components/ui/ReportForm';

// Sample route data for reporting
const popularRoutes = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'CBD to Westlands', currentFare: 80 },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'CBD to Eastleigh', currentFare: 70 },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Westlands to Karen', currentFare: 120 },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'CBD to Ngong', currentFare: 100 },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Eastleigh to Kayole', currentFare: 50 },
];

// Reporting options
const reportTypes = [
  { id: 'fare', icon: <Ionicons name="cash-outline" size={20} color="#0066ff" />, title: 'Fare Update', description: 'Report new fare prices' },
  { id: 'traffic', icon: <Ionicons name="map-outline" size={20} color="#f59e0b" />, title: 'Traffic', description: 'Report congestion or delays' },
  { id: 'incident', icon: <Ionicons name="warning-outline" size={20} color="#ef4444" />, title: 'Incident', description: 'Report accidents or issues' },
];

export default function ReportingScreen() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [fareAmount, setFareAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [congestionLevel, setCongestionLevel] = useState(1);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const formOpacity = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  
  // Animated styles
  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
    };
  });
  
  const successAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: successOpacity.value,
    };
  });

  // Load recent reports on component mount
  useEffect(() => {
    fetchRecentReports();
  }, []);

  // Handle report type selection
  const handleSelectReportType = (reportId: string) => {
    setSelectedReport(reportId);
    setError(null); // Clear any previous errors
    formOpacity.value = withTiming(1, { duration: 400 });
  };
  
  // Handle route selection
  const handleSelectRoute = (routeId: string) => {
    setSelectedRoute(routeId);
    // Pre-fill current fare for the selected route
    const route = popularRoutes.find(r => r.id === routeId);
    setFareAmount(route ? route.currentFare.toString() : '');
  };
  
  // Get location for the report
  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your location. Please try again.');
    }
  };

  const fetchRecentReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch fare reports (this one should work)
      const { data: fareReports, error: fareError } = await supabase
        .from('fare_reports')
        .select('*, routes(name)')
        .order('reported_at', { ascending: false })
        .limit(5);

      // Fetch traffic reports with fallback
      let trafficReports = [];
      const { data: trafficData, error: trafficError } = await supabase
        .from('traffic_reports')
        .select('*, routes(name)')
        .order('reported_at', { ascending: false })
        .limit(5);

      if (trafficError) {
        console.warn('Traffic reports relationship error, fetching without routes:', trafficError);
        // Fallback: fetch without routes relationship
        const { data: trafficFallback, error: trafficFallbackError } = await supabase
          .from('traffic_reports')
          .select('*')
          .order('reported_at', { ascending: false })
          .limit(5);
        
        if (!trafficFallbackError && trafficFallback) {
          // Manually add route names from popularRoutes
          trafficReports = trafficFallback.map(report => ({
            ...report,
            routes: { 
              name: popularRoutes.find(r => r.id === report.route_id)?.name || 'Unknown Route' 
            }
          }));
        }
      } else {
        trafficReports = trafficData || [];
      }

      // Fetch incident reports with fallback
      let incidentReports = [];
      const { data: incidentData, error: incidentError } = await supabase
        .from('incident_reports')
        .select('*, routes(name)')
        .order('reported_at', { ascending: false })
        .limit(5);

      if (incidentError) {
        console.warn('Incident reports relationship error, fetching without routes:', incidentError);
        // Fallback: fetch without routes relationship
        const { data: incidentFallback, error: incidentFallbackError } = await supabase
          .from('incident_reports')
          .select('*')
          .order('reported_at', { ascending: false })
          .limit(5);
        
        if (!incidentFallbackError && incidentFallback) {
          // Manually add route names from popularRoutes
          incidentReports = incidentFallback.map(report => ({
            ...report,
            routes: { 
              name: popularRoutes.find(r => r.id === report.route_id)?.name || 'Unknown Route' 
            }
          }));
        }
      } else {
        incidentReports = incidentData || [];
      }

      // Only throw error if fare reports failed (since that's the main one)
      if (fareError) {
        console.error('Fare reports fetch error:', fareError);
        setError('Failed to load recent reports');
        return;
      }

      const combined = [
        ...(fareReports || []).map(r => ({ ...r, type: 'fare' })),
        ...trafficReports.map(r => ({ ...r, type: 'traffic' })),
        ...incidentReports.map(r => ({ ...r, type: 'incident' })),
      ];

      // Sort by date descending
      combined.sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());

      setRecentReports(combined.slice(0, 5)); // Limit to top 5
    } catch (error) {
      console.error('Unexpected error fetching reports:', error);
      setError('Failed to load recent reports');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setSelectedReport(null);
    setSelectedRoute(null);
    setFareAmount('');
    setDescription('');
    setIncidentType('');
    setLocation(null);
    setIsSuccess(false);
    setError(null);
    formOpacity.value = 0;
    successOpacity.value = 0;
  };
  
  // Submit report
  const handleSubmit = async () => {
    if (!selectedRoute || !selectedReport) {
      Alert.alert('Missing Info', 'Please select a report type and route');
      return;
    }

    // Get current user from Supabase auth - v1 method
    const user = supabase.auth.user();
    if (!user) {
      Alert.alert('Not signed in', 'You must be signed in to submit a report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let tableName = '';
    let payload: any = {};

    try {
      switch (selectedReport) {
        case 'fare':
          if (!fareAmount) throw new Error('Missing fare amount');
          const fareValue = parseFloat(fareAmount);
          if (isNaN(fareValue) || fareValue <= 0) throw new Error('Invalid fare amount');
          
          tableName = 'fare_reports';
          payload = {
            user_id: user.id,
            route_id: selectedRoute,
            fare_amount: fareValue,
            reported_at: new Date().toISOString(),
          };
          break;

        case 'traffic':
          if (!location) throw new Error('Location is required for traffic reports');
          tableName = 'traffic_reports';
          payload = {
            user_id: user.id,
            route_id: selectedRoute,
            location,
            congestion_level: congestionLevel,
            description: description || null,
            reported_at: new Date().toISOString(),
          };
          break;

        case 'incident':
          if (!incidentType || !location) throw new Error('Incident type and location are required');
          tableName = 'incident_reports';
          payload = {
            user_id: user.id,
            route_id: selectedRoute,
            incident_type: incidentType,
            description: description || null,
            location,
            reported_at: new Date().toISOString(),
          };
          break;

        default:
          throw new Error('Invalid report type');
      }

      const { error } = await supabase.from(tableName).insert(payload);
      if (error) throw error;

      // Success animation
      setIsSuccess(true);
      successOpacity.value = withTiming(1, { duration: 500 });

      // Refresh recent reports
      await fetchRecentReports();

      // Reset form after delay
      setTimeout(() => {
        successOpacity.value = withTiming(0, { duration: 300 });
        formOpacity.value = withTiming(0, { duration: 300 });
        
        setTimeout(() => {
          resetForm();
        }, 300);
      }, 2000);

    } catch (err) {
      let errorMessage = 'An error occurred while submitting your report';
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Submission failed:', err.message);
      } else {
        console.error('Submission failed:', err);
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get selected route details
  const getSelectedRouteDetails = () => {
    return popularRoutes.find(route => route.id === selectedRoute);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="pt-14 pb-4 px-6">
        <Text className="font-heading text-2xl text-neutral-800">Community Reporting</Text>
        <Text className="font-sans text-neutral-600 mt-1">
          Help others by reporting current conditions
        </Text>
      </View>
      
      <ScrollView className="flex-1 px-6">
        {/* Error message */}
        {error && (
          <View className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
            <Text className="text-red-800 font-sans text-sm">{error}</Text>
          </View>
        )}

        {/* Report type selection */}
        {!selectedReport && !isSuccess && (
          <View className="pt-2">
            <Text className="font-sans-medium text-neutral-700 mb-3">What would you like to report?</Text>
            
            {reportTypes.map((report, index) => (
              <Animated.View
                key={report.id}
                entering={SlideInRight.delay(index * 100).springify()}
              >
                <TouchableOpacity
                  className="bg-white border border-neutral-200 rounded-xl p-4 mb-3 flex-row items-center"
                  onPress={() => handleSelectReportType(report.id)}
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: report.id === 'fare' ? '#e6f0ff' : 
                                              report.id === 'traffic' ? '#fff7e6' : '#fee2e2' }}>
                    {report.icon}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-sans-medium text-neutral-800">{report.title}</Text>
                    <Text className="font-sans text-sm text-neutral-600">{report.description}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
        
        {/* Report form */}
        {selectedReport && !isSuccess && (
          <ReportForm
            reportType={selectedReport as 'fare' | 'traffic' | 'incident'}
            popularRoutes={popularRoutes}
            onSubmit={handleSubmit}
            onCancel={() => {
              formOpacity.value = withTiming(0, { duration: 300 });
              setTimeout(() => resetForm(), 300);
            }}
            handleGetLocation={handleGetLocation}
            location={location}
            formAnimatedStyle={formAnimatedStyle}
          />
        )}
        
        {/* Success state */}
        {isSuccess && (
          <Animated.View 
            className="items-center justify-center py-12"
            style={successAnimatedStyle}
          >
            <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={32} color="white" />
            </View>
            <Text className="font-heading text-xl text-neutral-800 mb-2">
              Thank You!
            </Text>
            {getSelectedRouteDetails()?.name ? (
              <Text className="font-sans text-neutral-600 text-center">
                Your report for {getSelectedRouteDetails()?.name} has been submitted. The community appreciates your contribution!
              </Text>
            ) : (
              <Text className="font-sans text-neutral-600 text-center">
                Your report has been submitted. The community appreciates your contribution!
              </Text>
            )}
          </Animated.View>
        )}
        
        {/* Recent reports */}
        {!selectedReport && !isSuccess && (
          <View className="mt-4 pb-6">
            <Text className="font-sans-medium text-neutral-700 mb-3">Recent Community Reports</Text>

            {isLoading ? (
              <View className="bg-white border border-neutral-200 rounded-xl p-4 mb-3">
                <Text className="font-sans text-neutral-600 text-center">Loading recent reports...</Text>
              </View>
            ) : recentReports.length === 0 ? (
              <View className="bg-white border border-neutral-200 rounded-xl p-4 mb-3">
                <Text className="font-sans text-neutral-600 text-center">No recent reports available</Text>
              </View>
            ) : (
              recentReports.map((report, index) => {
                let icon = 'cash-outline';
                let iconColor = '#0066ff';
                let bgColor = 'bg-blue-100';
                let title = '';
                let amount = null;

                if (report.type === 'fare') {
                  icon = 'cash-outline';
                  iconColor = '#0066ff';
                  bgColor = 'bg-blue-100';
                  title = `${report.routes?.name || 'Unknown Route'} Fare Update`;
                  amount = `KES ${report.fare_amount}`;
                } else if (report.type === 'traffic') {
                  icon = 'map-outline';
                  iconColor = '#f59e0b';
                  bgColor = 'bg-yellow-100';
                  title = `Traffic on ${report.routes?.name || 'Unknown Route'}`;
                } else if (report.type === 'incident') {
                  icon = 'warning-outline';
                  iconColor = '#ef4444';
                  bgColor = 'bg-red-100';
                  title = `${report.incident_type || 'Incident'} on ${report.routes?.name || 'Unknown Route'}`;
                }

                const timeAgo = new Date(report.reported_at).toLocaleTimeString('en-KE', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View
                    key={`${report.type}-${report.id || index}`}
                    className="bg-white border border-neutral-200 rounded-xl p-4 mb-3"
                  >
                    <View className="flex-row items-center">
                      <View className={`w-10 h-10 ${bgColor} rounded-full items-center justify-center`}>
                        <Ionicons name={icon as any} size={20} color={iconColor} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-sans-medium text-neutral-800">{title}</Text>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="time-outline" size={14} color="#737373" />
                          <Text className="font-sans text-xs text-neutral-500 ml-1">{timeAgo}</Text>
                        </View>
                      </View>
                      {amount && (
                        <Text className="font-sans-medium text-blue-500">{amount}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}