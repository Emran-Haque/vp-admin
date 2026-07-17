import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type CourseSubject = {
  id: number;
  course: number;
  name: string;
  description: string;
  ordering: number;
};

export type CourseSubjectListParams = {
  course?: number;
};

export type CreateCourseSubjectInput = {
  course: number;
  name: string;
  description?: string;
  ordering?: number;
};

export type UpdateCourseSubjectInput = Partial<CreateCourseSubjectInput>;

export const courseSubjectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseSubjects: builder.query<Paginated<CourseSubject>, CourseSubjectListParams | void>({
      query: (params) => ({ url: "admin/course-subjects/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((s) => ({ type: "CourseSubjects" as const, id: s.id })),
              { type: "CourseSubjects" as const, id: "LIST" },
            ]
          : [{ type: "CourseSubjects" as const, id: "LIST" }],
    }),
    createCourseSubject: builder.mutation<CourseSubject, CreateCourseSubjectInput>({
      query: (body) => ({ url: "admin/course-subjects/", method: "POST", body }),
      invalidatesTags: [{ type: "CourseSubjects", id: "LIST" }],
    }),
    updateCourseSubject: builder.mutation<CourseSubject, { id: number; data: UpdateCourseSubjectInput }>({
      query: ({ id, data }) => ({ url: `admin/course-subjects/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "CourseSubjects", id },
        { type: "CourseSubjects", id: "LIST" },
      ],
    }),
    deleteCourseSubject: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/course-subjects/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "CourseSubjects", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCourseSubjectsQuery,
  useCreateCourseSubjectMutation,
  useUpdateCourseSubjectMutation,
  useDeleteCourseSubjectMutation,
} = courseSubjectsApi;
