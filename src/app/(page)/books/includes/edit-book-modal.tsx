"use client";

import { useState, useEffect, useRef } from "react";
import { X, Save, AlertTriangle, Upload, BookOpen, FileText, ExternalLink, HelpCircle, Plus, Trash2 } from "lucide-react";
import { useUpdateBookMutation, useGetBookCategoriesQuery, type Book } from "@/redux/api/booksApi";
import { getMediaUrl } from "@/redux/api/baseApi";
import {
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} from "@/redux/api/contentApi";
import type { FaqDraft } from "@/app/(page)/courses/create/includes/types";

export default function EditBookModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const [title, setTitle] = useState(book.title);
  const [category, setCategory] = useState(String(book.category));
  const [description, setDescription] = useState(book.description);
  const [author, setAuthor] = useState(book.author);
  const [publisher, setPublisher] = useState(book.publisher);
  const [pageCount, setPageCount] = useState(String(book.page_count));
  const [stock, setStock] = useState(String(book.stock));
  const [price, setPrice] = useState(book.price);
  const [oldPrice, setOldPrice] = useState(book.old_price);
  const [discount, setDiscount] = useState(book.discount);
  const [isAvailable, setIsAvailable] = useState(book.is_available);
  const [isFeatured, setIsFeatured] = useState(book.is_featured);
  const [promoVideoUrl, setPromoVideoUrl] = useState(book.promo_video_url);
  const [sampleDriveLink, setSampleDriveLink] = useState(book.sample_preview_drive_link);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [samplePreviewFile, setSamplePreviewFile] = useState<File | null>(null);
  const [faqs, setFaqs] = useState<FaqDraft[]>([]);

  const sampleInputRef = useRef<HTMLInputElement>(null);
  const originalFaqIdsRef = useRef<number[]>([]);

  const { data: categoriesData } = useGetBookCategoriesQuery();
  const categories = categoriesData?.results ?? [];

  const { data: faqsData } = useGetFaqsQuery({ related_book: book.id });
  const [createFaq] = useCreateFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const [deleteFaq] = useDeleteFaqMutation();

  useEffect(() => {
    if (faqsData?.results) {
      const bookFaqs = faqsData.results.filter((f) => f.related_book === book.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFaqs(
        bookFaqs.map((f) => ({
          id: String(f.id),
          question: f.question,
          answer: f.answer,
        }))
      );
      originalFaqIdsRef.current = bookFaqs.map((f) => f.id);
    }
  }, [faqsData, book.id]);

  const handleAddFaq = () => {
    setFaqs((prev) => [...prev, { id: crypto.randomUUID(), question: "", answer: "" }]);
  };

  const handleRemoveFaq = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateFaq = (id: string, field: "question" | "answer", val: string) => {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: val } : f)));
  };

  const [updateBook, { isLoading, isError }] = useUpdateBookMutation();

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("author", author);
    formData.append("publisher", publisher);
    if (pageCount) formData.append("page_count", pageCount);
    formData.append("stock", stock || "0");
    formData.append("price", price || "0");
    if (oldPrice) formData.append("old_price", oldPrice);
    if (discount) formData.append("discount", discount);
    formData.append("is_available", String(isAvailable));
    formData.append("is_featured", String(isFeatured));
    if (promoVideoUrl) formData.append("promo_video_url", promoVideoUrl);
    if (sampleDriveLink) formData.append("sample_preview_drive_link", sampleDriveLink);
    if (coverImage) formData.append("cover_image", coverImage);
    if (samplePreviewFile) formData.append("sample_preview_file", samplePreviewFile);

    try {
      await updateBook({ id: book.id, data: formData }).unwrap();

      // FAQ synchronization
      const currentIds = faqs.map((f) => Number(f.id)).filter((id) => !isNaN(id));
      const deletedIds = originalFaqIdsRef.current.filter((id) => !currentIds.includes(id));

      for (const delId of deletedIds) {
        await deleteFaq(delId).unwrap().catch(() => undefined);
      }

      for (let i = 0; i < faqs.length; i++) {
        const f = faqs[i];
        if (!f.question.trim() || !f.answer.trim()) continue;

        const numericId = Number(f.id);
        if (!isNaN(numericId) && originalFaqIdsRef.current.includes(numericId)) {
          await updateFaq({
            id: numericId,
            data: { question: f.question.trim(), answer: f.answer.trim(), ordering: i },
          }).unwrap().catch(() => undefined);
        } else {
          await createFaq({
            question: f.question.trim(),
            answer: f.answer.trim(),
            category: "book",
            related_book: book.id,
            related_course: null,
            ordering: i,
            is_active: true,
          }).unwrap().catch(() => undefined);
        }
      }

      onClose();
    } catch {
      // error state shown inline below
    }
  };

  const canSave = title.trim() && category;
  const coverPreview = coverImage ? URL.createObjectURL(coverImage) : getMediaUrl(book.cover_image);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[85vh] w-full max-w-[600px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-7 pb-0">
          <h2 className="text-base font-bold text-slate-50">বই সম্পাদনা করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-7">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">বই সংরক্ষণ করা যায়নি। তথ্য ও API সার্ভার সংযোগ যাচাই করুন।</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="preview" className="h-24 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <BookOpen size={20} className="text-slate-400" />
              </span>
            )}
            <label className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-200">
              <Upload size={14} />
              কভার ছবি পরিবর্তন করুন
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">বইয়ের নাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্যাটাগরি</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-800 text-slate-200">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিবরণ</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">লেখক</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">প্রকাশক</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পৃষ্ঠা সংখ্যা</label>
              <input
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">স্টক (কপি)</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">মূল্য (৳)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পুরাতন মূল্য</label>
              <input
                type="number"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">ছাড় (%)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">প্রোমো ভিডিও (YouTube URL)</label>
            <input
              type="text"
              value={promoVideoUrl}
              onChange={(e) => setPromoVideoUrl(e.target.value)}
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">স্যাম্পল পিডিএফ</label>
              {samplePreviewFile ? (
                <div className="flex items-center gap-2 rounded-[10px] border border-blue-500/40 bg-blue-500/10 p-2.5">
                  <FileText size={16} className="shrink-0 text-blue-400" />
                  <span className="flex-1 truncate text-xs text-blue-200">{samplePreviewFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSamplePreviewFile(null);
                      if (sampleInputRef.current) sampleInputRef.current.value = "";
                    }}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : book.sample_preview_file ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText size={16} className="shrink-0 text-emerald-400" />
                      <span className="truncate text-emerald-200 font-medium">
                        {book.sample_preview_file.split("/").pop() || "বর্তমান স্যাম্পল পিডিএফ"}
                      </span>
                    </div>
                    <a
                      href={book.sample_preview_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/30 shrink-0"
                    >
                      <ExternalLink size={12} />
                      দেখুন
                    </a>
                  </div>
                  <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10">
                    <Upload size={14} />
                    পিডিএফ পরিবর্তন করুন
                    <input
                      ref={sampleInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setSamplePreviewFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10">
                  <Upload size={14} />
                  আপলোড করুন
                  <input
                    ref={sampleInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setSamplePreviewFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-xs font-semibold text-slate-400">অথবা ড্রাইভ লিংক</label>
                {sampleDriveLink && sampleDriveLink.startsWith("http") && (
                  <a
                    href={sampleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:underline"
                  >
                    <ExternalLink size={11} />
                    লিংক খুলুন
                  </a>
                )}
              </div>
              <input
                type="text"
                value={sampleDriveLink}
                onChange={(e) => setSampleDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
            </div>
          </div>

          {/* FAQ section */}
          <div className="mt-1 flex flex-col gap-3 rounded-[14px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-purple-400" />
                <label className="text-xs font-bold text-slate-200">বইয়ের FAQ (প্রশ্ন ও উত্তর)</label>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="flex items-center gap-1 rounded-lg bg-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/30"
              >
                <Plus size={14} />
                FAQ যোগ করুন
              </button>
            </div>

            {faqs.map((faq, index) => (
              <div key={faq.id} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-gray-900/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">প্রশ্ন {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(faq.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => handleUpdateFaq(faq.id, "question", e.target.value)}
                  placeholder="যেমন: এই বইটি কোন বিষয়ের জন্য উপযোগী?"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => handleUpdateFaq(faq.id, "answer", e.target.value)}
                  placeholder="প্রশ্নের উত্তর বিস্তারিত লিখুন..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            ))}

            {faqs.length === 0 && (
              <p className="text-center text-xs text-slate-500">কোনো FAQ যুক্ত হয়নি। উপরের বাটন চেপে যোগ করুন।</p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="size-4 cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-medium text-slate-400">বইটি উপলব্ধ রাখুন</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="size-4 cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-medium text-slate-400">ফিচার্ড হিসেবে দেখান</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 p-7 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !canSave}
            className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} />
            {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
