"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useAddExamToBatchMutation,
  useCreateExamBatchMutation,
  useGetExamBatchEnrollmentsQuery,
  useGetExamBatchesQuery,
  useGetExamsQuery,
  useRemoveExamFromBatchMutation,
  useUpdateExamBatchMutation,
  type ExamBatch,
} from "@/redux/api/examsApi";

type BatchForm = {
  title: string;
  short_description: string;
  description: string;
  price: string;
  old_price: string;
  discount: string;
  start_date: string;
  end_date: string;
  routine_note: string;
  is_published: boolean;
};

const emptyForm: BatchForm = {
  title: "",
  short_description: "",
  description: "",
  price: "0.00",
  old_price: "",
  discount: "0.00",
  start_date: "",
  end_date: "",
  routine_note: "",
  is_published: false,
};

const fieldClass =
  "w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40";

function formFromBatch(batch: ExamBatch): BatchForm {
  return {
    title: batch.title,
    short_description: batch.short_description || "",
    description: batch.description || "",
    price: batch.price || "0.00",
    old_price: batch.old_price || "",
    discount: batch.discount || "0.00",
    start_date: batch.start_date || "",
    end_date: batch.end_date || "",
    routine_note: batch.routine_note || "",
    is_published: batch.is_published,
  };
}

function cleanPayload(form: BatchForm) {
  return {
    ...form,
    old_price: form.old_price || null,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
  };
}

function formatEnrollmentSource(source: string) {
  if (source === "paid") return "পেমেন্ট";
  if (source === "free") return "ফ্রি";
  if (source === "admin") return "অ্যাডমিন";
  return source;
}

export default function Page() {
  const { hasPermission } = usePermissions();
  const { data, isLoading, isError, error } = useGetExamBatchesQuery();
  const { data: examData } = useGetExamsQuery({ status: "published", page_size: 100 });
  const [createBatch, { isLoading: isCreating }] = useCreateExamBatchMutation();
  const [updateBatch, { isLoading: isUpdating }] = useUpdateExamBatchMutation();
  const [addExam] = useAddExamToBatchMutation();
  const [removeExam] = useRemoveExamFromBatchMutation();
  const [selected, setSelected] = useState<ExamBatch | null>(null);
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [examId, setExamId] = useState("");
  const [openStudentsFor, setOpenStudentsFor] = useState<number | null>(null);

  const batches = data?.results ?? [];
  const exams = examData?.results ?? [];
  const isBusy = isCreating || isUpdating;
  const selectedExamIds = useMemo(
    () => new Set((selected?.exams ?? []).map((item) => item.exam)),
    [selected],
  );

  const set = <K extends keyof BatchForm>(key: K, value: BatchForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setSelected(null);
    setForm(emptyForm);
    setExamId("");
    setOpenStudentsFor(null);
  };

  async function saveBatch() {
    if (!form.title.trim()) return;
    const payload = cleanPayload(form);
    if (selected) {
      const updated = await updateBatch({ id: selected.id, data: payload }).unwrap();
      setSelected(updated);
    } else {
      const created = await createBatch(payload).unwrap();
      setSelected(created);
      setForm(formFromBatch(created));
    }
  }

  async function attachExam() {
    if (!selected || !examId) return;
    const item = await addExam({
      batch: selected.id,
      exam: Number(examId),
      ordering: selected.exams.length + 1,
    }).unwrap();
    setSelected({ ...selected, exams: [...selected.exams, item], exam_count: selected.exam_count + 1 });
    setExamId("");
  }

  if (isLoading) return <PageLoader label="পরীক্ষা ব্যাচ লোড হচ্ছে..." />;
  if (isError) return <ErrorState message="পরীক্ষা ব্যাচ আনতে সমস্যা হচ্ছে।" error={error} />;

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-300">
              <ClipboardCheck size={28} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-blue-50">MCQ পরীক্ষা ব্যাচ</h1>
              <p className="mt-1 text-sm text-slate-400">
                সরাসরি ক্রয়যোগ্য পরীক্ষা ব্যাচ, রুটিন, পরীক্ষা এবং ফলাফল প্রকাশের সময় এখানে পরিচালনা করুন।
              </p>
            </div>
          </div>
          {hasPermission("can_create_exam") ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
            >
              <Plus size={16} /> নতুন ব্যাচ
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_390px] gap-5 max-[1100px]:grid-cols-1">
        <section className="flex flex-col gap-4">
          {batches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
              এখনো কোনো পরীক্ষা ব্যাচ তৈরি করা হয়নি।
            </div>
          ) : (
            batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                isSelected={selected?.id === batch.id}
                onEdit={() => {
                  setSelected(batch);
                  setForm(formFromBatch(batch));
                  setOpenStudentsFor(null);
                }}
                onStudents={() =>
                  setOpenStudentsFor((current) => (current === batch.id ? null : batch.id))
                }
              />
            ))
          )}
        </section>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-blue-50">
                {selected ? "ব্যাচ সম্পাদনা" : "নতুন ব্যাচ"}
              </p>
              <p className="mt-1 text-xs text-slate-400">প্রকাশ করলে শিক্ষার্থীরা তালিকা ও ক্রয় অপশনে দেখতে পাবে।</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
              {form.is_published ? "প্রকাশিত" : "ড্রাফট"}
            </span>
          </div>

          <div className="grid gap-3">
            <input className={fieldClass} placeholder="ব্যাচের নাম" value={form.title} onChange={(e) => set("title", e.target.value)} />
            <input className={fieldClass} placeholder="সংক্ষিপ্ত বিবরণ" value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
            <textarea className={`${fieldClass} min-h-24`} placeholder="বিস্তারিত বিবরণ" value={form.description} onChange={(e) => set("description", e.target.value)} />
            <div className="grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
              <input className={fieldClass} placeholder="মূল্য" value={form.price} onChange={(e) => set("price", e.target.value)} />
              <input className={fieldClass} placeholder="পুরোনো মূল্য" value={form.old_price} onChange={(e) => set("old_price", e.target.value)} />
              <input className={fieldClass} placeholder="ছাড় %" value={form.discount} onChange={(e) => set("discount", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
              <input className={fieldClass} type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              <input className={fieldClass} type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
            <textarea className={`${fieldClass} min-h-20`} placeholder="রুটিন নোট" value={form.routine_note} onChange={(e) => set("routine_note", e.target.value)} />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} />
              শিক্ষার্থীদের জন্য প্রকাশ করুন
            </label>
            <button
              type="button"
              disabled={isBusy || !form.title.trim()}
              onClick={saveBatch}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              <Save size={16} /> ব্যাচ সংরক্ষণ করুন
            </button>
          </div>

          {selected ? (
            <div className="mt-6 border-t border-slate-800 pt-5">
              <p className="mb-3 text-sm font-bold text-blue-50">ব্যাচের পরীক্ষা</p>
              <div className="flex gap-2 max-[520px]:flex-col">
                <select className={`${fieldClass} min-w-0 flex-1`} value={examId} onChange={(e) => setExamId(e.target.value)}>
                  <option value="">প্রকাশিত পরীক্ষা নির্বাচন করুন</option>
                  {exams
                    .filter((exam) => !selectedExamIds.has(exam.id))
                    .map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title}
                      </option>
                    ))}
                </select>
                <button type="button" onClick={attachExam} disabled={!examId} className="rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white disabled:opacity-50">
                  যোগ করুন
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                {selected.exams.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                    এই ব্যাচে এখনো কোনো পরীক্ষা যোগ করা হয়নি।
                  </p>
                ) : (
                  selected.exams.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-100">{item.exam_title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.start_time || item.exam_date || "সময়সূচি নেই"} · ফলাফল {item.result_publish_at || "ম্যানুয়াল"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeExam({ id: item.id, batch: selected.id }).unwrap();
                          setSelected({
                            ...selected,
                            exams: selected.exams.filter((exam) => exam.id !== item.id),
                            exam_count: Math.max(0, selected.exam_count - 1),
                          });
                        }}
                        className="text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {openStudentsFor ? <EnrollmentPanel batchId={openStudentsFor} /> : null}
    </div>
  );
}

function BatchCard({
  batch,
  isSelected,
  onEdit,
  onStudents,
}: {
  batch: ExamBatch;
  isSelected: boolean;
  onEdit: () => void;
  onStudents: () => void;
}) {
  return (
    <article className={`rounded-2xl border p-5 ${isSelected ? "border-cyan-500 bg-cyan-500/10" : "border-slate-800 bg-slate-900"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-blue-50">{batch.title}</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${batch.is_published ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
              {batch.is_published ? "প্রকাশিত" : "ড্রাফট"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{batch.short_description || "সংক্ষিপ্ত বিবরণ নেই"}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-3 py-1">
              <CalendarClock size={13} /> {batch.start_date || "শুরুর তারিখ নেই"} - {batch.end_date || "শেষ তারিখ নেই"}
            </span>
            <span className="rounded-full bg-slate-950/70 px-3 py-1">{batch.exam_count} পরীক্ষা</span>
            <span className="rounded-full bg-slate-950/70 px-3 py-1">{batch.enrolled_count} শিক্ষার্থী</span>
            <span className="rounded-full bg-slate-950/70 px-3 py-1">৳{Number(batch.price).toLocaleString("en-BD")}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="rounded-xl border border-blue-500/30 px-3 py-2 text-sm font-bold text-blue-100">সম্পাদনা</button>
          <button type="button" onClick={onStudents} className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/30 px-3 py-2 text-sm font-bold text-cyan-100"><Users size={15} /> শিক্ষার্থী</button>
        </div>
      </div>
    </article>
  );
}

function EnrollmentPanel({ batchId }: { batchId: number }) {
  const { data, isFetching, isError, error } = useGetExamBatchEnrollmentsQuery(batchId);
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-2 text-blue-50">
        <Users size={18} />
        <h2 className="text-lg font-bold">ক্রয়কৃত / নিবন্ধিত শিক্ষার্থী</h2>
      </div>
      {isFetching ? (
        <p className="text-sm text-slate-400">শিক্ষার্থীর তালিকা লোড হচ্ছে...</p>
      ) : isError ? (
        <ErrorState message="নিবন্ধিত শিক্ষার্থীর তালিকা আনতে সমস্যা হচ্ছে।" error={error} />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-sm text-slate-400">এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি।</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-950/70 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3">শিক্ষার্থী</th>
                <th className="px-4 py-3">ইমেইল</th>
                <th className="px-4 py-3">উৎস</th>
                <th className="px-4 py-3">অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-bold text-slate-100">{item.student_name || item.student}</td>
                  <td className="px-4 py-3 text-slate-400">{item.student_email}</td>
                  <td className="px-4 py-3 text-slate-300">{formatEnrollmentSource(item.source)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 size={13} /> {item.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
