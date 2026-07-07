"use client";

import { Upload } from "lucide-react";
import { useGetCourseCategoriesQuery } from "@/redux/api/coursesApi";
import type { BasicInfo } from "./types";

type Props = {
  value: BasicInfo;
  onChange: (value: BasicInfo) => void;
};

const levels = [
  { value: "beginner", label: "শুরুর স্তর" },
  { value: "intermediate", label: "মধ্যম স্তর" },
  { value: "advanced", label: "উচ্চ স্তর" },
];

export default function StepBasicInfo({ value, onChange }: Props) {
  const { data: categoriesData } = useGetCourseCategoriesQuery();
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results ?? [];

  const set = <K extends keyof BasicInfo>(key: K, val: BasicInfo[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
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
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="কোর্সে কী কী থাকবে তা সংক্ষেপে লিখুন"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-3">
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

        <div>
          <label className="block pb-1.5 text-base font-medium text-blue-50">মূল্য (৳)</label>
          <input
            type="number"
            value={value.price}
            onChange={(e) => set("price", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-6">
        <label className="block pb-1.5 text-base font-medium text-blue-50">মোট সময়কাল</label>
        <input
          type="text"
          value={value.duration}
          onChange={(e) => set("duration", e.target.value)}
          placeholder="যেমন: ৩০ ঘণ্টা"
          className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="pt-6">
        <label className="block pb-1.5 text-base font-medium text-blue-50">কভার ইমেজ</label>
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-slate-800 p-7 text-center">
          <Upload size={36} className="text-slate-400" strokeWidth={1.5} />
          <p className="pt-2 text-base font-medium text-blue-50">ছবি আপলোড করতে ক্লিক করুন</p>
          <p className="text-sm text-slate-400">PNG, JPG (সর্বোচ্চ 5MB)</p>
          <input type="file" accept="image/png,image/jpeg" className="hidden" />
        </label>
      </div>
    </section>
  );
}
