"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useAppSelector } from "@/redux/hooks";

const ALLOWED_ROLES = ["admin", "super_admin", "moderator"];

export default function PageLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.user?.role);
  const isAuthorized = Boolean(token) && Boolean(role) && ALLOWED_ROLES.includes(role as string);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthorized) router.replace("/login");
  }, [mounted, isAuthorized, router]);

  if (!mounted || !isAuthorized) return null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <Sidebar />
      <div className="flex flex-col md:pl-64">
        <Header />
        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  );
}
