"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Gift, Plus } from "lucide-react";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { usePermissions } from "@/hooks/use-permissions";
import { useGetAllExamsQuery, useGetExamBatchesQuery, type ExamBatch } from "@/redux/api/examsApi";
import BatchCard from "../exam-batches/includes/batch-card";
import BatchFormModal from "../exam-batches/includes/batch-form-modal";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const STATUS_LABEL: Record<string, string> = {
  published: "প্রকাশিত",
  draft: "ড্রাফট",
  closed: "বন্ধ",
};

/**
 * One place for every free exam the student panel's "ফ্রি পরীক্ষা" page shows:
 * free exam batches (price 0 — students are joined automatically) and MCQs
 * attached to a course as free course material.
 */
export default function FreeExamsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canBatches = hasPermission("can_manage_exam_batches");
  const canExams = hasPermission("can_view_exams");
  const batchesQuery = useGetExamBatchesQuery(undefined, { skip: !canBatches });
  const examsQuery = useGetAllExamsQuery({ free_material: true }, { skip: !canExams });
  const [modal, setModal] = useState<null | "new" | ExamBatch>(null);

  if (batchesQuery.isLoading || examsQuery.isLoading) return <PageLoader label="ফ্রি পরীক্ষা লোড হচ্ছে..." />;
  if (batchesQuery.isError) return <ErrorState message="ফ্রি ব্যাচ আনতে সমস্যা হচ্ছে।" error={batchesQuery.error} />;
  if (examsQuery.isError) return <ErrorState message="ফ্রি MCQ আনতে সমস্যা হচ্ছে।" error={examsQuery.error} />;

  const freeBatches = (batchesQuery.data?.results ?? []).filter((batch) => !(Number(batch.price) > 0));
  const freeExams = examsQuery.data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <Gift size={28} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-blue-50">ফ্রি পরীক্ষা</h1>
              <p className="mt-1 text-sm text-slate-400">
                এখানের সব পরীক্ষা শিক্ষার্থীর প্যানেলে &quot;ফ্রি পরীক্ষা&quot; মেনুতে দেখা যায়। ফ্রি ব্যাচে শিক্ষার্থীরা নিজে থেকেই যুক্ত হয়ে যায়।
              </p>
            </div>
          </div>
          {canBatches ? (
            <button
              type="button"
              onClick={() => setModal("new")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500"
            >
              <Plus size={16} /> নতুন ফ্রি ব্যাচ
            </button>
          ) : null}
        </div>
      </section>

      {canBatches ? (
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="ফ্রি পরীক্ষা ব্যাচ"
            hint="রুটিনসহ অনেকগুলো পরীক্ষা। ব্যাচ খুলে পরীক্ষা যোগ করুন, আর প্রকাশ করলে শিক্ষার্থীরা দেখতে পাবে।"
            count={freeBatches.length}
          />
          {freeBatches.length === 0 ? (
            <Empty>এখনো কোনো ফ্রি ব্যাচ নেই। উপরের &quot;নতুন ফ্রি ব্যাচ&quot; থেকে শুরু করুন।</Empty>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {freeBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onManage={() => router.push(`/exam-batches?batch=${batch.id}`)}
                  onEdit={() => setModal(batch)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {canExams ? (
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="কোর্সের ফ্রি MCQ"
            hint="কোর্স এডিট → কোর্স ম্যাটেরিয়াল → MCQ যোগ করলে সেটি এখানে আসে।"
            count={freeExams.length}
          />
          {freeExams.length === 0 ? (
            <Empty>কোনো কোর্সে এখনো ফ্রি MCQ যোগ করা হয়নি।</Empty>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              {freeExams.map((exam, index) => (
                <Link
                  key={exam.id}
                  href={`/mcq/${exam.id}/edit`}
                  className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-800/60 ${index ? "border-t border-slate-800" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-blue-50">{exam.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {exam.course_title || "কোর্স নেই"} · {bn(exam.total_questions)} প্রশ্ন
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      exam.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {STATUS_LABEL[exam.status] ?? exam.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {modal !== null ? (
        <BatchFormModal
          batch={modal === "new" ? null : modal}
          startFree
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            const isNew = modal === "new";
            setModal(null);
            // A new batch needs its exams next, so go straight to its routine.
            if (isNew) router.push(`/exam-batches?batch=${saved.id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function SectionTitle({ title, hint, count }: { title: string; hint: string; count: number }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-blue-50">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-400">{hint}</p>
      </div>
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">{bn(count)}টি</span>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">{children}</div>
  );
}
