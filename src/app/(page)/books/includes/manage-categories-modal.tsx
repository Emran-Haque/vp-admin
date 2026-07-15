"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2, Save, FolderCog } from "lucide-react";
import {
  useGetBookCategoriesQuery,
  useCreateBookCategoryMutation,
  useUpdateBookCategoryMutation,
  useDeleteBookCategoryMutation,
  type BookCategory,
} from "@/redux/api/booksApi";
import { usePermissions } from "@/hooks/use-permissions";

function CategoryRow({ category }: { category: BookCategory }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [order, setOrder] = useState(String(category.order));
  const [isActive, setIsActive] = useState(category.is_active);

  const [updateCategory, { isLoading }] = useUpdateBookCategoryMutation();
  const [deleteCategory] = useDeleteBookCategoryMutation();
  const { hasPermission } = usePermissions();

  const handleSave = async () => {
    try {
      await updateCategory({
        id: category.id,
        data: { name, description, order: Number(order) || 0, is_active: isActive },
      }).unwrap();
      setIsEditing(false);
    } catch {
      // keep editing open on failure
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-blue-500/40 bg-gray-900/30 p-3.5">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="নাম"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:outline-none"
          />
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="ক্রম"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:outline-none"
          />
        </div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="বিবরণ"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 cursor-pointer accent-blue-500"
            />
            সক্রিয়
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-400/20 px-3 py-1.5 text-xs font-bold text-slate-400"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              <Save size={12} />
              সংরক্ষণ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-gray-900/30 p-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-blue-50">{category.name}</p>
        {category.description && (
          <p className="truncate text-xs text-slate-400">{category.description}</p>
        )}
      </div>
      <span
        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
          category.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"
        }`}
      >
        {category.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
      </span>
      {hasPermission("can_edit_book") && (
        <button type="button" onClick={() => setIsEditing(true)} className="text-slate-400">
          <Pencil size={14} />
        </button>
      )}
      {hasPermission("can_delete_book") && (
        <button
          type="button"
          onClick={() => {
            if (confirm(`"${category.name}" ক্যাটাগরি মুছে ফেলতে চান?`)) deleteCategory(category.id);
          }}
          className="text-red-500"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function ManageCategoriesModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");

  const { data, isLoading: isListLoading } = useGetBookCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateBookCategoryMutation();
  const { hasPermission } = usePermissions();

  const categories = [...(data?.results ?? [])].sort((a, b) => a.order - b.order);

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await createCategory({ name: name.trim(), description: "", is_active: true, order: categories.length }).unwrap();
      setName("");
    } catch {
      // keep input as-is on failure
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="flex max-h-[85vh] w-full max-w-[520px] flex-col rounded-[20px] border border-white/5 bg-gray-900/75 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between p-7 pb-0">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-50">
            <FolderCog size={18} className="text-blue-500" />
            বইয়ের ক্যাটাগরি
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-7">
          {hasPermission("can_create_book") && (
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="নতুন ক্যাটাগরির নাম"
                className="flex-1 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={isCreating || !name.trim()}
                className="flex items-center gap-1.5 rounded-[10px] bg-blue-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <Plus size={14} />
                যোগ করুন
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {isListLoading && <p className="text-center text-xs text-slate-400">লোড হচ্ছে…</p>}
            {!isListLoading && categories.length === 0 && (
              <p className="text-center text-xs text-slate-400">কোনো ক্যাটাগরি নেই</p>
            )}
            {categories.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </div>
        </div>

        <div className="flex justify-end p-7 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
