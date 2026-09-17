"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, History, Lock, Unlock, X } from "lucide-react";
import {
  useIssueChangeCodeMutation,
  useGetLedgerQuery,
  useRecordLedgerPaymentMutation,
  useReviseLedgerMutation,
  useSetLedgerEnforcementMutation,
  type ChangeCode,
  type Ledger,
  type ScheduleRow,
} from "@/redux/api/ledgersApi";
import { extractErrorMessage } from "@/lib/api-error";
import ScheduleEditor, { bdt, sumRows } from "./schedule-editor";

const originLabel: Record<string, string> = {
  initial: "প্রথম তালিকা",
  import: "ইমপোর্ট",
  admin_code: "ইনস্টলমেন্ট কোড",
  student_request: "শিক্ষার্থীর আবেদন",
  admin_direct: "অ্যাডমিন পরিবর্তন",
};

const rowStatusLabel: Record<string, string> = {
  pending: "বাকি",
  partial: "আংশিক",
  paid: "পরিশোধিত",
  waived: "মওকুফ",
};

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${tone ?? "text-slate-100"}`}>{value}</div>
    </div>
  );
}

export default function LedgerDetailModal({
  ledger,
  onClose,
}: {
  ledger: Ledger;
  onClose: () => void;
}) {
  // Always re-fetch: the list row may be seconds stale, and every action here
  // is validated against the live balance.
  const { data, isLoading } = useGetLedgerQuery(ledger.id);
  const detail = data ?? ledger;

  const [tab, setTab] = useState<"schedule" | "revise" | "code" | "history">("schedule");
  const [codeRows, setCodeRows] = useState<ScheduleRow[]>([{ amount: "", due_date: "" }]);
  const [validHours, setValidHours] = useState("72");
  const [issued, setIssued] = useState<ChangeCode | null>(null);
  const [rows, setRows] = useState<ScheduleRow[]>([{ amount: "", due_date: "" }]);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [revise, { isLoading: revising }] = useReviseLedgerMutation();
  const [recordPayment, { isLoading: paying }] = useRecordLedgerPaymentMutation();
  const [setEnforcement, { isLoading: toggling }] = useSetLedgerEnforcementMutation();
  const [issueCode, { isLoading: issuing }] = useIssueChangeCodeMutation();

  const remaining = Number(detail.remaining_balance);
  const balanced = useMemo(
    () => Number((sumRows(rows) - remaining).toFixed(2)) === 0,
    [rows, remaining],
  );
  const complete = rows.every((row) => row.amount && row.due_date);
  const codeBalanced = useMemo(
    () => Number((sumRows(codeRows) - remaining).toFixed(2)) === 0,
    [codeRows, remaining],
  );
  const codeComplete = codeRows.every((row) => row.amount && row.due_date);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setMessage(null);
    try {
      await fn();
      setMessage(success);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    }
  };

  const live = (detail.installments ?? []).filter((row) => !row.superseded_at);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-900 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{detail.student_name}</h3>
            <p className="text-sm text-slate-400">{detail.course_title}</p>
            <p className="text-xs text-slate-500">
              {detail.student_phone || "—"} · {detail.student_email}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800">
            <X className="size-5" />
          </button>
        </div>

        {detail.is_suspended && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              ওভারডিউ {bdt(detail.overdue_amount)} — এই কোর্সে শিক্ষার্থীর প্রবেশ এখন বন্ধ আছে।
              সম্পূর্ণ বকেয়া পরিশোধ হলে স্বয়ংক্রিয়ভাবে খুলে যাবে।
            </span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="মোট ফি" value={bdt(detail.total_fee)} />
          <Figure label="পরিশোধিত" value={bdt(detail.paid_amount)} tone="text-emerald-400" />
          <Figure label="বকেয়া" value={bdt(detail.remaining_balance)} tone="text-amber-400" />
          <Figure
            label="ওভারডিউ"
            value={bdt(detail.overdue_amount)}
            tone={Number(detail.overdue_amount) > 0 ? "text-rose-400" : "text-slate-500"}
          />
        </div>

        {/* Enforcement is its own switch, separate from the ledger's numbers. */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              {detail.enforcement_enabled ? <Lock className="size-4" /> : <Unlock className="size-4" />}
              কোর্স ব্লকিং নিয়ম
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {detail.enforcement_enabled
                ? `সক্রিয় · ${detail.grace_days} দিন গ্রেস পিরিয়ড`
                : "নিষ্ক্রিয় — হিসাব যাচাই না হওয়া পর্যন্ত কেউ ব্লক হবে না"}
            </p>
          </div>
          <button
            type="button"
            disabled={toggling}
            onClick={() =>
              run(
                () =>
                  setEnforcement({
                    id: detail.id,
                    enabled: !detail.enforcement_enabled,
                    grace_days: detail.grace_days,
                  }).unwrap(),
                detail.enforcement_enabled ? "নিয়ম বন্ধ করা হয়েছে।" : "নিয়ম চালু করা হয়েছে।",
              )
            }
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            {detail.enforcement_enabled ? "বন্ধ করুন" : "চালু করুন"}
          </button>
        </div>

        <div className="mt-5 flex gap-2 border-b border-slate-800">
          {([
            ["schedule", "বর্তমান তালিকা"],
            ["revise", "সরাসরি পরিবর্তন"],
            ["code", "কোড তৈরি"],
            ["history", "ইতিহাস"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-2 text-sm ${
                tab === key
                  ? "border-b-2 border-sky-500 font-medium text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200">
            {message}
          </div>
        )}

        <div className="mt-4">
          {isLoading && <p className="text-sm text-slate-500">লোড হচ্ছে…</p>}

          {tab === "schedule" && (
            <div className="flex flex-col gap-4">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="py-2">#</th>
                    <th className="py-2">পরিমাণ</th>
                    <th className="py-2">শেষ তারিখ</th>
                    <th className="py-2">পরিশোধিত</th>
                    <th className="py-2">অবস্থা</th>
                  </tr>
                </thead>
                <tbody>
                  {live.map((row) => (
                    <tr key={row.id} className="border-t border-slate-800">
                      <td className="py-2 text-slate-500">{row.sequence}</td>
                      <td className="py-2 text-slate-100">{bdt(row.amount)}</td>
                      <td className={`py-2 ${row.is_overdue ? "text-rose-400" : "text-slate-300"}`}>
                        {row.due_date}
                      </td>
                      <td className="py-2 text-emerald-400">{bdt(row.paid_amount)}</td>
                      <td className="py-2 text-slate-400">
                        {rowStatusLabel[row.status]}
                        {row.is_overdue && <span className="ml-1 text-rose-400">· ওভারডিউ</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h4 className="text-sm font-semibold text-slate-200">পেমেন্ট রেকর্ড করুন</h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  গেটওয়ের বাইরে নেওয়া টাকা (বিকাশ, ক্যাশ, ব্যাংক)। পুরোনো কিস্তি আগে পরিশোধ হবে।
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payAmount}
                    onChange={(event) => setPayAmount(event.target.value)}
                    placeholder="পরিমাণ"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
                  />
                  <button
                    type="button"
                    disabled={!payAmount || paying}
                    onClick={() =>
                      run(async () => {
                        await recordPayment({ id: detail.id, amount: payAmount }).unwrap();
                        setPayAmount("");
                      }, "পেমেন্ট যোগ হয়েছে।")
                    }
                    className="shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-40"
                  >
                    যোগ করুন
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "revise" && (
            <div className="flex flex-col gap-4">
              <ScheduleEditor rows={rows} onChange={setRows} remaining={remaining} />
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="পরিবর্তনের কারণ"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="ফোনে আলোচনার নোট"
                rows={2}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
              />
              <button
                type="button"
                disabled={!balanced || !complete || revising}
                onClick={() =>
                  run(async () => {
                    await revise({
                      id: detail.id,
                      reason,
                      discussion_note: note,
                      // Sent so the API refuses the change if the student paid
                      // while this form was open.
                      balance_snapshot: detail.remaining_balance,
                      installments: rows,
                    }).unwrap();
                    setRows([{ amount: "", due_date: "" }]);
                    setReason("");
                    setNote("");
                    setTab("schedule");
                  }, "নতুন তালিকা চালু হয়েছে।")
                }
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                নতুন তালিকা চালু করুন
              </button>
            </div>
          )}

          {tab === "code" && (
            <div className="flex flex-col gap-4">
              {issued ? (
                <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 p-5 text-center">
                  <p className="text-xs text-emerald-400">শিক্ষার্থীকে এই কোডটি দিন</p>
                  <code className="mt-2 block font-mono text-2xl font-bold tracking-widest text-emerald-300">
                    {issued.code}
                  </code>
                  <p className="mt-2 text-xs text-slate-400">
                    মেয়াদ {issued.expires_at.slice(0, 16).replace("T", " ")} পর্যন্ত · একবারই
                    ব্যবহার করা যাবে
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    শিক্ষার্থী কোডটি দিয়ে পুরোনো ও নতুন তালিকা দেখে নিশ্চিত করলে তবেই লেজার
                    বদলাবে। তার আগে এখানকার হিসাব অপরিবর্তিত থাকবে।
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIssued(null);
                      setCodeRows([{ amount: "", due_date: "" }]);
                    }}
                    className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    আরেকটি কোড তৈরি করুন
                  </button>
                </div>
              ) : (
                <>
                  <p className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs leading-relaxed text-slate-400">
                    ফোনে আলোচনার পর নতুন কিস্তির তালিকা এখানে বসান। কোড তৈরি হলেও লেজার
                    বদলাবে না — শিক্ষার্থী কোড দিয়ে নিজে নিশ্চিত করার পরেই পরিবর্তন হবে।
                  </p>
                  <ScheduleEditor rows={codeRows} onChange={setCodeRows} remaining={remaining} />
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="পরিবর্তনের কারণ"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
                  />
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="ফোনে আলোচনার নোট"
                    rows={2}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    মেয়াদ
                    <select
                      value={validHours}
                      onChange={(event) => setValidHours(event.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
                    >
                      <option value="24">২৪ ঘণ্টা</option>
                      <option value="72">৭২ ঘণ্টা</option>
                      <option value="168">৭ দিন</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={!codeBalanced || !codeComplete || issuing}
                    onClick={() =>
                      run(async () => {
                        const created = await issueCode({
                          id: detail.id,
                          reason,
                          discussion_note: note,
                          valid_hours: Number(validHours),
                          installments: codeRows,
                        }).unwrap();
                        setIssued(created);
                        setReason("");
                        setNote("");
                      }, "কোড তৈরি হয়েছে।")
                    }
                    className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-40"
                  >
                    কোড তৈরি করুন
                  </button>
                </>
              )}
            </div>
          )}

          {tab === "history" && (
            <div className="flex flex-col gap-3">
              {(detail.revisions ?? []).length === 0 && (
                <p className="text-sm text-slate-500">কোনো পরিবর্তন হয়নি।</p>
              )}
              {(detail.revisions ?? [])
                .slice()
                .reverse()
                .map((revision) => (
                  <div
                    key={revision.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-slate-200">
                        <History className="size-3.5" />
                        সংস্করণ {revision.number} · {originLabel[revision.origin]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {revision.applied_at?.slice(0, 10) ?? revision.created_at.slice(0, 10)}
                      </span>
                    </div>
                    {revision.created_by_name && (
                      <p className="mt-1 text-xs text-slate-500">{revision.created_by_name}</p>
                    )}
                    {revision.reason && (
                      <p className="mt-1 text-xs text-slate-400">কারণ: {revision.reason}</p>
                    )}
                    {revision.discussion_note && (
                      <p className="text-xs text-slate-400">নোট: {revision.discussion_note}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {revision.installments.map((row) => (
                        <span
                          key={row.id}
                          className={`rounded-lg border border-slate-700 px-2 py-0.5 text-xs ${
                            row.superseded_at ? "text-slate-600 line-through" : "text-slate-300"
                          }`}
                        >
                          {bdt(row.amount)} · {row.due_date}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
