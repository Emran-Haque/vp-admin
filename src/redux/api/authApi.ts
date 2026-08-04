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

export type Profile = {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: "admin" | "super_admin" | "moderator" | "student";
  profile_image: string | null;
  is_verified: boolean;
  created_at: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "auth/login/", method: "POST", body }),
    }),
    getProfile: builder.query<Profile, void>({
      query: () => "auth/profile/",
    }),
    updateProfile: builder.mutation<Profile, { phone?: string; full_name?: string }>({
      query: (body) => ({ url: "auth/profile/", method: "PATCH", body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;
