import { createSlice } from '@reduxjs/toolkit';

const roleSlice = createSlice({
  name: 'role',
  initialState: {
    selectedRole: null,
  },
  reducers: {
    setRole: (state, action) => {
      state.selectedRole = action.payload;
    },
  },
});

export const { setRole } = roleSlice.actions;
export default roleSlice.reducer;
