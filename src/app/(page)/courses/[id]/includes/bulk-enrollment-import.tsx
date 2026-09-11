"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  MessageSquareWarning,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  coursesApi,
  type BulkEnrollmentJob,
  useCancelBulkEnrollmentMutation,
  useDownloadBulkEnrollmentReportMutation,
  useGetBulkEnrollmentJobsQuery,
  useRetryBulkEnrollmentMessagesMutation,
  useStartBulkEnrollmentMutation,
  useUploadBulkEnrollmentCsvMutation,
} from "@/redux/api/coursesApi";
import { extractErrorMessage } from "@/lib/api-error";
import { usePermissions } from "@/hooks/use-permissions";
import { exportBulkEnrollmentReportPdf } from "./bulk-enrollment-report-pdf";

const SAMPLE = `name,email,phone,password
Rahim Ahmed,rahim@example.com,01710000001,Rahim@12345
Nusrat Jahan,nusrat@example.com,01710000002,Nusrat@12345`;

const ACTIVE = new Set(["queued", "processing"]);
const REQUIRED_COLUMNS = ["full_name", "email", "phone", "password"];
const HEADER_ALIASES: Record<string, string> = {
  name: "full_name",
};

function cleanHeader(value: string) {
  const header = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return HEADER_ALIASES[header] ?? header;
}

function csvCell(value: unknown) {
  const text = String(value ?? "").trim();
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function normalizeCsvFile(file: File): Promise<File> {
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  if (!parsed.data.length) {
    throw new Error("CSV ফাইলে কোনো তথ্য পাওয়া যায়নি।");
  }

  const headers = parsed.data[0].map(cleanHeader);
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error("CSV header দিন: name, email, phone, password");
  }

  const rows = parsed.data.slice(1).filter((row) =>
    row.some((cell) => String(cell ?? "").trim()),
  );
  if (!rows.length) {
    throw new Error("CSV ফাইলে কোনো শিক্ষার্থীর সারি নেই।");
  }

  const normalized = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      headers.map((_header, index) => csvCell(row[index] ?? "")).join(","),
    ),
  ].join("\n");

  return new File([normalized], file.name, { type: "text/csv" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function statusText(status: BulkEnrollmentJob["status"]) {
  return {
    draft: "প্রিভিউ প্রস্তুত",
    queued: "কিউতে অপেক্ষমাণ",
    processing: "ভর্তি ও মেসেজ চলছে",
    completed: "সম্পন্ন",
    cancelled: "বাতিল",
  }[status];
}

const SMS_FAILURES: Record<string, string> = {
  "1001": "মোবাইল নম্বরটি সঠিক নয়",
  "1002": "SMS Sender ID সঠিক বা সক্রিয় নয়",
  "1007": "SMS ব্যালেন্স পর্যাপ্ত নয়",
  "1012": "Masking SMS-এর বার্তা বাংলায় হতে হবে",
  "1013": "API key-এর সঙ্গে Sender ID যুক্ত নেই",
  "1014": "Sender ID-এর ধরন সঠিক নয়",
  "1015": "Sender ID-এর সক্রিয় gateway নেই",
  "1018": "SMS অ্যাকাউন্টটি নিষ্ক্রিয়",
  "1031": "SMS অ্যাকাউন্ট যাচাই করা নেই",
  "1032": "সার্ভারের IP whitelist করা নেই",
};

function issueText(issue: BulkEnrollmentJob["issues"][number]) {
  if (issue.status !== "message_failed") return issue.detail;
  if (issue.detail.includes("masking_sender_required")) {
    return "ভর্তি সফল, কিন্তু approved masking Sender ID সেট করা নেই বলে SMS পাঠানো হয়নি।";
  }
  const code = issue.detail.match(/SMS failed:\s*(\d{3,4})/)?.[1];
  const reason = code ? SMS_FAILURES[code] : undefined;
  return `ভর্তি সফল, কিন্তু SMS যায়নি। ${reason ?? "SMS gateway অনুরোধটি গ্রহণ করেনি"}${code ? ` (কোড ${code})` : ""}`;
}

export default function BulkEnrollmentImport({
  courseId,
  courseTitle,
  onCompleted,
}: {
  courseId: number;
  courseTitle: string;
  onCompleted: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const refreshedJobId = useRef<number | null>(null);
  const { isAdmin } = usePermissions();
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [preview, setPreview] = useState<BulkEnrollmentJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [uploadCsv, { isLoading: isUploading }] = useUploadBulkEnrollmentCsvMutation();
  const [startJob, { isLoading: isStarting }] = useStartBulkEnrollmentMutation();
  const [cancelJob, { isLoading: isCancelling }] = useCancelBulkEnrollmentMutation();
  const [retryMessages, { isLoading: isRetrying }] = useRetryBulkEnrollmentMessagesMutation();
  const [downloadReport, { isLoading: isDownloading }] = useDownloadBulkEnrollmentReportMutation();
  const { data: jobs } = useGetBulkEnrollmentJobsQuery(courseId, {
    skip: !isAdmin,
    refetchOnMountOrArgChange: true,
  });
  const activeJob = jobs?.results.find((job) => ACTIVE.has(job.status));
  const effectiveJobId = jobId ?? activeJob?.id ?? null;
  const jobQueryArg = effectiveJobId ?? 0;
  const skipJobQuery = !effectiveJobId || !isAdmin;
  const { currentData: liveJob } = coursesApi.endpoints.getBulkEnrollmentJob.useQueryState(
    jobQueryArg,
    { skip: skipJobQuery },
  );
  const selectedPreview = preview?.id === effectiveJobId ? preview : null;
  const selectedStatus = liveJob?.status ?? selectedPreview?.status ?? activeJob?.status;
  coursesApi.endpoints.getBulkEnrollmentJob.useQuerySubscription(jobQueryArg, {
    skip: skipJobQuery,
    pollingInterval: selectedStatus && ACTIVE.has(selectedStatus) ? 10_000 : 0,
    skipPollingIfUnfocused: true,
  });

  const current = liveJob ?? preview;
  useEffect(() => {
    if (current?.status !== "completed" || refreshedJobId.current === current.id) return;
    refreshedJobId.current = current.id;
    onCompleted();
  }, [current?.id, current?.status, onCompleted]);

  if (!isAdmin) return null;
  const latest = jobs?.results[0];

  const chooseFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setPreview(null);
    setOpen(true);
    const form = new FormData();
    form.append("course", String(courseId));
    try {
      const normalizedFile = await normalizeCsvFile(file);
      form.append("file", normalizedFile);
      const result = await uploadCsv(form).unwrap();
      setPreview(result);
      setJobId(result.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const start = async () => {
    if (!current) return;
    setError(null);
    try {
      const result = await startJob(current.id).unwrap();
      setPreview(result);
      setJobId(result.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const cancel = async () => {
    if (!current) return;
    setError(null);
    try {
      setPreview(await cancelJob(current.id).unwrap());
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const retry = async () => {
    if (!current) return;
    setError(null);
    try {
      setPreview(await retryMessages(current.id).unwrap());
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const report = async () => {
    if (!current) return;
    setError(null);
    setIsGeneratingReport(true);
    try {
      const csv = await downloadReport(current.id).unwrap();
      await exportBulkEnrollmentReportPdf(csv, current);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const sample = () => {
    downloadBlob(
      new Blob([String.fromCharCode(0xfeff) + SAMPLE], { type: "text/csv;charset=utf-8" }),
      "course-students-sample.csv"
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          CSV দিয়ে ভর্তি
        </button>
        <button
          type="button"
          onClick={sample}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"
        >
          <FileSpreadsheet size={16} /> নমুনা CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)}
        />
        {latest ? (
          <button
            type="button"
            onClick={() => {
              setJobId(latest.id);
              setPreview(latest);
              setOpen(true);
            }}
            className="rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            সর্বশেষ CSV: {statusText(latest.status)}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h3 className="font-bold text-blue-50">CSV দিয়ে শিক্ষার্থী ভর্তি</h3>
                <p className="mt-0.5 text-xs text-slate-400">কোর্স: {courseTitle}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10">
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {isUploading ? (
                <div className="py-16 text-center text-sm text-slate-300">
                  <Loader2 size={30} className="mx-auto mb-3 animate-spin text-cyan-400" />
                  CSV যাচাই করা হচ্ছে—এখনও কোনো অ্যাকাউন্ট বা ভর্তি তৈরি হচ্ছে না।
                </div>
              ) : current ? (
                <JobDetails job={current} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                  <FileSpreadsheet size={32} className="mx-auto text-slate-500" />
                  <p className="mt-3 text-sm text-slate-300">name, email, phone ও password কলামসহ CSV নির্বাচন করুন।</p>
                </div>
              )}

              {error ? (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
              <button type="button" onClick={sample} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5">
                <Download size={15} /> নমুনা CSV
              </button>
              <div className="flex flex-wrap justify-end gap-2">
                {current?.status === "draft" ? (
                  <>
                    <button type="button" disabled={isCancelling} onClick={() => void cancel()} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 disabled:opacity-50">বাতিল</button>
                    <button type="button" disabled={isStarting || current.summary.processable === 0} onClick={() => void start()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                      {isStarting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      নিশ্চিত করে শুরু করুন
                    </button>
                  </>
                ) : null}
                {current && ACTIVE.has(current.status) ? (
                  <button type="button" disabled={isCancelling} onClick={() => void cancel()} className="rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-bold text-red-300 disabled:opacity-50">কাজ থামান</button>
                ) : null}
                {current?.summary.message_failed ? (
                  <button type="button" disabled={isRetrying} onClick={() => void retry()} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">ব্যর্থ মেসেজ আবার পাঠান</button>
                ) : null}
                {current?.status === "completed" ? (
                  <button type="button" disabled={isDownloading || isGeneratingReport} onClick={() => void report()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                    {isDownloading || isGeneratingReport ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} PDF রিপোর্ট
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function JobDetails({ job }: { job: BulkEnrollmentJob }) {
  const summary = job.summary;
  const done = summary.completed + summary.failed + summary.message_failed;
  const percent = summary.processable ? Math.min(100, Math.round((done / summary.processable) * 100)) : 0;
  const cards = [
    { label: "নতুন অ্যাকাউন্ট", value: summary.new_accounts, icon: UserPlus, color: "text-cyan-300" },
    { label: "আগের অ্যাকাউন্ট", value: summary.existing_accounts, icon: Users, color: "text-blue-300" },
    { label: "আগেই ভর্তি", value: summary.already_enrolled, icon: CheckCircle2, color: "text-emerald-300" },
    { label: "ভুল/কনফ্লিক্ট", value: summary.invalid + summary.conflict, icon: AlertTriangle, color: "text-amber-300" },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-blue-50">{job.original_filename}</p>
          <p className="mt-1 text-xs text-slate-400">মোট {job.total_rows} সারি · {statusText(job.status)}</p>
        </div>
        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">Job #{job.id}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <Icon size={18} className={color} />
            <p className="mt-3 text-2xl font-bold text-blue-50">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {ACTIVE.has(job.status) || job.status === "completed" ? (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>সম্পন্ন {done} / {summary.processable}</span>
            <span>মেসেজ গেছে {summary.messages_sent}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          {summary.message_failed ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-300"><MessageSquareWarning size={14} /> {summary.message_failed}টি মেসেজ ব্যর্থ হয়েছে; ভর্তি সফল আছে।</p>
          ) : null}
        </div>
      ) : null}

      {job.issues.length ? (
        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-slate-200">সমস্যার তালিকা (সর্বোচ্চ ১০০টি)</p>
          <div className="max-h-52 overflow-auto rounded-2xl border border-slate-800">
            {job.issues.map((issue) => (
              <div key={`${issue.row_number}-${issue.email}`} className="border-b border-slate-800 px-4 py-3 text-xs last:border-0">
                <p className="font-semibold text-slate-200">সারি {issue.row_number}: {issue.email || issue.phone || "তথ্য নেই"}</p>
                <p className="mt-1 text-amber-300">{issueText(issue)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
