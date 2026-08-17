"use client";

import { useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { usePermissions } from "@/hooks/use-permissions";
import { useGetExamBatchesQuery, type ExamBatch } from "@/redux/api/examsApi";
import BatchCard from "./includes/batch-card";
import BatchFormModal from "./includes/batch-form-modal";
import BatchManageView from "./includes/batch-manage-view";

// `null` = closed; "new" = create; an ExamBatch = edit.
type ModalState = null | "new" | ExamBatch;

export default function Page() {
  const { hasPermission } = usePermissions();
  const { data, isLoading, isError, error } = useGetExamBatchesQuery();
  const [modal, setModal] = useState<ModalState>(null);
  const [manageId, setManageId] = useState<number | null>(null);

  if (isLoading) return <PageLoader label="পরীক্ষা ব্যাচ লোড হচ্ছে..." />;
  if (isError) return <ErrorState message="পরীক্ষা ব্যাচ আনতে সমস্যা হচ্ছে।" error={error} />;

  const batches = data?.results ?? [];
  const canCreate = hasPermission("can_create_exam");

  // Manage view for one batch.
  if (manageId !== null) {
    return (
      <>
        <BatchManageView
          batchId={manageId}
          onBack={() => setManageId(null)}
          onEditBatch={(batch) => setModal(batch)}
        />
        {modal !== null ? (
          <BatchFormModal
            batch={modal === "new" ? null : modal}
            onClose={() => setModal(null)}
            onSaved={() => setModal(null)}
          />
        ) : null}
      </>
    );
  }

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
                সরাসরি ক্রয়যোগ্য পরীক্ষা ব্যাচ তৈরি করুন, রুটিন সাজান এবং প্রতিটি রুটিনের অধীনে MCQ পরীক্ষা যোগ করুন।
              </p>
            </div>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setModal("new")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-500"
            >
              <Plus size={16} /> নতুন ব্যাচ
            </button>
          ) : null}
        </div>
      </section>

      {batches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-400">
          এখনো কোনো পরীক্ষা ব্যাচ তৈরি করা হয়নি। উপরের &quot;নতুন ব্যাচ&quot; থেকে শুরু করুন।
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onManage={() => setManageId(batch.id)}
              onEdit={() => setModal(batch)}
            />
          ))}
        </section>
      )}

      {modal !== null ? (
        <BatchFormModal
          batch={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}
