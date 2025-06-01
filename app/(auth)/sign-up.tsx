import  { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'components/ui/Button';
import { Input } from 'components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from 'lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const signUp = async (email: string, password: string) => {
  try {
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    if (!user) return { error: { message: 'User not returned on signup' } };
    return { error: null, user };
  } catch (error: any) {
    return { error };
  }
};



export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; userName?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
  const newErrors: typeof errors = {};
  if (!email) newErrors.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

  if (!password) newErrors.password = 'Password is required';
  else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

  if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

  if (!userName) newErrors.userName = 'User name is required';

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    const { error, user } = await signUp(email, password);

    setIsLoading(false);

    if (error) {
      setErrors({ ...errors, general: error.message || 'Failed to sign up' });
      return;
    }

    // Save fullName temporarily to AsyncStorage so you can use it after user confirms email and signs in
    await AsyncStorage.setItem('userName', userName);

    alert('Signup successful! Please check your email to confirm your account.');

    router.replace('/(auth)/sign-in'); // redirect to sign-in screen
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
              <Ionicons name="person-add" size={32} color="#0066ff" />
            </View>
            <Text className="font-heading text-2xl text-neutral-800">Create Account</Text>
            <Text className="font-sans text-neutral-500 text-center mt-2">
              Join thousands of matatu riders tracking routes in real-time
            </Text>
          </View>

          {/* Sign Up Form */}
          <View className="mt-6">
            {errors.general && (
              <View className="mb-4 p-3 bg-error-500/10 rounded-lg">
                <Text className="text-error-500 font-sans-medium text-sm">{errors.general}</Text>
              </View>
            )}

            <Input
              label="User Name"
              placeholder="Enter your user name"
              value={userName}
              onChangeText={setUserName}
              error={errors.userName}
              leftIcon={<Ionicons name="person" size={20} color="#737373" />}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Ionicons name="mail" size={20} color="#737373" />}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed" size={20} color="#737373" />}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="lock-closed" size={20} color="#737373" />}
            />

            <Button
              onPress={handleSignUp}
              loading={isLoading}
              fullWidth
              size="lg"
              className="mt-4"
            >
              Create Account
            </Button>
          </View>

          {/* Footer */}
          <View className="mt-auto pt-6 flex-row justify-center">
            <Text className="font-sans text-neutral-600">Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text className="font-sans-medium text-primary-500 ml-1">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
