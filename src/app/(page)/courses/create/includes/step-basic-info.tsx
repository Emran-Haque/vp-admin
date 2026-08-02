"use client";

import { useEffect, useMemo, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { useGetCourseCategoriesQuery } from "@/redux/api/coursesApi";
import type { BasicInfo, CourseFiles } from "./types";

type ExistingCourseFiles = {
  thumbnail: string | null;
  coverImage: string | null;
  syllabusPdf: string | null;
};

type Props = {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
  files: CourseFiles;
  onFilesChange: (files: CourseFiles) => void;
  existingFiles?: ExistingCourseFiles;
};

const levels = [
  { value: "beginner", label: "শুরুর স্তর" },
  { value: "intermediate", label: "মধ্যম স্তর" },
  { value: "advanced", label: "উচ্চ স্তর" },
];

function ImageUploadField({
  label,
  hint,
  file,
  existingUrl,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const displayUrl = previewUrl ?? existingUrl ?? null;

  return (
    <div>
      <label className="block pb-1.5 text-base font-medium text-blue-50">{label}</label>
      {displayUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt={label} className="h-40 w-full object-cover" />
          {!previewUrl && (
            <span className="absolute left-2 top-2 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-medium text-blue-50">
              বর্তমান ছবি
            </span>
          )}
          {previewUrl ? (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg bg-slate-900/80 text-white"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute right-2 top-2 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white"
            >
              পরিবর্তন করুন
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-slate-800 p-7 text-center">
          <Upload size={32} className="text-slate-400" strokeWidth={1.5} />
          <p className="pt-2 text-base font-medium text-blue-50">ছবি আপলোড করতে ক্লিক করুন</p>
          <p className="text-sm text-slate-400">{hint}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}

function FileUploadField({
  label,
  hint,
  file,
  existingUrl,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const existingFileName = existingUrl ? decodeURIComponent(existingUrl.split("/").pop() || existingUrl) : null;

  return (
    <div>
      <label className="block pb-1.5 text-base font-medium text-blue-50">{label}</label>
      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gray-800 p-4">
          <FileText size={24} className="shrink-0 text-blue-500" />
          <span className="flex-1 truncate text-sm text-blue-50">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
      ) : existingUrl ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-gray-800 p-4">
          <FileText size={24} className="shrink-0 text-blue-500" />
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-sm text-blue-50 underline"
          >
            {existingFileName}
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300"
          >
            পরিবর্তন করুন
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-slate-800 p-7 text-center">
          <Upload size={32} className="text-slate-400" strokeWidth={1.5} />
          <p className="pt-2 text-base font-medium text-blue-50">ফাইল আপলোড করতে ক্লিক করুন</p>
          <p className="text-sm text-slate-400">{hint}</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}

export default function StepBasicInfo({ value, onChange, files, onFilesChange, existingFiles }: Props) {
  const { data: categoriesData } = useGetCourseCategoriesQuery();
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results ?? [];

  const set = <K extends keyof BasicInfo>(key: K, val: BasicInfo[K]) => {
    onChange({ ...value, [key]: val });
  };

  const setFile = <K extends keyof CourseFiles>(key: K, val: CourseFiles[K]) => {
    onFilesChange({ ...files, [key]: val });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <h2 className="text-xl font-bold leading-8 text-blue-50">মৌলিক তথ্য</h2>

        <div className="pt-6">
          <label className="block pb-1.5 text-base font-medium text-blue-50">কোর্সের নাম</label>
          <input
            type="text"
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="যেমন: HSC বাংলা প্রস্তুতি কোর্স"
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="pt-6">
          <label className="block pb-1.5 text-base font-medium text-blue-50">সংক্ষিপ্ত বিবরণ</label>
          <textarea
            value={value.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            placeholder="কোর্সে কী কী থাকবে তা সংক্ষেপে লিখুন"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="pt-6">
          <label className="block pb-1.5 text-base font-medium text-blue-50">বিস্তারিত বিবরণ</label>
          <textarea
            value={value.fullDescription}
            onChange={(e) => set("fullDescription", e.target.value)}
            placeholder="কোর্সটি নিয়ে বিস্তারিত লিখুন"
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="pt-6">
          <label className="block pb-1.5 text-base font-medium text-blue-50">এই কোর্সটি কেন প্রয়োজন</label>
          <textarea
            value={value.whyNeeded}
            onChange={(e) => set("whyNeeded", e.target.value)}
            placeholder="শিক্ষার্থীরা কেন এই কোর্সটি নেবে তা লিখুন"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">ক্যাটাগরি</label>
            <select
              value={value.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3.5 text-base text-blue-50 focus:outline-none"
            >
              <option value="">নির্বাচন করুন</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">স্তর</label>
            <select
              value={value.level}
              onChange={(e) => set("level", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3.5 text-base text-blue-50 focus:outline-none"
            >
              <option value="">নির্বাচন করুন</option>
              {levels.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <h2 className="text-xl font-bold leading-8 text-blue-50">মূল্য নির্ধারণ</h2>

        <label className="mt-5 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={value.isFree}
            onChange={(e) => set("isFree", e.target.checked)}
            className="size-4 cursor-pointer accent-blue-500"
          />
          <span className="text-base font-medium text-blue-50">এটি একটি ফ্রি কোর্স</span>
        </label>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-gray-900/50 p-4">
          <input
            type="checkbox"
            checked={value.verificationRequired}
            onChange={(e) => set("verificationRequired", e.target.checked)}
            className="mt-1 size-4 cursor-pointer accent-blue-500"
          />
          <span>
            <span className="block text-base font-semibold text-blue-50">
              ভর্তির পর অ্যাডমিন ভেরিফিকেশন লাগবে
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-400">
              চালু থাকলে পেমেন্টের পর শিক্ষার্থী কোর্সটি দেখবে, কিন্তু অ্যাডমিন অনুমোদন না দেওয়া পর্যন্ত খুলতে পারবে না।
            </span>
          </span>
        </label>

        {!value.isFree && (
          <div className="grid grid-cols-1 gap-6 pt-5 sm:grid-cols-3">
            <div>
              <label className="block pb-1.5 text-base font-medium text-blue-50">মূল্য (৳)</label>
              <input
                type="number"
                value={value.price}
                onChange={(e) => set("price", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-base font-medium text-blue-50">পুরাতন মূল্য (৳)</label>
              <input
                type="number"
                value={value.oldPrice}
                onChange={(e) => set("oldPrice", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-base font-medium text-blue-50">ছাড় (%)</label>
              <input
                type="number"
                value={value.discount}
                onChange={(e) => set("discount", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
              />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <h2 className="text-xl font-bold leading-8 text-blue-50">সময়সূচি ও পরিসংখ্যান</h2>

        <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">মোট সময়কাল</label>
            <input
              type="text"
              value={value.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="যেমন: ৩০ ঘণ্টা"
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div />

          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">ব্যাচ শুরুর তারিখ</label>
            <input
              type="date"
              value={value.batchStartDate}
              onChange={(e) => set("batchStartDate", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">ক্লাস শুরুর তারিখ</label>
            <input
              type="date"
              value={value.classStartDate}
              onChange={(e) => set("classStartDate", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-3">
          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">মোট ক্লাস</label>
            <input
              type="number"
              value={value.totalClasses}
              onChange={(e) => set("totalClasses", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">মোট কুইজ</label>
            <input
              type="number"
              value={value.totalQuizzes}
              onChange={(e) => set("totalQuizzes", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">মোট অ্যাসাইনমেন্ট</label>
            <input
              type="number"
              value={value.totalAssignments}
              onChange={(e) => set("totalAssignments", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-6">
          <label className="block pb-1.5 text-base font-medium text-blue-50">
            নিষ্ক্রিয়তা রিমাইন্ডার (SMS)
          </label>
          <select
            value={value.inactivityReminderDays}
            onChange={(e) => set("inactivityReminderDays", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
          >
            <option value="0">বন্ধ</option>
            <option value="1">১ দিন নিষ্ক্রিয় থাকলে</option>
            <option value="2">২ দিন নিষ্ক্রিয় থাকলে</option>
            <option value="3">৩ দিন নিষ্ক্রিয় থাকলে</option>
          </select>
          <p className="pt-1.5 text-sm text-slate-400">
            শিক্ষার্থী এই কয়দিন কোর্সে না ঢুকলে স্বয়ংক্রিয়ভাবে SMS রিমাইন্ডার পাবে।
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">Telegram অ্যাসাইনমেন্ট গ্রুপ</h2>
            <p className="mt-1 text-sm text-slate-400">
              শিক্ষার্থীদের জন্য ইনভাইট লিংক সংরক্ষণ করুন। কানেক্ট কমান্ড পাঠানোর পর বট গ্রুপ আইডি শনাক্ত করে সংরক্ষণ করবে।
            </p>
          </div>
          {value.telegramGroupChatId ? (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              সংযুক্ত
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
              সংযুক্ত নয়
            </span>
          )}
        </div>

        <div className="pt-6">
          <label className="block pb-1.5 text-base font-medium text-blue-50">Telegram গ্রুপ ইনভাইট লিংক</label>
          <input
            type="url"
            value={value.telegramGroupLink}
            onChange={(e) => set("telegramGroupLink", e.target.value)}
            placeholder="https://t.me/+your-course-group"
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-gray-900/50 p-4">
          <p className="text-sm font-semibold text-blue-50">গ্রুপ সংযোগ কমান্ড</p>
          {value.telegramGroupConnectCode ? (
            <>
              <code className="mt-2 block rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-emerald-400">
                /connect_course {value.telegramGroupConnectCode}
              </code>
              <p className="mt-2 text-xs text-slate-400">
                Telegram গ্রুপে @VaiyaderPathshala_bot যোগ করুন, তারপর সেই গ্রুপে এই কমান্ডটি পাঠান।
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              কানেক্ট কমান্ড তৈরি করতে আগে কোর্সের খসড়া সংরক্ষণ করুন।
            </p>
          )}
          {value.telegramGroupChatId ? (
            <p className="mt-3 text-xs text-slate-400">
              সংযুক্ত গ্রুপ: {value.telegramGroupTitle || "Telegram গ্রুপ"} · ID {value.telegramGroupChatId}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <div className="flex items-center gap-2.5">
          <ImageIcon size={20} className="text-blue-500" />
          <h2 className="text-xl font-bold leading-8 text-blue-50">মিডিয়া ও লিংক</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
          <ImageUploadField
            label="থাম্বনেইল ছবি"
            hint="PNG, JPG (সর্বোচ্চ 5MB)"
            file={files.thumbnail}
            existingUrl={existingFiles?.thumbnail}
            onChange={(f) => setFile("thumbnail", f)}
          />
          <ImageUploadField
            label="কভার ইমেজ"
            hint="PNG, JPG (সর্বোচ্চ 5MB)"
            file={files.coverImage}
            existingUrl={existingFiles?.coverImage}
            onChange={(f) => setFile("coverImage", f)}
          />
        </div>

        <div className="pt-6">
          <label className="block pb-1.5 text-base font-medium text-blue-50">প্রোমো ভিডিও (YouTube URL)</label>
          <input
            type="text"
            value={value.promoVideoUrl}
            onChange={(e) => set("promoVideoUrl", e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
          <FileUploadField
            label="সিলেবাস পিডিএফ"
            hint="PDF ফাইল"
            file={files.syllabusPdf}
            existingUrl={existingFiles?.syllabusPdf}
            onChange={(f) => setFile("syllabusPdf", f)}
          />

          <div>
            <label className="block pb-1.5 text-base font-medium text-blue-50">সিলেবাস ড্রাইভ লিংক</label>
            <input
              type="text"
              value={value.syllabusDriveLink}
              onChange={(e) => set("syllabusDriveLink", e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
            />
            <p className="mt-1.5 text-sm text-slate-400">পিডিএফ আপলোড না করলে বিকল্প হিসেবে ব্যবহার করুন</p>
          </div>
        </div>
      </section>
    </div>
  );
}
