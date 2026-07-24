"use client";

import { useState } from "react";
import { X, HelpCircle, BookOpen, Package, AlertCircle } from "lucide-react";
import { useCreateFaqMutation } from "@/redux/api/contentApi";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import { useGetBooksQuery } from "@/redux/api/booksApi";
import { extractErrorMessage } from "@/lib/api-error";

export const CATEGORY_OPTIONS = [
  { value: "general", label: "সাধারণ (General)" },
  { value: "admission", label: "ভর্তি সংক্রান্ত (Admission)" },
  { value: "payment", label: "পেমেন্ট ও রিফান্ড (Payment)" },
  { value: "course", label: "কোর্স ভিত্তিক (Course)" },
  { value: "book", label: "বই সংক্রান্ত (Book)" },
];

export default function AddFaqModal({ onClose }: { onClose: () => void }) {
  const [createFaq, { isLoading }] = useCreateFaqMutation();
  const { data: coursesData } = useGetCoursesQuery();
  const { data: booksData } = useGetBooksQuery();

  const courses = coursesData?.results ?? [];
  const books = booksData?.results ?? [];

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("general");
  const [relatedCourse, setRelatedCourse] = useState<string>("");
  const [relatedBook, setRelatedBook] = useState<string>("");
  const [ordering, setOrdering] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setErrorMsg("প্রশ্ন এবং উত্তর ঘর দুটি পূরণ করা আবশ্যক।");
      return;
    }

    setErrorMsg(null);

    try {
      await createFaq({
        question: question.trim(),
        answer: answer.trim(),
        category,
        related_course: relatedCourse ? Number(relatedCourse) : null,
        related_book: relatedBook ? Number(relatedBook) : null,
        ordering,
        is_active: isActive,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create FAQ:", err);
      setErrorMsg(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <HelpCircle size={18} />
            </span>
            <h2 className="text-lg font-bold text-blue-50">নতুন FAQ যোগ করুন</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {Boolean(errorMsg) && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Question */}
          <div>
            <label className="text-xs font-medium text-slate-300">প্রশ্ন *</label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="যেমন: কোর্সে কীভাবে ভর্তি হব?"
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="text-xs font-medium text-slate-300">উত্তর *</label>
            <textarea
              required
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="প্রশ্নের বিস্তারিত উত্তর প্রদান করুন…"
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category & Ordering */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">ক্যাটাগরি</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">ক্রম (Ordering)</label>
              <input
                type="number"
                value={ordering}
                onChange={(e) => setOrdering(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Related Course & Related Book */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-300">
                <BookOpen size={13} className="text-indigo-400" />
                সম্পর্কিত কোর্স (ঐচ্ছিক)
              </label>
              <select
                value={relatedCourse}
                onChange={(e) => setRelatedCourse(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- কোনো কোর্স যুক্ত নেই --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-300">
                <Package size={13} className="text-purple-400" />
                সম্পর্কিত বই (ঐচ্ছিক)
              </label>
              <select
                value={relatedBook}
                onChange={(e) => setRelatedBook(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-2.5 text-sm text-blue-50 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- কোনো বই যুক্ত নেই --</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Switch */}
          <div className="rounded-xl border border-slate-800 bg-gray-900/40 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-slate-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
              />
              <span>সক্রিয় রাখুন (ওয়েবসাইটে প্রকাশিত হবে)</span>
            </label>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? "সংরক্ষণ করা হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
