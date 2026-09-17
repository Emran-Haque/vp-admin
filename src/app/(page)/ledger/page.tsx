"use client";

import { useState } from "react";
import { Search, Wallet } from "lucide-react";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import {
  useGetLedgerQuery,
  useGetLedgerRowsQuery,
  type Ledger,
  type LedgerRow,
} from "@/redux/api/ledgersApi";
import LedgerTabs from "./includes/ledger-tabs";
import EnrollmentTable from "./includes/enrollment-table";
import SetupLedgerModal from "./includes/setup-ledger-modal";
import LedgerDetailModal from "./includes/ledger-detail-modal";
import { bdt } from "./includes/schedule-editor";

/** Loads the full ledger for a row, then hands it to the detail drawer. */
function LedgerDrawerLoader({ planId, onClose }: { planId: number; onClose: () => void }) {
  const { data } = useGetLedgerQuery(planId);
  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <span className="text-sm text-slate-300">লোড হচ্ছে…</span>
      </div>
    );
  }
  return <LedgerDetailModal ledger={data as Ledger} onClose={onClose} />;
}

export default function Page() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [course, setCourse] = useState("");
  const [page, setPage] = useState(1);
  const [setupRow, setSetupRow] = useState<LedgerRow | null>(null);
  const [openPlan, setOpenPlan] = useState<number | null>(null);

  const { data: courses } = useGetCoursesQuery({});
  const { data, isLoading, isError, error } = useGetLedgerRowsQuery({
    search: search || undefined,
    state: state || undefined,
    course: course ? Number(course) : undefined,
    page,
  });

  const rows = data?.results ?? [];
  const pending = rows.filter((row) => row.state === "no_ledger").length;
  const blocked = rows.filter((row) => row.state === "suspended").length;
  const outstanding = rows.reduce((sum, row) => sum + Number(row.remaining_balance), 0);

  const reset = () => setPage(1);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-7">
        <div className="flex items-center gap-2 text-slate-100">
          <Wallet className="size-5" />
          <h1 className="text-xl font-semibold">লেজার</h1>
        </div>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-400">
          কোন শিক্ষার্থী কোন কোর্সে ভর্তি এবং তার কত বকেয়া — সব এক জায়গায়। আগে ভর্তি হওয়া
          শিক্ষার্থীরাও এখানে আছেন; যাদের হিসাব এখনো বসানো হয়নি তারা{" "}
          <span className="text-amber-400">সেটআপ বাকি</span> হিসেবে দেখাবে।
        </p>
      </div>

      <LedgerTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="text-xs text-slate-500">মোট ভর্তি</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">{data?.count ?? 0}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="text-xs text-slate-500">এই পাতার বকেয়া</div>
          <div className="mt-1 text-2xl font-semibold text-amber-400">{bdt(outstanding)}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="text-xs text-slate-500">সেটআপ বাকি</div>
          <div className="mt-1 text-2xl font-semibold text-amber-300">{pending}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="text-xs text-slate-500">কোর্স বন্ধ</div>
          <div className="mt-1 text-2xl font-semibold text-rose-400">{blocked}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              reset();
            }}
            placeholder="নাম, আইডি, ফোন, ইমেইল বা কোর্স"
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-slate-600"
          />
        </div>
        <select
          value={course}
          onChange={(event) => {
            setCourse(event.target.value);
            reset();
          }}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-slate-600"
        >
          <option value="">সব কোর্স</option>
          {(courses?.results ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <select
          value={state}
          onChange={(event) => {
            setState(event.target.value);
            reset();
          }}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-slate-600"
        >
          <option value="">সব অবস্থা</option>
          <option value="no_ledger">সেটআপ বাকি</option>
          <option value="suspended">কোর্স বন্ধ</option>
          <option value="overdue">ওভারডিউ</option>
          <option value="active">চলমান</option>
          <option value="completed">পরিশোধিত</option>
        </select>
      </div>

      <EnrollmentTable
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onOpen={(row) => (row.plan ? setOpenPlan(row.plan) : setSetupRow(row))}
      />

      {(data?.next || data?.previous) && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!data?.previous}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-30"
          >
            আগের
          </button>
          <span className="text-sm text-slate-500">পাতা {page}</span>
          <button
            type="button"
            disabled={!data?.next}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-30"
          >
            পরের
          </button>
        </div>
      )}

      {setupRow && <SetupLedgerModal row={setupRow} onClose={() => setSetupRow(null)} />}
      {openPlan && (
        <LedgerDrawerLoader planId={openPlan} onClose={() => setOpenPlan(null)} />
      )}
    </div>
  );
}
