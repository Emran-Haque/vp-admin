import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type Teacher = {
  id: number;
  name: string;
  designation: string;
  subject: string;
  image: string | null;
  bio: string;
  short_description: string;
  long_description: string;
  social_links: Record<string, string>;
  ordering: number;
  is_active: boolean;
};
export type CreateTeacherInput = Omit<Teacher, "id">;
export type UpdateTeacherInput = Partial<CreateTeacherInput>;

/** What a review is about. One review row points at exactly one of the three. */
export type ReviewTarget = "course" | "book" | "exam_batch";

/** Nothing reaches the public site until a moderator moves it out of `pending`. */
export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: number;
  student: number;
  student_name?: string;
  student_image?: string | null;
  target_type: ReviewTarget;
  /** Id of whichever product this is about. */
  target_id: number;
  target_title: string;
  course: number | null;
  book: number | null;
  exam_batch: number | null;
  institution: string;
  unit: string;
  merit_position: string;
  rating: number;
  comment: string;
  /** Aspect keys the student ticked, e.g. ["teaching"]. */
  aspects: string[];
  /** Bangla labels for those keys, sent by the API so nothing is hardcoded here. */
  aspect_labels: string[];
  /** Books only — kept out of the product score on purpose. */
  delivery_rating: number | null;
  status: ReviewStatus;
  moderation_note: string;
  moderated_by_name?: string;
  moderated_at?: string | null;
  is_featured: boolean;
  created_at?: string;
};

export type ReviewListParams = {
  /** Defaults to the pending queue server-side; pass "all" to see everything. */
  status?: ReviewStatus | "all";
  target_type?: ReviewTarget;
  rating?: number;
  is_featured?: boolean;
  search?: string;
  page?: number;
};

export type ReviewCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

/** Admins may only edit presentation, never the student's own words. */
export type UpdateReviewInput = Partial<Pick<Review, "is_featured" | "status">>;

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
export type FaqListParams = {
  category?: string;
  related_course?: number;
  related_book?: number;
  is_active?: boolean;
  search?: string;
  page?: number;
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

/** Page keys that can carry an editable heading block. */
export type LandingHeroKey =
  | "course"
  | "exam_batch"
  | "book_store"
  | "free_class"
  | "team"
  | "success";

/**
 * The heading block at the top of a public landing page.
 *
 * Keyed by page rather than id, so the admin edits "the course page heading"
 * without caring whether a row exists yet. A page with no row keeps the copy
 * the student site already ships.
 */
export type LandingHero = {
  id: number;
  page_key: LandingHeroKey;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  is_active: boolean;
};

export type LandingHeroInput = Partial<Omit<LandingHero, "id">> & {
  page_key: LandingHeroKey;
  title: string;
};

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

export type WhyPlatformCard = {
  id?: number;
  title: string;
  description: string;
  icon: string;
  target_url: string;
  ordering: number;
};

export type WhyPlatformContent = {
  id: number;
  promo_video_url: string;
  promo_video_thumbnail: string | null;
  title: string;
  description: string;
  is_active: boolean;
  cards: WhyPlatformCard[];
};
export type CreateWhyPlatformInput = Omit<WhyPlatformContent, "id">;
export type UpdateWhyPlatformInput = Partial<CreateWhyPlatformInput>;

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
    createTeacher: builder.mutation<Teacher, CreateTeacherInput | FormData>({
      query: (body) => ({ url: "admin/teachers/", method: "POST", body }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),
    updateTeacher: builder.mutation<Teacher, { id: number; data: UpdateTeacherInput | FormData }>({
      query: ({ id, data }) => ({ url: `admin/teachers/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Teachers", id }, { type: "Teachers", id: "LIST" }],
    }),
    deleteTeacher: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/teachers/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),

    // Reviews
    getReviews: builder.query<Paginated<Review>, ReviewListParams | void>({
      query: (params) => ({ url: "admin/reviews/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((r) => ({ type: "Reviews" as const, id: r.id })),
              { type: "Reviews" as const, id: "LIST" },
            ]
          : [{ type: "Reviews" as const, id: "LIST" }],
    }),
    getReviewCounts: builder.query<ReviewCounts, void>({
      query: () => "admin/reviews/counts/",
      providesTags: [{ type: "Reviews", id: "COUNTS" }],
    }),
    approveReview: builder.mutation<Review, number>({
      query: (id) => ({ url: `admin/reviews/${id}/approve/`, method: "POST" }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }, { type: "Reviews", id: "COUNTS" }],
    }),
    rejectReview: builder.mutation<Review, { id: number; note?: string }>({
      query: ({ id, note }) => ({
        url: `admin/reviews/${id}/reject/`,
        method: "POST",
        body: { note: note ?? "" },
      }),
      invalidatesTags: [{ type: "Reviews", id: "LIST" }, { type: "Reviews", id: "COUNTS" }],
    }),
    updateReview: builder.mutation<Review, { id: number; data: UpdateReviewInput }>({
      query: ({ id, data }) => ({ url: `admin/reviews/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Reviews", id },
        { type: "Reviews", id: "LIST" },
        { type: "Reviews", id: "COUNTS" },
      ],
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
    getFaqs: builder.query<Paginated<Faq>, FaqListParams | void>({
      query: (params) => ({ url: "admin/faqs/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((f) => ({ type: "Faqs" as const, id: f.id })),
              { type: "Faqs" as const, id: "LIST" },
            ]
          : [{ type: "Faqs" as const, id: "LIST" }],
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
    getLandingHeroes: builder.query<Paginated<LandingHero> | LandingHero[], void>({
      query: () => "admin/landing-heroes/",
      providesTags: [{ type: "HomeContent", id: "HEROES" }],
    }),
    // Create-or-update in one call: the page key is the lookup, so the caller
    // never has to know whether a row exists yet.
    saveLandingHero: builder.mutation<LandingHero, { exists: boolean; data: LandingHeroInput }>({
      query: ({ exists, data }) =>
        exists
          ? { url: `admin/landing-heroes/${data.page_key}/`, method: "PATCH", body: data }
          : { url: "admin/landing-heroes/", method: "POST", body: data },
      invalidatesTags: [{ type: "HomeContent", id: "HEROES" }],
    }),
    getHeroSlides: builder.query<Paginated<HeroContent>, void>({
      query: () => "admin/home-content/hero/",
      providesTags: [{ type: "HomeContent", id: "HERO_LIST" }],
    }),
    createHeroSlide: builder.mutation<HeroContent, CreateHeroContentInput | FormData>({
      query: (body) => ({ url: "admin/home-content/hero/", method: "POST", body }),
      invalidatesTags: [{ type: "HomeContent", id: "HERO_LIST" }],
    }),
    updateHeroSlide: builder.mutation<HeroContent, { id: number; data: UpdateHeroContentInput | FormData }>({
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
    getWhyPlatforms: builder.query<Paginated<WhyPlatformContent>, void>({
      query: () => "admin/home-content/why-platform/",
      providesTags: [{ type: "HomeContent", id: "WHY_PLATFORM" }],
    }),
    createWhyPlatform: builder.mutation<WhyPlatformContent, CreateWhyPlatformInput | FormData>({
      query: (body) => ({ url: "admin/home-content/why-platform/", method: "POST", body }),
      invalidatesTags: [{ type: "HomeContent", id: "WHY_PLATFORM" }],
    }),
    updateWhyPlatform: builder.mutation<WhyPlatformContent, { id: number; data: UpdateWhyPlatformInput | FormData }>({
      query: ({ id, data }) => ({
        url: `admin/home-content/why-platform/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "HomeContent", id: "WHY_PLATFORM" }],
    }),
    // These two are ModelViewSets, so the collection route answers GET and POST
    // and edits go to `/{id}/`. The previous version PATCHed the collection,
    // which DRF answers with 405 — it was never caught because nothing in the
    // admin used these hooks.
    getAboutContent: builder.query<Paginated<AboutContent> | AboutContent[], void>({
      query: () => "admin/home-content/about/",
      providesTags: [{ type: "HomeContent", id: "ABOUT" }],
    }),
    saveAboutContent: builder.mutation<
      AboutContent,
      { id?: number; data: UpdateAboutContentInput | FormData }
    >({
      query: ({ id, data }) =>
        id
          ? { url: `admin/home-content/about/${id}/`, method: "PATCH", body: data }
          : { url: "admin/home-content/about/", method: "POST", body: data },
      invalidatesTags: [{ type: "HomeContent", id: "ABOUT" }],
    }),
    getFooterContent: builder.query<Paginated<FooterContent> | FooterContent[], void>({
      query: () => "admin/home-content/footer/",
      providesTags: [{ type: "HomeContent", id: "FOOTER" }],
    }),
    saveFooterContent: builder.mutation<
      FooterContent,
      { id?: number; data: UpdateFooterContentInput | FormData }
    >({
      query: ({ id, data }) =>
        id
          ? { url: `admin/home-content/footer/${id}/`, method: "PATCH", body: data }
          : { url: "admin/home-content/footer/", method: "POST", body: data },
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
  useGetReviewCountsQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
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
  useGetLandingHeroesQuery,
  useSaveLandingHeroMutation,
  useGetHeroSlidesQuery,
  useCreateHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useGetWhyPlatformsQuery,
  useCreateWhyPlatformMutation,
  useUpdateWhyPlatformMutation,
  useGetAboutContentQuery,
  useSaveAboutContentMutation,
  useGetFooterContentQuery,
  useSaveFooterContentMutation,
} = contentApi;
