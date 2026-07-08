"use client";

import { Search, ChevronDown } from "lucide-react";
import type { Course } from "@/redux/api/coursesApi";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  courses: Course[];
  courseFilter: number | "all";
  onCourseFilterChange: (value: number | "all") => void;
  statusFilter: "all" | "passed" | "failed";
  onStatusFilterChange: (value: "all" | "passed" | "failed") => void;
};

export default function Toolbar({
  search,
  onSearchChange,
  courses,
  courseFilter,
  onCourseFilterChange,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
      <div className="relative min-w-64 flex-1">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="শিক্ষার্থী, আইডি বা পরীক্ষা খুঁজুন..."
          className="w-full rounded-2xl border border-slate-800 bg-gray-900 py-2 pl-8 pr-3 text-xs text-blue-50 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <div className="relative">
        <select
          value={courseFilter === "all" ? "all" : String(courseFilter)}
          onChange={(e) => onCourseFilterChange(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="cursor-pointer appearance-none rounded-lg border border-slate-800 bg-gray-800 py-2.5 pl-4 pr-9 text-xs text-white focus:outline-none"
        >
          <option value="all" className="bg-gray-800 text-white">
            সকল কোর্স
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id} className="bg-gray-800 text-white">
              {course.title}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white" />
      </div>

      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as "all" | "passed" | "failed")}
          className="cursor-pointer appearance-none rounded-lg border border-slate-800 bg-gray-800 py-2.5 pl-4 pr-9 text-xs text-white focus:outline-none"
        >
          <option value="all" className="bg-gray-800 text-white">
            সকল স্ট্যাটাস
          </option>
          <option value="passed" className="bg-gray-800 text-white">
            উত্তীর্ণ
          </option>
          <option value="failed" className="bg-gray-800 text-white">
            অনুত্তীর্ণ
          </option>
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white" />
      </div>
    </div>
  );
}
