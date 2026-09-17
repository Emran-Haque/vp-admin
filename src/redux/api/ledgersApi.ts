import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type LedgerInstallment = {
  id: number;
  sequence: number;
  amount: string;
  due_date: string;
  paid_amount: string;
  outstanding: string;
  status: "pending" | "partial" | "paid" | "waived";
  paid_at: string | null;
  superseded_at: string | null;
  revision: number | null;
  is_overdue: boolean;
};

export type LedgerRevision = {
  id: number;
  number: number;
  origin: "initial" | "import" | "admin_code" | "student_request" | "admin_direct";
  reason: string;
  discussion_note: string;
  balance_snapshot: string;
  created_by: number | null;
  created_by_name: string | null;
  applied_at: string | null;
  created_at: string;
  installments: LedgerInstallment[];
};

export type Ledger = {
  id: number;
  student: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  course: number;
  course_title: string;
  order: number | null;
  total_fee: string;
  opening_paid: string;
  paid_amount: string;
  remaining_balance: string;
  status: "active" | "completed" | "cancelled";
  source: "checkout" | "imported" | "admin";
  enforcement_enabled: boolean;
  grace_days: number;
  next_due: { amount: string; due_date: string } | null;
  overdue_amount: string;
  /** Derived server-side: an overdue installment is currently blocking the course. */
  is_suspended: boolean;
  created_at: string;
  installments?: LedgerInstallment[];
  revisions?: LedgerRevision[];
};

export type LedgerListParams = {
  search?: string;
  status?: string;
  course?: number;
  page?: number;
};

/** One hand-typed schedule line. The system never generates these. */
export type ScheduleRow = { amount: string; due_date: string };

export type OpenLedgerInput = {
  student: number;
  course: number;
  total_fee: string;
  opening_paid?: string;
  grace_days?: number;
  enforcement_enabled?: boolean;
  reason?: string;
  installments: ScheduleRow[];
};

export type ReviseInput = {
  id: number;
  reason?: string;
  discussion_note?: string;
  /** Echoed back so a payment landing mid-edit is caught, not overwritten. */
  balance_snapshot?: string;
  installments: ScheduleRow[];
};

export const ledgersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLedgers: builder.query<Paginated<Ledger>, LedgerListParams>({
      query: (params) => ({ url: "admin/ledgers/", params }),
      providesTags: ["Ledger"],
    }),
    getLedger: builder.query<Ledger, number>({
      query: (id) => `admin/ledgers/${id}/`,
      providesTags: ["Ledger"],
    }),
    openLedger: builder.mutation<Ledger, OpenLedgerInput>({
      query: (body) => ({ url: "admin/ledgers/", method: "POST", body }),
      invalidatesTags: ["Ledger"],
    }),
    reviseLedger: builder.mutation<Ledger, ReviseInput>({
      query: ({ id, ...body }) => ({
        url: `admin/ledgers/${id}/revise/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ledger"],
    }),
    recordLedgerPayment: builder.mutation<Ledger, { id: number; amount: string; note?: string }>({
      query: ({ id, ...body }) => ({
        url: `admin/ledgers/${id}/record-payment/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ledger"],
    }),
    setLedgerEnforcement: builder.mutation<
      Ledger,
      { id: number; enabled: boolean; grace_days?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `admin/ledgers/${id}/set-enforcement/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ledger"],
    }),
  }),
});

export const {
  useGetLedgersQuery,
  useGetLedgerQuery,
  useOpenLedgerMutation,
  useReviseLedgerMutation,
  useRecordLedgerPaymentMutation,
  useSetLedgerEnforcementMutation,
} = ledgersApi;

/** One (student, course) enrollment row — exists whether or not a ledger does. */
export type LedgerRow = {
  enrollment: number;
  student: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  course: number;
  course_title: string;
  course_price: string;
  enrolled_on: string;
  source: string;
  plan: number | null;
  state: "no_ledger" | "suspended" | "overdue" | "active" | "completed";
  total_fee: string;
  opening_paid: string;
  opening_method: string;
  opening_note: string;
  paid_amount: string;
  remaining_balance: string;
  overdue_amount: string;
  installment_count: number;
  next_due: { amount: string; due_date: string } | null;
  has_schedule: boolean;
  enforcement_enabled: boolean;
  is_suspended: boolean;
};

export type CourseGrid = {
  course: { id: number; title: string; price: string };
  total: number;
  pending_setup: number;
  rows: LedgerRow[];
};

export type GridSaveRow = {
  student: number;
  total_fee: string;
  opening_paid: string;
  opening_method?: string;
  opening_note?: string;
};

export type OverdueRow = {
  plan: number;
  student: number;
  student_name: string;
  student_phone: string;
  student_email: string;
  course: number;
  course_title: string;
  total_fee: string;
  paid_amount: string;
  remaining_balance: string;
  overdue_amount: string;
  oldest_due_date: string;
  days_overdue: number;
  installments_overdue: number;
  is_suspended: boolean;
  enforcement_enabled: boolean;
  grace_days: number;
};

export type ChangeCode = {
  id: number;
  code: string;
  plan: number;
  student: number;
  student_name: string;
  student_phone: string;
  course_title: string;
  proposed_rows: { amount: string; due_date: string }[];
  proposed_total: string;
  balance_snapshot: string;
  current_balance: string;
  reason: string;
  discussion_note: string;
  status: string;
  /** Stored status plus expiry and balance drift worked out at read time. */
  effective_status: "issued" | "applied" | "expired" | "cancelled" | "outdated";
  expires_at: string;
  created_by: number | null;
  created_by_name: string | null;
  applied_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export const ledgerExtrasApi = ledgersApi.injectEndpoints({
  endpoints: (builder) => ({
    getLedgerRows: builder.query<
      Paginated<LedgerRow>,
      { search?: string; course?: number; state?: string; ordering?: string; page?: number }
    >({
      query: (params) => ({ url: "admin/ledger-rows/", params }),
      providesTags: ["Ledger"],
    }),
    getCourseGrid: builder.query<CourseGrid, number>({
      query: (courseId) => `admin/ledger-grid/${courseId}/`,
      providesTags: ["Ledger"],
    }),
    saveCourseGrid: builder.mutation<
      { saved: LedgerRow[]; errors: { student: number; detail: string }[] },
      { courseId: number; rows: GridSaveRow[] }
    >({
      query: ({ courseId, rows }) => ({
        url: `admin/ledger-grid/${courseId}/`,
        method: "POST",
        body: { rows },
      }),
      invalidatesTags: ["Ledger"],
    }),
    getOverdue: builder.query<Paginated<OverdueRow>, { page?: number }>({
      query: (params) => ({ url: "admin/ledger-overdue/", params }),
      providesTags: ["Ledger"],
    }),
    getChangeCodes: builder.query<
      Paginated<ChangeCode>,
      { search?: string; status?: string; plan?: number; page?: number }
    >({
      query: (params) => ({ url: "admin/installment-codes/", params }),
      providesTags: ["Ledger"],
    }),
    issueChangeCode: builder.mutation<
      ChangeCode,
      {
        id: number;
        reason?: string;
        discussion_note?: string;
        valid_hours?: number;
        installments: ScheduleRow[];
      }
    >({
      query: ({ id, ...body }) => ({
        url: `admin/ledgers/${id}/issue-code/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ledger"],
    }),
    cancelChangeCode: builder.mutation<ChangeCode, number>({
      query: (id) => ({ url: `admin/installment-codes/${id}/cancel/`, method: "POST" }),
      invalidatesTags: ["Ledger"],
    }),
  }),
});

export const {
  useGetLedgerRowsQuery,
  useGetCourseGridQuery,
  useSaveCourseGridMutation,
  useGetOverdueQuery,
  useGetChangeCodesQuery,
  useIssueChangeCodeMutation,
  useCancelChangeCodeMutation,
} = ledgerExtrasApi;
