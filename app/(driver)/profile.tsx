import  { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/ui/Button';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Placeholder values since useAuth is removed
  const user = { email: 'demo@example.com' };
  const isGuestMode = false; // Change to true to simulate guest view

  const signOut = async () => {
    console.log('Sign out logic goes here');
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/(auth)/sign-in');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
  };

  const navigateToSignIn = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="pt-14 pb-6 px-6 bg-white">
        <Text className="font-heading text-2xl text-neutral-800">Profile</Text>
      </View>
      
      <ScrollView className="flex-1 px-6">
        {/* User Info */}
        <View className="bg-white border border-neutral-200 rounded-xl p-4 mb-5">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center">
              {isGuestMode ? (
                <Ionicons name="person-outline" size={30} color="#0066ff" />
              ) : (
                <Ionicons name="person-add-outline" size={30} color="#0066ff" />
              )}
            </View>
            
            <View className="ml-4 flex-1">
              <Text className="font-heading text-lg text-neutral-800">
                {isGuestMode ? 'Guest User' : user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text className="font-sans text-neutral-500">
                {isGuestMode ? 'Limited access mode' : user?.email || 'User account'}
              </Text>
            </View>
          </View>
          <View className='items-center'>
          <TouchableOpacity 
            className="bg-blue-100 dark:bg-blue-900/30 rounded-lg py-2 px-4  "
            onPress={() => router.push('/(profile)/edit')}
          >
            <Text className="font-inter-medium text-sm text-blue-500 dark:text-blue-300">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
          
        </View>
        
        {/* Favorite Routes */}
        <Text className="font-sans-medium text-neutral-700 mb-3">Your Activity</Text>
        
        <TouchableOpacity className="bg-white border border-neutral-200 rounded-xl p-4 mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
              <Ionicons name="heart-outline" size={20} color="#0066ff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-sans-medium text-neutral-800">Favorite Routes</Text>
              <Text className="font-sans text-sm text-neutral-600">Quick access to routes you use often</Text>
            </View>
            <Ionicons name="time-outline" size={20} color="#0066ff" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-white border border-neutral-200 rounded-xl p-4 mb-5">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
              <Ionicons name="time-outline" size={20} color="#0066ff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-sans-medium text-neutral-800">Travel History</Text>
              <Text className="font-sans text-sm text-neutral-600">View your recent trips</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#737373" />
          </View>
        </TouchableOpacity>
        
        {/* Settings */}
        <Text className="font-sans-medium text-neutral-700 mb-3">Settings</Text>
        
        <View className="bg-white border border-neutral-200 rounded-xl mb-5">
          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-neutral-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center">
                <Ionicons name="notifications-outline" size={20} color="#525252" />
              </View>
              <Text className="font-sans-medium text-neutral-800 ml-3">Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#d4d4d4', true: '#0066ff' }}
              thumbColor={'#ffffff'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-neutral-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center">
                <Ionicons name="moon-outline" size={20} color="#525252" />
              </View>
              <Text className="font-sans-medium text-neutral-800 ml-3">Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#d4d4d4', true: '#0066ff' }}
              thumbColor={'#ffffff'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center">
                <Ionicons name="settings-outline" size={20} color="#525252" />
              </View>
              <Text className="font-sans-medium text-neutral-800 ml-3">App Settings</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#737373" />
          </TouchableOpacity>
        </View>
        
        {/* Help & Support */}
        <Text className="font-sans-medium text-neutral-700 mb-3">Help & Support</Text>
        
        <TouchableOpacity className="bg-white border border-neutral-200 rounded-xl p-4 mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center">
              <Ionicons name="help-circle-outline" size={20} color="#525252" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-sans-medium text-neutral-800">FAQs</Text>
              <Text className="font-sans text-sm text-neutral-600">Get answers to common questions</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#737373" />
          </View>
        </TouchableOpacity>
        {isGuestMode ? (
            <Button
              variant="primary"
              className="mt-4"
              onPress={navigateToSignIn}
            >
              Create an Account
            </Button>
          ) : (
            <Button
              variant="outline"
              className="mt-4"
              leadingIcon={<Ionicons name="log-out-outline" size={18} color="#525252" />}
              onPress={handleSignOut}
            >
              Sign Out
            </Button>
          )}
        
        <View className="pb-8 mt-4">
          <Text className="font-sans text-center text-neutral-500 text-sm">
            Matatu Tracker v1.0.0
          </Text>
          <Text className="font-sans text-center text-neutral-400 text-xs mt-1">
            © 2025 Matatu Tracker
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
