import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AuthUser } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  user: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.hydrated = true;
    },
    clearUser(state) {
      state.user = null;
      state.hydrated = true;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
