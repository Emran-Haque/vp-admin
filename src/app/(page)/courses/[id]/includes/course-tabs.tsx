"use client";

import { useState } from "react";
import { Video, Radio, FileText, ClipboardCheck, type LucideIcon } from "lucide-react";
import RecordingsTab from "./recordings-tab";
import LiveClassTab from "./live-class-tab";
import ResourcesTab from "./resources-tab";
import McqTab from "./mcq-tab";

type TabKey = "recordings" | "live" | "resources" | "mcq";

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "recordings", label: "ক্লাস রেকর্ডিং", icon: Video },
  { key: "live", label: "লাইভ ক্লাস", icon: Radio },
  { key: "resources", label: "রিসোর্স", icon: FileText },
  { key: "mcq", label: "MCQ পরীক্ষা", icon: ClipboardCheck },
];

export default function CourseTabs({ courseId }: { courseId: number }) {
  const [activeTab, setActiveTab] = useState<TabKey>("recordings");

  return (
    <section>
      <div className="flex flex-wrap gap-2.5">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors duration-200 ${
                active
                  ? "border-blue-500 bg-blue-500/10 text-blue-50"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-blue-50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        {activeTab === "recordings" && <RecordingsTab courseId={courseId} />}
        {activeTab === "live" && <LiveClassTab courseId={courseId} />}
        {activeTab === "resources" && <ResourcesTab courseId={courseId} />}
        {activeTab === "mcq" && <McqTab courseId={courseId} />}
      </div>
    </section>
  );
}
