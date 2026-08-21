"use client";

import { BookOpen, Star, Pencil, Trash2, User, Building2 } from "lucide-react";
import { useGetBooksQuery, useDeleteBookMutation, type Book } from "@/redux/api/booksApi";
import { getMediaUrl } from "@/redux/api/baseApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";

type Props = {
  search: string;
  category: string;
  availability: string;
  onEdit: (book: Book) => void;
};

export default function BookList({ search, category, availability, onEdit }: Props) {
  const { data, isLoading, isError, error } = useGetBooksQuery({
    search: search || undefined,
    category: category ? Number(category) : undefined,
    is_available: availability ? availability === "true" : undefined,
  });
  const [deleteBook] = useDeleteBookMutation();
  const { hasPermission } = usePermissions();

  if (isLoading) {
    return <PageLoader label="বইয়ের তালিকা লোড হচ্ছে…" />;
  }

  if (isError) {
    return <ErrorState message="বইয়ের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
  }

  const books = data?.results ?? [];

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => {
        const hasDiscount = Number(book.discount) > 0;
        return (
          <div
            key={book.id}
            className="flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]"
          >
            <div className="relative h-40 w-full bg-gray-800">
              {book.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getMediaUrl(book.cover_image) ?? ""} alt={book.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BookOpen size={32} className="text-slate-600" />
                </div>
              )}
              {book.is_featured && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white">
                  <Star size={10} fill="currentColor" />
                  ফিচার্ড
                </span>
              )}
              <span
                className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  book.is_available && book.in_stock
                    ? "bg-emerald-500/90 text-white"
                    : "bg-red-500/90 text-white"
                }`}
              >
                {!book.is_available ? "অনুপলব্ধ" : book.in_stock ? "স্টকে আছে" : "স্টক শেষ"}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-semibold text-cyan-500">{book.category_name}</p>
              <p className="mt-0.5 text-lg font-semibold leading-6 text-blue-50">{book.title}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                {book.author && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {book.author}
                  </span>
                )}
                {book.publisher && (
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {book.publisher}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-bold text-blue-50">৳{book.price}</span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-slate-500 line-through">৳{book.old_price}</span>
                    <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-500">
                      -{book.discount}%
                    </span>
                  </>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-400">স্টক: {book.stock} কপি</p>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
                {hasPermission("can_edit_book") && (
                  <button
                    type="button"
                    onClick={() => onEdit(book)}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-slate-800 text-blue-50 transition-colors duration-200 hover:bg-white/5"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {hasPermission("can_delete_book") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`"${book.title}" বইটি মুছে ফেলতে চান?`)) deleteBook(book.id);
                    }}
                    className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {books.length === 0 && (
        <p className="col-span-full rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          কোনো বই পাওয়া যায়নি।
        </p>
      )}
    </section>
  );
}
