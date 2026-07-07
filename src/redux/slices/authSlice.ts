import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "super_admin" | "moderator" | "student";
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

const TOKEN_KEY = "vp_admin_token";
const USER_KEY = "vp_admin_user";

const loadInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  return {
    token,
    user: rawUser ? (JSON.parse(rawUser) as AuthUser) : null,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
