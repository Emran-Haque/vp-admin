"use client";

import { useEffect, useState } from "react";
import { Download, FileDown, Loader2, Trophy, X } from "lucide-react";
import { useLazyGetExamAttemptsQuery, type Exam, type ExamAttempt } from "@/redux/api/examsApi";
import {
  buildTopThreeHtml,
  downloadLeaderboardPdf,
  downloadTopThreePng,
  livePhotoUrls,
  loadLeaderboardFont,
  rankedOnly,
} from "./leaderboard";

/** লিডারবোর্ড PDF + সেরা ৩ buttons for one exam card on the MCQ page. */
export default function LeaderboardButtons({ exam }: { exam: Exam }) {
  const [fetchAttempts] = useLazyGetExamAttemptsQuery();
  const [busy, setBusy] = useState<"pdf" | "top" | null>(null);
  const [topAttempts, setTopAttempts] = useState<ExamAttempt[] | null>(null);

  // Every finished attempt, all pages (the API caps a page at 100).
  async function loadAll() {
    const all: ExamAttempt[] = [];
    for (let page = 1; ; page++) {
      const res = await fetchAttempts({ exam: exam.id, completed: true, ordering: "-final_marks", page, page_size: 100 }).unwrap();
      all.push(...res.results);
      if (!res.next) break;
    }
    return all;
  }

  async function onPdf() {
    setBusy("pdf");
    try {
      const all = await loadAll();
      if (rankedOnly(all).length === 0) {
        window.alert("এই পরীক্ষায় এখনো কোনো র‍্যাঙ্ক করা ফলাফল নেই।");
        return;
      }
      await downloadLeaderboardPdf(exam, all);
    } catch {
      window.alert("লিডারবোর্ড PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(null);
    }
  }

  async function onTop() {
    setBusy("top");
    try {
      const all = await loadAll();
      if (rankedOnly(all).length === 0) {
        window.alert("এই পরীক্ষায় এখনো কোনো র‍্যাঙ্ক করা ফলাফল নেই।");
        return;
      }
      await loadLeaderboardFont().catch(() => undefined);
      setTopAttempts(all);
    } catch {
      window.alert("ফলাফল আনা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(null);
    }
  }

  const btn =
    "flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-black transition-colors disabled:cursor-wait disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        onClick={onTop}
        disabled={busy !== null}
        className={`${btn} border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20`}
      >
        {busy === "top" ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
        সেরা ৩
      </button>
      <button
        type="button"
        onClick={onPdf}
        disabled={busy !== null}
        className={`${btn} border-violet-500/40 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20`}
      >
        {busy === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        {busy === "pdf" ? "তৈরি হচ্ছে…" : "লিডারবোর্ড PDF"}
      </button>

      {topAttempts && <TopThreeModal exam={exam} attempts={topAttempts} onClose={() => setTopAttempts(null)} />}
    </>
  );
}

function TopThreeModal({ exam, attempts, onClose }: { exam: Exam; attempts: ExamAttempt[]; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const top = rankedOnly(attempts).slice(0, 3);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSave() {
    setSaving(true);
    try {
      await downloadTopThreePng(exam, attempts);
    } catch {
      window.alert("ছবি তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-[760px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
          <p className="flex items-center gap-2 text-base font-bold text-blue-50">
            <Trophy size={18} className="text-amber-400" />
            সেরা ৩ জন — {exam.title}
          </p>
          <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-auto p-5">
          <div
            className="mx-auto w-[720px]"
            // Built from escaped API data in leaderboard.ts — the same card the PNG saves.
            dangerouslySetInnerHTML={{ __html: buildTopThreeHtml(exam, top, livePhotoUrls(top)) }}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-bold text-slate-200 hover:bg-slate-800"
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-black text-slate-950 hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            ছবি ডাউনলোড (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}
