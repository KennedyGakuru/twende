import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import {Inter_400Regular,Inter_500Medium,Inter_700Bold,} from '@expo-google-fonts/inter';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'redux/store';
import { login } from 'redux/slices/authSlice';
import { setRole } from 'redux/slices/roleSlice';
import { completeOnboarding } from 'redux/slices/onboardingSlice';

SplashScreen.preventAutoHideAsync();

export default function InnerLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const hasOnboarded = useSelector((state: RootState) => state.onboarding.hasOnboarded);
  const selectedRole = useSelector((state: RootState) => state.role.selectedRole);

  useEffect(() => {
    const bootstrapApp = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const onboarding = await AsyncStorage.getItem('hasOnboarded');
      const role = await AsyncStorage.getItem('userRole');

      if (token) dispatch(login(token));
      if (onboarding === 'true') dispatch(completeOnboarding());
      if (role) dispatch(setRole(role));

      setIsLoading(false);
      await SplashScreen.hideAsync();
    };

    if (fontsLoaded || fontError) {
      bootstrapApp();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded || isLoading) return null;

  let initialRoute = '(onboarding)/index';

  if (hasOnboarded) {
    if (!isLoggedIn) {
      initialRoute = '(auth)';
    } else if (!selectedRole) {
      initialRoute = 'role-selection';
    } else {
      initialRoute =
        selectedRole === 'driver'
          ? '(driver)'
          : selectedRole === 'sacco'
          ? '(sacco)'
          : '(tabs)';
    }
  }

  return (
    <GestureHandlerRootView className="flex-1">
    <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="role-selection" />
    <Stack.Screen name="(auth)" />
    <Stack.Screen name="(commuter)" />
    <Stack.Screen name="(driver)" />
    <Stack.Screen name="(sacco)" />
    <Stack.Screen name="(commuter)/route/[id]" options={{ presentation: 'modal' }} />
    <Stack.Screen name="(commuter)/route/live-tracking" options={{ presentation: 'card' }} />
    <Stack.Screen name="+not-found" />
  </Stack>
  <StatusBar style="auto" />
</GestureHandlerRootView>
  );
}
