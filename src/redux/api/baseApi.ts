import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout } from "../slices/authSlice";
import type { Paginated } from "./types";

const MAIN_API_BASE_URL = "https://api.vaiyaderpathshala.com/api/v1/";
const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const configuredForLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(
  configuredApiBaseUrl ?? "",
);
export const API_BASE_URL =
  configuredApiBaseUrl && !configuredForLocalhost ? configuredApiBaseUrl : MAIN_API_BASE_URL;

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

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

/**
 * Follows `next` links so a list query returns every row, not just the first
 * 20-row page. Use it as a `queryFn` for views that group or filter the whole
 * list on the client (a course's classes by subject, for instance).
 */
export async function fetchAllPages<T>(
  fetchWithBQ: (args: FetchArgs) => ReturnType<typeof baseQueryWithReauth>,
  url: string,
  params: object = {},
): Promise<{ data: Paginated<T> } | { error: FetchBaseQueryError }> {
  const results: T[] = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchWithBQ({ url, params: { ...params, page, page_size: 100 } });
    if (response.error) return { error: response.error };
    const data = response.data as Paginated<T>;
    results.push(...data.results);
    if (!data.next) {
      return { data: { count: results.length, next: null, previous: null, results } };
    }
  }
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Ledger",
    "Dashboard",
    "Permissions",
    "Students",
    "Moderators",
    "Courses",
    "CourseCategories",
    "CourseSubjects",
    "Enrollments",
    "BulkEnrollments",
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
    "SmsCampaigns",
    "SmsRecipients",
    "SmsTemplates",
    "DeviceRequests",
    "StudentDevices",
    "DeviceLock",
    "OfflineMarks",
  ],
  endpoints: () => ({}),
});
