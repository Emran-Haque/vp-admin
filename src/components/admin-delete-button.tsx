"use client";

import { type ReactNode, useState } from "react";
import { extractErrorMessage } from "@/lib/api-error";
import ConfirmDeleteDialog from "./confirm-delete-dialog";

type AdminDeleteButtonProps = {
  itemName: string;
  itemType: string;
  impact?: string;
  className: string;
  title?: string;
  children: ReactNode;
  onDelete: () => Promise<unknown>;
};

export default function AdminDeleteButton({
  itemName,
  itemType,
  impact,
  className,
  title,
  children,
  onDelete,
}: AdminDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (isDeleting) return;
    setOpen(false);
  };

  const confirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
      setOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        title={title}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      <ConfirmDeleteDialog
        open={open}
        itemName={itemName}
        itemType={itemType}
        impact={impact}
        error={error}
        isLoading={isDeleting}
        onClose={close}
        onConfirm={confirm}
      />
    </>
  );
}
