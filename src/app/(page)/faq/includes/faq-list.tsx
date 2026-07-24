"use client";

import { useState } from "react";
import {
  HelpCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Package,
} from "lucide-react";
import {
  useGetFaqsQuery,
  useDeleteFaqMutation,
  useUpdateFaqMutation,
  type Faq,
} from "@/redux/api/contentApi";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import { useGetBooksQuery } from "@/redux/api/booksApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";
import { CATEGORY_OPTIONS } from "./add-faq-modal";

const CATEGORY_LABELS: Record<string, string> = {
  general: "সাধারণ",
  admission: "ভর্তি",
  payment: "পেমেন্ট",
  course: "কোর্স",
  book: "বই",
};

export default function FaqList({ onEdit }: { onEdit: (faq: Faq) => void }) {
  const { data, isLoading, isError, error } = useGetFaqsQuery();
  const { data: coursesData } = useGetCoursesQuery();
  const { data: booksData } = useGetBooksQuery();

  const [deleteFaq] = useDeleteFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-slate-400">FAQ তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return <ErrorState message="FAQ তালিকা আনতে সমস্যা হয়েছে। API সংযোগ পরীক্ষা করুন।" error={error} />;
  }

  const allFaqs = data?.results ?? [];
  const courses = coursesData?.results ?? [];
  const books = booksData?.results ?? [];

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));
  const bookMap = new Map(books.map((b) => [b.id, b.title]));

  const filteredFaqs = allFaqs
    .filter((faq) => {
      const matchesSearch =
        !search.trim() ||
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ? true : faq.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "all"
          ? true
          : selectedStatus === "active"
          ? faq.is_active
          : !faq.is_active;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0));

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="প্রশ্ন বা উত্তর লিখে খুঁজুন…"
            className="w-full rounded-2xl border border-slate-800 bg-gray-800 pl-11 pr-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-2xl border border-slate-800 bg-gray-800 px-3.5 py-2 text-xs font-semibold text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">সব ক্যাটাগরি</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-gray-800 p-1">
            {[
              { key: "all", label: "সকল" },
              { key: "active", label: "সক্রিয়" },
              { key: "inactive", label: "নিষ্ক্রিয়" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedStatus(key as typeof selectedStatus)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedStatus === key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion FAQ items list */}
      <div className="flex flex-col gap-3.5">
        {filteredFaqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          const courseTitle = faq.related_course ? courseMap.get(faq.related_course) : null;
          const bookTitle = faq.related_book ? bookMap.get(faq.related_book) : null;
          const categoryLabel = CATEGORY_LABELS[faq.category] || faq.category;

          return (
            <div
              key={faq.id}
              className={`overflow-hidden rounded-2xl border transition-all ${
                isExpanded
                  ? "border-indigo-500/40 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(99,102,241,0.20)]"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              {/* Header section */}
              <div
                onClick={() => toggleExpand(faq.id)}
                className="flex cursor-pointer items-center justify-between gap-4 p-5"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <HelpCircle size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-blue-50">{faq.question}</h3>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-indigo-500/15 px-2.5 py-0.5 font-medium text-indigo-300">
                        {categoryLabel}
                      </span>

                      {courseTitle && (
                        <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-0.5 font-medium text-amber-400">
                          <BookOpen size={12} />
                          {courseTitle}
                        </span>
                      )}

                      {bookTitle && (
                        <span className="flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-0.5 font-medium text-purple-400">
                          <Package size={12} />
                          {bookTitle}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2.5 py-0.5 font-semibold outline outline-1 outline-offset-[-1px] ${
                          faq.is_active
                            ? "bg-emerald-500/10 text-emerald-400 outline-emerald-500/40"
                            : "bg-slate-800 text-slate-400 outline-slate-700"
                        }`}
                      >
                        {faq.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>

                      {faq.ordering > 0 && (
                        <span className="text-slate-500">
                          ক্রম: #{faq.ordering}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle Active Button */}
                    {hasPermission("can_manage_faq") && (
                      <button
                        type="button"
                        onClick={() => updateFaq({ id: faq.id, data: { is_active: !faq.is_active } })}
                        title={faq.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                        className={`flex size-9 items-center justify-center rounded-xl border transition-colors ${
                          faq.is_active
                            ? "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
                            : "border-slate-800 bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {faq.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    )}

                    {/* Edit Button */}
                    {hasPermission("can_manage_faq") && (
                      <button
                        type="button"
                        onClick={() => onEdit(faq)}
                        title="সম্পাদনা করুন"
                        className="flex size-9 items-center justify-center rounded-xl border border-slate-800 text-blue-50 transition-colors hover:bg-white/5"
                      >
                        <Pencil size={15} />
                      </button>
                    )}

                    {/* Delete Button */}
                    {hasPermission("can_manage_faq") && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`FAQ-টি মুছে ফেলতে চান?`)) {
                            deleteFaq(faq.id);
                          }
                        }}
                        title="মুছে ফেলুন"
                        className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-500 transition-colors hover:bg-red-600/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </div>
              </div>

              {/* Expanded Answer body */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-gray-950/60 p-5 text-sm leading-relaxed text-slate-300">
                  <p className="whitespace-pre-line">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <p className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-400">
            কোনো FAQ পাওয়া যায়নি।
          </p>
        )}
      </div>
    </div>
  );
}
