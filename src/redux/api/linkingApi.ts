import { baseApi, fetchAllPages } from "./baseApi";
import type { Course } from "./coursesApi";
import type { Paginated } from "./types";

/**
 * "অন্য কোর্সেও যোগ করুন": the same exam or class in several courses.
 *
 * Each course gets its own copy (results, leaderboard and attendance stay per
 * course) and the backend keeps every copy identical — an edit made from any
 * course reaches all of them. See apps/exams/linking.py and
 * apps/courses/class_linking.py.
 */
export type LinkKind = "exam" | "class";

/** `subject` omitted = match the source subject by name; null = no subject. */
export type LinkTarget = { course: number; subject?: number | null };

export type LinkResult = {
  created: { course: number }[];
  linked_courses: { course: number; course_title: string }[];
};

const base = (kind: LinkKind, id: number) =>
  kind === "exam" ? `admin/exams/${id}/` : `admin/classes/${id}/`;

export const linkingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Every course (all pages), for the "add to other courses" picker. */
    getLinkableCourses: builder.query<Paginated<Course>, void>({
      queryFn: (_arg, _api, _extra, fetchWithBQ) =>
        fetchAllPages<Course>(fetchWithBQ, "admin/courses/", { ordering: "title" }),
      providesTags: [{ type: "Courses", id: "LIST" }],
    }),
    linkToCourses: builder.mutation<LinkResult, { kind: LinkKind; id: number; targets: LinkTarget[] }>({
      query: ({ kind, id, targets }) => ({
        url: `${base(kind, id)}link-courses/`,
        method: "POST",
        body: { targets },
      }),
      // A class link also links its quizzes, so both lists refresh either way.
      invalidatesTags: ["Exams", "Classes", "ExamQuestions"],
    }),
    unlinkFromCourses: builder.mutation<void, { kind: LinkKind; id: number }>({
      query: ({ kind, id }) => ({ url: `${base(kind, id)}unlink/`, method: "POST" }),
      invalidatesTags: ["Exams", "Classes"],
    }),
  }),
});

export const { useGetLinkableCoursesQuery, useLinkToCoursesMutation, useUnlinkFromCoursesMutation } =
  linkingApi;
