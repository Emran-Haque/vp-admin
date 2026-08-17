import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout } from "../slices/authSlice";

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000/api/v1/"
    : "https://api.vaiyaderpathshala.com/api/v1/";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/?$/, "/");

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Token ${token}`);
    return headers;
  },
});

// A 401 means the stored token is no longer valid (expired/revoked) — force a
// logout so the layout's auth guard redirects to /login instead of leaving
// every widget on the page to fail independently with the same error.
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Dashboard",
    "Permissions",
    "Students",
    "Moderators",
    "Courses",
    "CourseCategories",
    "CourseSubjects",
    "Enrollments",
    "Classes",
    "CourseMaterials",
    "Resources",
    "Exams",
    "ExamBatches",
    "ExamQuestions",
    "ExamAttempts",
    "Assignments",
    "Submissions",
    "Books",
    "BookCategories",
    "Orders",
    "Payments",
    "Notices",
    "Teachers",
    "Reviews",
    "SuccessStories",
    "Faqs",
    "StaticPages",
    "HomeContent",
    "CommunityLinks",
    "Notifications",
  ],
  endpoints: () => ({}),
});
