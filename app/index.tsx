import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from 'redux/store';

export default function Index() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const hasOnboarded = useSelector((state: RootState) => state.onboarding.hasOnboarded);
  const selectedRole = useSelector((state: RootState) => state.role.selectedRole);

  console.log('🚀 Redirect Check:', {
    isLoggedIn,
    hasOnboarded,
    selectedRole,
  });

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (!selectedRole) {
    return <Redirect href="/role-selection" />;
  }

  if (selectedRole === 'driver') {
    return <Redirect href="/(driver)" />;
  } else if (selectedRole === 'sacco') {
    return <Redirect href="/(sacco)" />;
  }

  return <Redirect href="/(tabs)" />;
}
