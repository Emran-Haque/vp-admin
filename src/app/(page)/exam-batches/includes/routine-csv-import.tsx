"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, Copy, Download, FileText, Loader2, Upload, X } from "lucide-react";
import { useImportRoutineMutation, type ExamBatch, type RoutineImportExam } from "@/redux/api/examsApi";
import { extractErrorMessage } from "@/lib/api-error";
import { parseRoutineCsv, ROUTINE_SAMPLE_CSV } from "./routine-csv";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** Routine CSV import toolbar: upload a schedule-only routine (one row per exam),
 *  preview/confirm, plus a copy/download sample. Questions are added per tile. */
export default function RoutineCsvImport({
  batchId,
  onImported,
}: {
  batchId: number;
  onImported: (batch: ExamBatch) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<RoutineImportExam[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSample, setShowSample] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importRoutine, { isLoading: isImporting }] = useImportRoutineMutation();
  const [importError, setImportError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setIsParsing(true);
    setErrors([]);
    setImportError(null);
    try {
      const result = await parseRoutineCsv(file);
      setErrors(result.errors);
      setParsed(result.exams.length > 0 ? result.exams : null);
      if (result.exams.length === 0 && result.errors.length === 0) {
        setErrors(["ফাইলে কোনো পরীক্ষা পাওয়া যায়নি।"]);
      }
    } catch {
      setErrors(["CSV ফাইলটি পড়া যায়নি। ফরম্যাট যাচাই করুন।"]);
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!parsed) return;
    setImportError(null);
    try {
      // Schedule-only rows have no questions yet, so they stay draft.
      const { batch } = await importRoutine({ batchId, publish: false, exams: parsed }).unwrap();
      setParsed(null);
      setErrors([]);
      onImported(batch);
    } catch (err) {
      setImportError(extractErrorMessage(err));
    }
  };

  const copySample = async () => {
    try {
      await navigator.clipboard.writeText(ROUTINE_SAMPLE_CSV);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([String.fromCharCode(0xfeff) + ROUTINE_SAMPLE_CSV], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "routine-sample.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">
          {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          CSV দিয়ে রুটিন যোগ করুন
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" disabled={isParsing} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </label>
        <button
          type="button"
          onClick={() => setShowSample(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5"
        >
          <FileText size={16} /> নমুনা দেখুন
        </button>
      </div>

      {errors.length > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-400">
            <AlertTriangle size={16} /> {bn(errors.length)} টি সমস্যা
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-slate-400">
            {errors.slice(0, 8).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Preview / confirm modal */}
      {parsed ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-bold text-blue-50">রুটিন প্রিভিউ</h3>
              <button type="button" onClick={() => setParsed(null)} className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <p className="mb-3 text-sm text-slate-300">
                <span className="font-bold text-emerald-300">{bn(parsed.length)}</span> টি পরীক্ষা রুটিনে যোগ হবে। প্রতিটির অধীনে পরে MCQ প্রশ্ন যোগ করবেন।
              </p>
              <div className="grid gap-2">
                {parsed.map((exam, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-100">{exam.title}</p>
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                        {bn(exam.planned_questions ?? 0)} প্রশ্ন
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {exam.subject_label || "বিষয় নেই"} · {exam.exam_date || "তারিখ নেই"} ·{" "}
                      {bn(exam.duration_minutes ?? 30)} মিনিট · প্রতি প্রশ্ন {bn(exam.marks_per_question ?? "1")} নম্বর
                      {exam.end_time ? " · ডেডলাইন আছে" : ""}
                    </p>
                  </div>
                ))}
              </div>
              {importError ? (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">{importError}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button
                type="button"
                onClick={confirmImport}
                disabled={isImporting}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {isImporting ? "যোগ হচ্ছে…" : "রুটিন যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Sample modal */}
      {showSample ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setShowSample(false)}>
          <div className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-bold text-blue-50">রুটিন CSV নমুনা ও ফরম্যাট</h3>
              <button type="button" onClick={() => setShowSample(false)} className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">
              <p className="text-xs leading-6 text-slate-400">
                প্রতিটি সারি একটি পরীক্ষার শিডিউল। কলাম:{" "}
                <span className="font-semibold text-slate-200">name, subject, date, start_time, end_time, duration_minutes, mark, questions</span>{" "}
                (<span className="font-semibold text-slate-200">mark</span> = প্রতি প্রশ্নের নম্বর, <span className="font-semibold text-slate-200">questions</span> = প্রশ্ন সংখ্যা)। শুধু <span className="font-semibold text-slate-200">name</span> আবশ্যক। প্রশ্ন পরে প্রতিটি টাইলে যোগ করবেন।
              </p>
              <div className="mt-4 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <pre className="whitespace-pre text-xs leading-6 text-slate-300">{ROUTINE_SAMPLE_CSV}</pre>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-800 px-6 py-4">
              <button type="button" onClick={copySample} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/5">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "কপি হয়েছে" : "ফরম্যাট কপি করুন"}
              </button>
              <button type="button" onClick={downloadSample} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500">
                <Download size={14} /> নমুনা CSV ডাউনলোড
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
