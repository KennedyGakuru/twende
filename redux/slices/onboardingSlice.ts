import { createSlice } from '@reduxjs/toolkit';

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    hasOnboarded: false,
  },
  reducers: {
    completeOnboarding: (state) => {
      state.hasOnboarded = true;
    },
  },
});

export const { completeOnboarding } = onboardingSlice.actions;
export default onboardingSlice.reducer;
