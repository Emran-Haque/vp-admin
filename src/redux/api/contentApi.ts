import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type Teacher = {
  id: number;
  name: string;
  designation: string;
  subject: string;
  image: string | null;
  bio: string;
  social_links: Record<string, string>;
  ordering: number;
  is_active: boolean;
};
export type CreateTeacherInput = Omit<Teacher, "id">;
export type UpdateTeacherInput = Partial<CreateTeacherInput>;

export type Review = {
  id: number;
  student_name: string;
  image: string | null;
  institution: string;
  unit: string;
  merit_position: string;
  rating: number;
  comment: string;
  is_featured: boolean;
  is_visible: boolean;
};
export type CreateReviewInput = Omit<Review, "id">;
export type UpdateReviewInput = Partial<CreateReviewInput>;

export type SuccessStory = {
  id: number;
  student_name: string;
  image: string | null;
  university: string;
  unit: string;
  merit_position: string;
  comment: string;
  video_url: string;
  year: string;
  is_featured: boolean;
};
export type CreateSuccessStoryInput = Omit<SuccessStory, "id">;
export type UpdateSuccessStoryInput = Partial<CreateSuccessStoryInput>;

export type Faq = {
  id: number;
  question: string;
  answer: string;
  category: string;
  related_course: number | null;
  related_book: number | null;
  ordering: number;
  is_active: boolean;
};
export type CreateFaqInput = Omit<Faq, "id">;
export type UpdateFaqInput = Partial<CreateFaqInput>;

export type StaticPageKey =
  | "privacy_policy"
  | "refund_policy"
  | "terms_of_use"
  | "about"
  | "contact";

export type StaticPage = {
  id: number;
  page_key: StaticPageKey;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
};
export type UpdateStaticPageInput = Partial<Omit<StaticPage, "id" | "page_key">>;

export type HeroContent = {
  id: number;
  title: string;
  subtitle: string;
  image: string | null;
  button_text: string;
  target_url: string;
  linked_course: number | null;
  ordering: number;
  is_active: boolean;
};
export type CreateHeroContentInput = Omit<HeroContent, "id">;
export type UpdateHeroContentInput = Partial<CreateHeroContentInput>;

export type WhyPlatformContent = {
  id: number;
  promo_video_url: string;
  title: string;
  description: string;
  is_active: boolean;
};
export type UpdateWhyPlatformInput = Partial<Omit<WhyPlatformContent, "id">>;

export type AboutContent = {
  id: number;
  title: string;
  description: string;
  image: string | null;
  is_active: boolean;
};
export type UpdateAboutContentInput = Partial<Omit<AboutContent, "id">>;

export type FooterContent = {
  id: number;
  name: string;
  logo: string | null;
  short_description: string;
  social_links: Record<string, string>;
  important_links: { label: string; url: string }[];
  whatsapp_number: string;
  is_active: boolean;
};
export type UpdateFooterContentInput = Partial<Omit<FooterContent, "id">>;

export const contentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Teachers
    getTeachers: builder.query<Paginated<Teacher>, void>({
      query: () => "admin/teachers/",
      providesTags: [{ type: "Teachers", id: "LIST" }],
    }),
    getTeacher: builder.query<Teacher, number>({
      query: (id) => `admin/teachers/${id}/`,
      providesTags: (_r, _e, id) => [{ type: "Teachers", id }],
    }),
    createTeacher: builder.mutation<Teacher, CreateTeacherInput>({
      query: (body) => ({ url: "admin/teachers/", method: "POST", body }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),
    updateTeacher: builder.mutation<Teacher, { id: number; data: UpdateTeacherInput }>({
      query: ({ id, data }) => ({ url: `admin/teachers/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Teachers", id }, { type: "Teachers", id: "LIST" }],
    }),
    deleteTeacher: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/teachers/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),

    // Reviews
    getReviews: builder.query<Paginated<Review>, void>({
      query: () => "admin/reviews/",
      providesTags: [{ type: "Reviews", id: "LIST" }],
    }),
    createReview: builder.mutation<Review, CreateReviewInput>({
      query: (body) => ({ url: "admin/reviews/", method: "POST", body }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }],
    }),
    updateReview: builder.mutation<Review, { id: number; data: UpdateReviewInput }>({
      query: ({ id, data }) => ({ url: `admin/reviews/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Reviews", id }, { type: "Reviews", id: "LIST" }],
    }),
    deleteReview: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/reviews/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }],
    }),

    // Success stories
    getSuccessStories: builder.query<Paginated<SuccessStory>, void>({
      query: () => "admin/success-stories/",
      providesTags: [{ type: "SuccessStories", id: "LIST" }],
    }),
    createSuccessStory: builder.mutation<SuccessStory, CreateSuccessStoryInput>({
      query: (body) => ({ url: "admin/success-stories/", method: "POST", body }),
      invalidatesTags: [{ type: "SuccessStories", id: "LIST" }],
    }),
    updateSuccessStory: builder.mutation<
      SuccessStory,
      { id: number; data: UpdateSuccessStoryInput }
    >({
      query: ({ id, data }) => ({
        url: `admin/success-stories/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SuccessStories", id },
        { type: "SuccessStories", id: "LIST" },
      ],
    }),
    deleteSuccessStory: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/success-stories/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "SuccessStories", id: "LIST" }],
    }),

    // FAQs
    getFaqs: builder.query<Paginated<Faq>, void>({
      query: () => "admin/faqs/",
      providesTags: [{ type: "Faqs", id: "LIST" }],
    }),
    createFaq: builder.mutation<Faq, CreateFaqInput>({
      query: (body) => ({ url: "admin/faqs/", method: "POST", body }),
      invalidatesTags: [{ type: "Faqs", id: "LIST" }],
    }),
    updateFaq: builder.mutation<Faq, { id: number; data: UpdateFaqInput }>({
      query: ({ id, data }) => ({ url: `admin/faqs/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Faqs", id }, { type: "Faqs", id: "LIST" }],
    }),
    deleteFaq: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/faqs/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Faqs", id: "LIST" }],
    }),

    // Static pages (lookup by page_key)
    getStaticPage: builder.query<StaticPage, StaticPageKey>({
      query: (pageKey) => `admin/static-pages/${pageKey}/`,
      providesTags: (_r, _e, pageKey) => [{ type: "StaticPages", id: pageKey }],
    }),
    updateStaticPage: builder.mutation<
      StaticPage,
      { pageKey: StaticPageKey; data: UpdateStaticPageInput }
    >({
      query: ({ pageKey, data }) => ({
        url: `admin/static-pages/${pageKey}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_r, _e, { pageKey }) => [{ type: "StaticPages", id: pageKey }],
    }),

    // Home content
    getHeroSlides: builder.query<Paginated<HeroContent>, void>({
      query: () => "admin/home-content/hero/",
      providesTags: [{ type: "HomeContent", id: "HERO_LIST" }],
    }),
    createHeroSlide: builder.mutation<HeroContent, CreateHeroContentInput>({
      query: (body) => ({ url: "admin/home-content/hero/", method: "POST", body }),
      invalidatesTags: [{ type: "HomeContent", id: "HERO_LIST" }],
    }),
    updateHeroSlide: builder.mutation<HeroContent, { id: number; data: UpdateHeroContentInput }>({
      query: ({ id, data }) => ({
        url: `admin/home-content/hero/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "HomeContent", id: "HERO_LIST" }],
    }),
    deleteHeroSlide: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/home-content/hero/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "HomeContent", id: "HERO_LIST" }],
    }),
    getWhyPlatform: builder.query<WhyPlatformContent, void>({
      query: () => "admin/home-content/why-platform/",
      providesTags: [{ type: "HomeContent", id: "WHY_PLATFORM" }],
    }),
    updateWhyPlatform: builder.mutation<WhyPlatformContent, UpdateWhyPlatformInput>({
      query: (data) => ({
        url: "admin/home-content/why-platform/",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "HomeContent", id: "WHY_PLATFORM" }],
    }),
    getAboutContent: builder.query<AboutContent, void>({
      query: () => "admin/home-content/about/",
      providesTags: [{ type: "HomeContent", id: "ABOUT" }],
    }),
    updateAboutContent: builder.mutation<AboutContent, UpdateAboutContentInput>({
      query: (data) => ({ url: "admin/home-content/about/", method: "PATCH", body: data }),
      invalidatesTags: [{ type: "HomeContent", id: "ABOUT" }],
    }),
    getFooterContent: builder.query<FooterContent, void>({
      query: () => "admin/home-content/footer/",
      providesTags: [{ type: "HomeContent", id: "FOOTER" }],
    }),
    updateFooterContent: builder.mutation<FooterContent, UpdateFooterContentInput>({
      query: (data) => ({ url: "admin/home-content/footer/", method: "PATCH", body: data }),
      invalidatesTags: [{ type: "HomeContent", id: "FOOTER" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTeachersQuery,
  useGetTeacherQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useGetReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useGetSuccessStoriesQuery,
  useCreateSuccessStoryMutation,
  useUpdateSuccessStoryMutation,
  useDeleteSuccessStoryMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useGetStaticPageQuery,
  useUpdateStaticPageMutation,
  useGetHeroSlidesQuery,
  useCreateHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useGetWhyPlatformQuery,
  useUpdateWhyPlatformMutation,
  useGetAboutContentQuery,
  useUpdateAboutContentMutation,
  useGetFooterContentQuery,
  useUpdateFooterContentMutation,
} = contentApi;
