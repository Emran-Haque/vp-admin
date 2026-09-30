"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useScrollPagination } from "@/hooks/use-infinite-scroll";
import { useGetExamListInfiniteQuery, type Exam } from "@/redux/api/examsApi";

/**
 * Searchable exam dropdown that loads more exams as its list is scrolled.
 *
 * Replaces a native <select> that could only ever hold the first 100 exams
 * (the server's page-size cap), so older exams were unreachable for SMS.
 */

export type PickedExam = Pick<Exam, "id" | "title">;

export default function ExamPicker({
  value,
  onChange,
}: {
  value: PickedExam | null;
  onChange: (exam: PickedExam) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Nothing is fetched until the dropdown is first opened.
  const [hasOpened, setHasOpened] = useState(false);
  const [search, setSearch] = useState("");
  // Debounced so typing does not fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const examsQuery = useGetExamListInfiniteQuery(
    { search: debouncedSearch || undefined },
    { skip: !hasOpened },
  );
  const { data, isLoading, isFetching, isError, hasNextPage, isFetchingNextPage } =
    examsQuery;

  const listRef = useRef<HTMLDivElement>(null);
  const {
    items: exams,
    sentinelRef,
    loadMore,
    loadMoreFailed,
  } = useScrollPagination(examsQuery, {
    rootRef: listRef,
    rootMargin: "120px",
    enabled: isOpen,
  });

  // Close on a click outside or on Escape, like a native select.
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // A new search starts from the top of the list, not wherever the last one
  // was scrolled to.
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [debouncedSearch]);

  const select = (exam: Exam) => {
    onChange({ id: exam.id, title: exam.title });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setHasOpened(true);
          setIsOpen((open) => !open);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-left text-sm text-slate-200 focus:outline-none"
      >
        <span className={`truncate ${value ? "" : "text-slate-400"}`}>
          {value?.title ?? "পরীক্ষা নির্বাচন করুন"}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-[12px] border border-white/10 bg-gray-900 shadow-[0px_12px_28px_0px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2.5">
            <Search size={14} className="shrink-0 text-slate-500" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="পরীক্ষার নাম দিয়ে খুঁজুন…"
              className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
            {isFetching && !isFetchingNextPage && (
              <Loader2 size={14} className="shrink-0 animate-spin text-slate-500" />
            )}
          </div>

          <div ref={listRef} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {exams.map((exam) => {
              const isSelected = value?.id === exam.id;
              return (
                <button
                  key={exam.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(exam)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-white/5 ${
                    isSelected ? "text-blue-200" : "text-slate-200"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{exam.title}</span>
                    {exam.exam_date && (
                      <span className="block text-[11px] text-slate-500">
                        {exam.exam_date}
                      </span>
                    )}
                  </span>
                  {isSelected && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}

            {isLoading && (
              <p className="px-3.5 py-3 text-center text-xs text-slate-400">লোড হচ্ছে…</p>
            )}
            {isError && !loadMoreFailed && (
              <p className="px-3.5 py-3 text-center text-xs text-red-400">
                পরীক্ষার তালিকা আনা যায়নি।
              </p>
            )}
            {data && exams.length === 0 && (
              <p className="px-3.5 py-3 text-center text-xs text-slate-500">
                কোনো পরীক্ষা পাওয়া যায়নি।
              </p>
            )}

            {hasNextPage && <div ref={sentinelRef} aria-hidden className="h-px" />}
            {isFetchingNextPage && (
              <p className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
                <Loader2 size={13} className="animate-spin" />
                আরও লোড হচ্ছে…
              </p>
            )}
            {loadMoreFailed && (
              <button
                type="button"
                onClick={loadMore}
                className="w-full cursor-pointer py-2 text-center text-xs font-bold text-red-300"
              >
                আরও লোড করা যায়নি — আবার চেষ্টা করুন
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
