"use client";

import { useState } from "react";
import { extractErrorMessage } from "@/lib/api-error";

type DeleteTarget = {
  id: number | string;
  name: string;
};

export function useConfirmDelete<T extends DeleteTarget>() {
  const [target, setTarget] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestDelete = (item: T) => {
    setError(null);
    setTarget(item);
  };

  const closeDelete = () => setTarget(null);

  const runDelete = async (action: (item: T) => Promise<unknown>) => {
    if (!target) return;
    setError(null);
    try {
      await action(target);
      setTarget(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return { target, error, setError, requestDelete, closeDelete, runDelete };
}

export function DeleteErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold leading-6 text-red-200">
      {message}
    </div>
  );
}
