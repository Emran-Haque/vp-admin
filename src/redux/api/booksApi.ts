import { baseApi } from "./baseApi";
import type { IncludeItem, IncludePayloadItem, Paginated } from "./types";

export type Book = {
  id: number;
  title: string;
  slug: string;
  category: number;
  category_name: string;
  description: string;
  cover_image: string | null;
  price: string;
  /** Null when no discount is set. */
  old_price: string | null;
  discount_amount: string;
  discount: string;
  author: string;
  publisher: string;
  /** Null when the admin left it blank. */
  page_count: number | null;
  stock: number;
  is_available: boolean;
  in_stock: boolean;
  sample_preview_file: string | null;
  sample_preview_drive_link: string;
  promo_video_url: string;
  promo_video_thumbnail: string | null;
  is_featured: boolean;
  includes_title: string;
  includes: IncludeItem[];
  summary_points: { id: number; text: string; ordering: number }[];
  features: { id: number; title: string; description: string; icon: string; icon_image: string | null; ordering: number }[];
  review_average: number | null;
  review_count: number;
  total_sold: number;
  created_at: string;
  updated_at: string;
};

export type BookListParams = {
  category?: number;
  is_available?: boolean;
  is_featured?: boolean;
  search?: string;
  page?: number;
};

export type CreateBookInput = Partial<
  Omit<
    Book,
    | "id"
    | "slug"
    | "category_name"
    | "in_stock"
    | "review_average"
    | "review_count"
    | "total_sold"
    | "created_at"
    | "updated_at"
    | "includes"
    | "summary_points"
    | "features"
  >
> & {
  title: string;
  category: number;
  includes?: IncludePayloadItem[];
  summary_points?: { text: string; ordering?: number }[];
  features?: { title: string; description?: string; icon?: string; icon_image_field?: string; remove_icon_image?: boolean; ordering?: number }[];
};

export type UpdateBookInput = Partial<CreateBookInput>;

export type BookCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  order: number;
};

export type CreateBookCategoryInput = {
  name: string;
  description: string;
  is_active: boolean;
  order: number;
};

export type UpdateBookCategoryInput = Partial<CreateBookCategoryInput>;

export const booksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBooks: builder.query<Paginated<Book>, BookListParams | void>({
      query: (params) => ({ url: "admin/books/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((b) => ({ type: "Books" as const, id: b.id })),
              { type: "Books" as const, id: "LIST" },
            ]
          : [{ type: "Books" as const, id: "LIST" }],
    }),
    getBook: builder.query<Book, number>({
      query: (id) => `admin/books/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Books", id }],
    }),
    createBook: builder.mutation<Book, CreateBookInput | FormData>({
      query: (body) => ({ url: "admin/books/", method: "POST", body }),
      invalidatesTags: [{ type: "Books", id: "LIST" }],
    }),
    updateBook: builder.mutation<Book, { id: number; data: UpdateBookInput | FormData }>({
      query: ({ id, data }) => ({ url: `admin/books/${id}/`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Books", id },
        { type: "Books", id: "LIST" },
      ],
    }),
    deleteBook: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/books/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Books", id: "LIST" }],
    }),
    getBookCategories: builder.query<Paginated<BookCategory>, void>({
      query: () => "admin/book-categories/",
      providesTags: [{ type: "BookCategories", id: "LIST" }],
    }),
    createBookCategory: builder.mutation<BookCategory, CreateBookCategoryInput>({
      query: (body) => ({ url: "admin/book-categories/", method: "POST", body }),
      invalidatesTags: [{ type: "BookCategories", id: "LIST" }],
    }),
    updateBookCategory: builder.mutation<
      BookCategory,
      { id: number; data: UpdateBookCategoryInput }
    >({
      query: ({ id, data }) => ({
        url: `admin/book-categories/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "BookCategories", id: "LIST" }],
    }),
    deleteBookCategory: builder.mutation<void, number>({
      query: (id) => ({ url: `admin/book-categories/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "BookCategories", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBooksQuery,
  useGetBookQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useGetBookCategoriesQuery,
  useCreateBookCategoryMutation,
  useUpdateBookCategoryMutation,
  useDeleteBookCategoryMutation,
} = booksApi;
