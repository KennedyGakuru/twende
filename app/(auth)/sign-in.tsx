import  { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'components/ui/Button';
import { Input } from 'components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from 'lib/supabase';



const signIn = async (email: string, password: string) => {
  try {
    //console.log('🔐 Attempting to sign in with:', email);

    const { user, session, error } = await supabase.auth.signIn({ email, password });

    if (error) {
      //console.log('❌ Sign in error:', error.message);
      return { error };
    }

    if (!user || !session) {
      //console.log('❌ No user/session returned after sign in');
      return { error: { message: 'User not found after sign-in' } };
    }

    //console.log('✅ Signed in. User ID:', user.id);

    // Set auth token
    await supabase.auth.setAuth(session.access_token);
    //console.log('📦 Set session token with setAuth() for Supabase v1');

    // Check for existing profile
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id);

    if (profileError) {
      //console.log('⚠️ Profile select error:', profileError.message);
      return { error: profileError };
    }

    //console.log('🗂 Existing profiles count:', profiles.length);

    if (profiles.length === 0) {
      const userName = await AsyncStorage.getItem('userName') || 'New User';
      console.log('👤 No profile found. Using fullName from AsyncStorage:', userName);

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          user_name: userName,
          theme_preference: 'system',
        })
        .single();

      if (insertError) {
        //console.log('🚫 Failed to insert new profile:', insertError.message);
        return { 
          error: { 
            message: `Profile creation failed: ${insertError.message}`,
            details: 'Please check your RLS policies'
          } 
        };
      }

      await AsyncStorage.removeItem('userName');
      //console.log('✅ Profile inserted and userName removed from storage');
    }

    return { error: null, user };
  } catch (error: any) {
    //console.log('🔥 Unexpected error during sign-in:', error.message);
    return { 
      error: { 
        message: error.message,
        details: 'Unexpected error during sign-in process' 
      } 
    };
  }
};






export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
  if (!validateForm()) return;

  setIsLoading(true);

  const { error, user } = await signIn(email, password);

  setIsLoading(false);

  if (error) {
    setErrors({ ...errors, general: error.message || 'Failed to sign in' });
  } else {
    // Optional: Store user session if needed (Supabase handles this internally too)
    // await AsyncStorage.setItem('userToken', user.id);

    // Navigate to role selection screen
    router.replace('/role-selection');
  }
};

  const handleForgotpassword = () => {
    router.replace('/(auth)/forgot')
  }
  const handleGuestMode = () => {
    // Placeholder for guest mode functionality
    console.log('Continuing as guest');
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="flex-grow">
        <View className="flex-1 bg-white px-6 pt-12 pb-8">
          {/* Logo and Header */}
          <View className="items-center my-8">
            <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="log-in" size={32} color="#0066ff" />
            </View>
            <Text className="font-heading text-2xl text-neutral-800">Welcome Back</Text>
            <Text className="font-sans text-neutral-500 text-center mt-2">
              Track matatus in real-time and find the best routes
            </Text>
          </View>
          
          {/* Sign In Form */}
          <View className="mt-6">
            {errors.general && (
              <View className="mb-4 p-3 bg-error-500/10 rounded-lg">
                <Text className="text-error-500 font-sans-medium text-sm">{errors.general}</Text>
              </View>
            )}
            
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Ionicons name="mail" size={20} color="#737373"/>}
            />
            
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed" size={20} color="#737373" />}
            />
            
            <TouchableOpacity onPress={handleForgotpassword}
            className="self-end mb-4">
              <Text className="text-primary-500 font-sans-medium">Forgot Password?</Text>
            </TouchableOpacity>
            
            <Button 
              onPress={handleSignIn}
              loading={isLoading}
              fullWidth
              size="lg"
            >
              Sign In
            </Button>
            
            <Button 
              onPress={handleGuestMode} 
              variant="outline" 
              fullWidth 
              className="mt-3"
              trailingIcon={<Ionicons name="chevron-forward" size={18} color="#737373" />}
            >
              Continue as Guest
            </Button>
          </View>
          
          {/* Footer */}
          <View className="mt-auto pt-6 flex-row justify-center">
            <Text className="font-sans text-neutral-600">Don't have an account?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="font-sans-medium text-primary-500 ml-1">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}