"use client";

import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Star, Trash2, Trophy } from "lucide-react";
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog";
import { extractErrorMessage } from "@/lib/api-error";
import {
  type SuccessStory,
  useCreateSuccessStoryMutation,
  useDeleteSuccessStoryMutation,
  useGetSuccessStoriesQuery,
  useUpdateSuccessStoryMutation,
} from "@/redux/api/contentApi";
import ModalShell, { Field, areaClass, fieldClass } from "./modal-shell";

const EMPTY = {
  student_name: "",
  university: "",
  unit: "",
  merit_position: "",
  comment: "",
  video_url: "",
  year: "",
  is_featured: true,
  image: null,
};

/**
 * Success stories: a list, and a form for one story.
 *
 * Both live in the same modal rather than stacking a second dialog on top —
 * the list swaps to the form and back, so there is only ever one layer to
 * close.
 */
export default function SuccessStoriesModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useGetSuccessStoriesQuery();
  const [createStory, { isLoading: isCreating }] = useCreateSuccessStoryMutation();
  const [updateStory, { isLoading: isUpdating }] = useUpdateSuccessStoryMutation();
  const [deleteStory, { isLoading: isDeleting }] = useDeleteSuccessStoryMutation();

  const stories = data?.results ?? [];
  const [editing, setEditing] = useState<SuccessStory | "new" | null>(null);
  const [toDelete, setToDelete] = useState<SuccessStory | null>(null);
  const [draft, setDraft] = useState<Omit<SuccessStory, "id">>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openForm = (story: SuccessStory | "new") => {
    setEditing(story);
    setDraft(story === "new" ? EMPTY : { ...story });
    setError(null);
    setSuccess(null);
  };

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setError(null);
    if (!draft.student_name.trim()) {
      setError("শিক্ষার্থীর নাম দিতে হবে।");
      return;
    }
    try {
      if (editing === "new") {
        await createStory(draft).unwrap();
      } else if (editing) {
        await updateStory({ id: editing.id, data: draft }).unwrap();
      }
      setEditing(null);
      setSuccess("সাফল্যের গল্প সেভ হয়ে গেছে।");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const isForm = editing !== null;

  return (
    <>
      <ModalShell
        error={error}
        footerNote="হোমপেজ ও /success পেজে দেখা যাবে"
        icon={isForm ? <Star size={17} /> : <Trophy size={17} />}
        isSaving={isCreating || isUpdating}
        onClose={onClose}
        onSave={isForm ? save : undefined}
        size="lg"
        subtitle={isForm ? "একটি গল্পের তথ্য" : "শিক্ষার্থীদের সাফল্যের গল্প"}
        success={success}
        title="সাফল্যের গল্প"
      >
        {isForm ? (
          <div className="space-y-4">
            <button
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200"
              onClick={() => setEditing(null)}
              type="button"
            >
              <ArrowLeft size={13} />
              তালিকায় ফিরে যান
            </button>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="শিক্ষার্থীর নাম">
                <input
                  className={fieldClass}
                  onChange={(e) => set("student_name", e.target.value)}
                  value={draft.student_name}
                />
              </Field>
              <Field label="বিশ্ববিদ্যালয়">
                <input
                  className={fieldClass}
                  onChange={(e) => set("university", e.target.value)}
                  placeholder="চট্টগ্রাম বিশ্ববিদ্যালয়"
                  value={draft.university}
                />
              </Field>
              <Field label="ইউনিট">
                <input
                  className={fieldClass}
                  onChange={(e) => set("unit", e.target.value)}
                  placeholder="A Unit"
                  value={draft.unit}
                />
              </Field>
              <Field label="মেধাক্রম">
                <input
                  className={fieldClass}
                  onChange={(e) => set("merit_position", e.target.value)}
                  placeholder="১৪"
                  value={draft.merit_position}
                />
              </Field>
              <Field label="বছর">
                <input
                  className={fieldClass}
                  onChange={(e) => set("year", e.target.value)}
                  placeholder="২০২৬"
                  value={draft.year}
                />
              </Field>
              <Field label="ভিডিও লিংক" hint="ঐচ্ছিক — ভিডিও টেস্টিমোনিয়াল থাকলে">
                <input
                  className={fieldClass}
                  onChange={(e) => set("video_url", e.target.value)}
                  placeholder="https://youtube.com/..."
                  value={draft.video_url}
                />
              </Field>
            </div>

            <Field label="মন্তব্য">
              <textarea
                className={areaClass}
                onChange={(e) => set("comment", e.target.value)}
                placeholder="শিক্ষার্থীর কথা"
                rows={4}
                value={draft.comment}
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-3">
              <input
                checked={draft.is_featured}
                className="size-4 accent-sky-500"
                onChange={(e) => set("is_featured", e.target.checked)}
                type="checkbox"
              />
              <span className="text-xs font-bold text-slate-300">
                হোমপেজে দেখান
                <span className="ml-1.5 font-normal text-slate-500">
                  (ফিচার্ড গল্পগুলোই হোমপেজে যায়)
                </span>
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-sky-400/40 bg-sky-400/5 py-3 text-xs font-bold text-sky-200 hover:bg-sky-400/10"
              onClick={() => openForm("new")}
              type="button"
            >
              <Plus size={14} />
              নতুন গল্প যোগ করুন
            </button>

            {isLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
            ) : stories.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-xs text-slate-500">
                এখনো কোনো সাফল্যের গল্প যোগ করা হয়নি।
              </p>
            ) : (
              stories.map((story) => (
                <div
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-3"
                  key={story.id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-100">
                      {story.student_name}
                      {story.is_featured ? (
                        <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                          ফিচার্ড
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {[story.university, story.unit, story.merit_position && `মেধাক্রম ${story.merit_position}`]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <button
                    aria-label="এডিট"
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5"
                    onClick={() => openForm(story)}
                    type="button"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    aria-label="মুছুন"
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-red-600/40 bg-red-600/10 text-red-400 hover:bg-red-600/20"
                    onClick={() => setToDelete(story)}
                    type="button"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </ModalShell>

      <ConfirmDeleteDialog
        impact="গল্পটি হোমপেজ ও সাফল্য পেজ থেকে সরে যাবে।"
        isLoading={isDeleting}
        itemName={toDelete?.student_name ?? ""}
        itemType="সাফল্যের গল্প"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteStory(toDelete.id).unwrap();
            setToDelete(null);
          } catch (err) {
            setError(extractErrorMessage(err));
            setToDelete(null);
          }
        }}
        open={Boolean(toDelete)}
      />
    </>
  );
}
