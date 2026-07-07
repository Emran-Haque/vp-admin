import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";

const API_BASE_URL = "http://165.22.110.31/api/v1/";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Token ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Dashboard",
    "Permissions",
    "Students",
    "Moderators",
    "Courses",
    "CourseCategories",
    "Enrollments",
    "Classes",
    "Resources",
    "Exams",
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
  ],
  endpoints: () => ({}),
});
