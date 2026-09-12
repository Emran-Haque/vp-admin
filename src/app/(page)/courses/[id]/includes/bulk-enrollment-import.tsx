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

type EnrollmentMode = "manual" | "csv";

const EMPTY_STUDENT = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
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
  const [mode, setMode] = useState<EnrollmentMode>("manual");
  const [student, setStudent] = useState(EMPTY_STUDENT);
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

  const uploadFile = async (file: File) => {
    setError(null);
    setPreview(null);
    const form = new FormData();
    form.append("course", String(courseId));
    try {
      const normalizedFile = await normalizeCsvFile(file);
      form.append("file", normalizedFile);
      const result = await uploadCsv(form).unwrap();
      setPreview(result);
      setJobId(result.id);
      return true;
    } catch (err) {
      setError(extractErrorMessage(err));
      return false;
    }
  };

  const chooseFile = async (file: File | null) => {
    if (!file) return;
    setOpen(true);
    await uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submitManual = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      fullName: student.fullName.trim(),
      email: student.email.trim(),
      phone: student.phone.trim(),
      password: student.password,
    };
    if (Object.values(values).some((value) => !value)) {
      setError("নাম, ইমেইল, ফোন ও পাসওয়ার্ড সবগুলো পূরণ করুন।");
      return;
    }

    const csv = [
      "full_name,email,phone,password",
      [values.fullName, values.email, values.phone, values.password].map(csvCell).join(","),
    ].join("\n");
    const uploaded = await uploadFile(
      new File([csv], "manual-student.csv", { type: "text/csv" }),
    );
    if (uploaded) setStudent(EMPTY_STUDENT);
  };

  const openAddModal = () => {
    setMode("manual");
    setStudent(EMPTY_STUDENT);
    setJobId(null);
    setPreview(null);
    setError(null);
    setOpen(true);
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
          onClick={openAddModal}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          <UserPlus size={16} /> শিক্ষার্থী যোগ করুন
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
              setError(null);
              setOpen(true);
            }}
            className="rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            সর্বশেষ ভর্তি: {statusText(latest.status)}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h3 className="font-bold text-blue-50">শিক্ষার্থী ভর্তি</h3>
                <p className="mt-0.5 text-xs text-slate-400">কোর্স: {courseTitle}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10">
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {!current && !isUploading ? (
                <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-950/70 p-1" role="tablist" aria-label="শিক্ষার্থী যোগ করার পদ্ধতি">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "manual"}
                    onClick={() => {
                      setMode("manual");
                      setError(null);
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold transition ${mode === "manual" ? "bg-cyan-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <UserPlus size={16} /> ম্যানুয়াল
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "csv"}
                    onClick={() => {
                      setMode("csv");
                      setError(null);
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold transition ${mode === "csv" ? "bg-cyan-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                  >
                    <FileSpreadsheet size={16} /> CSV
                  </button>
                </div>
              ) : null}

              {isUploading ? (
                <div className="py-16 text-center text-sm text-slate-300">
                  <Loader2 size={30} className="mx-auto mb-3 animate-spin text-cyan-400" />
                  তথ্য যাচাই করা হচ্ছে। এখনো কোনো অ্যাকাউন্ট বা ভর্তি তৈরি হচ্ছে না।
                </div>
              ) : current ? (
                <JobDetails job={current} />
              ) : mode === "manual" ? (
                <form onSubmit={(event) => void submitManual(event)} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-300">
                      শিক্ষার্থীর নাম
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={student.fullName}
                        onChange={(event) => setStudent((currentStudent) => ({ ...currentStudent, fullName: event.target.value }))}
                        placeholder="পূর্ণ নাম"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-300">
                      ইমেইল
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={student.email}
                        onChange={(event) => setStudent((currentStudent) => ({ ...currentStudent, email: event.target.value }))}
                        placeholder="student@example.com"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-300">
                      ফোন নম্বর
                      <input
                        type="tel"
                        required
                        autoComplete="tel"
                        value={student.phone}
                        onChange={(event) => setStudent((currentStudent) => ({ ...currentStudent, phone: event.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-300">
                      পাসওয়ার্ড
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={student.password}
                        onChange={(event) => setStudent((currentStudent) => ({ ...currentStudent, password: event.target.value }))}
                        placeholder="নিরাপদ পাসওয়ার্ড"
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isUploading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                      <CheckCircle2 size={16} /> তথ্য যাচাই করুন
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
                  <FileSpreadsheet size={32} className="mx-auto text-slate-500" />
                  <p className="mt-3 text-sm text-slate-300">name, email, phone ও password কলামসহ CSV নির্বাচন করুন।</p>
                  <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500">
                    <Upload size={16} /> CSV নির্বাচন করুন
                  </button>
                </div>
              )}

              {error ? (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
              {!current && mode === "csv" ? (
                <button type="button" onClick={sample} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5">
                  <Download size={15} /> নমুনা CSV
                </button>
              ) : <span />}
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
