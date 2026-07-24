import { baseApi } from "./baseApi";
import type { Paginated } from "./types";
import type { Enrollment } from "./coursesApi";

export type StudentProfile = {
  batch: string;
  session: string;
  institution: string;
  admission_unit: string;
  group: string;
  address: string;
  guardian_phone: string;
  extra: Record<string, unknown>;
};

export type Student = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  profile_image: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  student_profile: StudentProfile;
};

export type StudentListParams = {
  is_active?: boolean;
  is_verified?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
};

export type CreateStudentInput = {
  email: string;
  full_name: string;
  phone: string;
  password: string;
  is_verified?: boolean;
};

export type UpdateStudentInput = Partial<
  Pick<Student, "email" | "full_name" | "phone" | "profile_image" | "is_verified">
> & {
  student_profile?: Partial<StudentProfile>;
};

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<Paginated<Student>, StudentListParams | void>({
      query: (params) => ({ url: "admin/students/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((s) => ({ type: "Students" as const, id: s.id })),
              { type: "Students" as const, id: "LIST" },
            ]
          : [{ type: "Students" as const, id: "LIST" }],
    }),
    getStudent: builder.query<Student, number>({
      query: (id) => `admin/students/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Students", id }],
    }),
    createStudent: builder.mutation<Student, CreateStudentInput>({
      query: (body) => ({ url: "admin/students/", method: "POST", body }),
      invalidatesTags: [{ type: "Students", id: "LIST" }],
    }),
    updateStudent: builder.mutation<Student, { id: number; data: UpdateStudentInput }>({
      query: ({ id, data }) => ({ url: `admin/students/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Students", id },
        { type: "Students", id: "LIST" },
      ],
    }),
    deleteStudent: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/students/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Students", id: "LIST" }],
    }),
    deactivateStudent: builder.mutation<{ detail: string }, number>({
      query: (id) => ({ url: `admin/students/${id}/deactivate/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Students", id },
        { type: "Students", id: "LIST" },
      ],
    }),
    reactivateStudent: builder.mutation<{ detail: string }, number>({
      query: (id) => ({ url: `admin/students/${id}/reactivate/`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Students", id },
        { type: "Students", id: "LIST" },
      ],
    }),
    getStudentEnrollments: builder.query<Paginated<Enrollment>, number>({
      query: (id) => `admin/students/${id}/enrollments/`,
      providesTags: (_result, _error, id) => [{ type: "Enrollments", id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useDeactivateStudentMutation,
  useReactivateStudentMutation,
  useGetStudentEnrollmentsQuery,
} = studentsApi;
