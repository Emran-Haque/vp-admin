import { baseApi } from "./baseApi";

export type LoginRequest = { email: string; password: string };

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: "admin" | "super_admin" | "moderator" | "student";
  };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "auth/login/", method: "POST", body }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation } = authApi;
