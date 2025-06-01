import { createClient } from '@supabase/supabase-js';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';

// SecureStore Adapter for React Native
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] getItem failed: ${key}`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStore] setItem failed: ${key}`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] removeItem failed: ${key}`, error);
    }
  },
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://felzgrysehcjvxetprwe.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbHpncnlzZWhjanZ4ZXRwcndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNjE3NjYsImV4cCI6MjA2MTgzNzc2Nn0.zoDnSZVVWg1RrhSgQDS7-gOnx8b3rx0sYPj4tIW7zSY';
// Initialize client for Supabase v1
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

