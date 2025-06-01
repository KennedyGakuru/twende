
import { configureStore } from '@reduxjs/toolkit';
import onboardingReducer from './slices/onboardingSlice'
import authReducer from './slices/authSlice'
import roleReducer from './slices/roleSlice';

export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    auth: authReducer,
    role: roleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
