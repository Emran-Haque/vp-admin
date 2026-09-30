import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

/**
 * Guardian SMS: the result / absence messages sent to parents.
 *
 * The flow is deliberately two-step. `buildCampaign` only *prepares* a draft —
 * the recipient list, the exact Bangla each parent would receive and the real
 * credit cost. `sendCampaign` is the only call that spends anything, and the
 * server refuses it without `confirm: true`.
 */

export type SmsCampaignKind = "result" | "absent";

export type SmsCampaignStatus =
  | "draft"
  | "queued"
  | "sending"
  | "completed"
  | "cancelled";

export type SmsCampaign = {
  id: number;
  exam: number;
  exam_title: string;
  kind: SmsCampaignKind;
  kind_display: string;
  status: SmsCampaignStatus;
  status_display: string;
  message_template: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  /** Real SMS credits this run will consume — Bangla costs ~2 per message. */
  estimated_segments: number;
  pending_count: number;
  can_send: boolean;
  created_by: number | null;
  created_by_name: string;
  sent_by: number | null;
  sent_by_name: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SmsCampaignRecipient = {
  id: number;
  student: number;
  student_name: string;
  student_code: string | null;
  student_phone: string;
  phone: string;
  message: string;
  segments: number;
  status: "pending" | "sending" | "sent" | "failed" | "skipped";
  attempts: number;
  detail: string;
  sent_at: string | null;
};

export type SmsTemplate = {
  id: number;
  key: "result_published" | "exam_absent";
  key_display: string;
  body: string;
  is_active: boolean;
  /** Cost of one message rendered with realistic sample values. */
  sample_segments: number;
  sample_message: string;
  updated_at: string;
};

/** Page numbers for DRF's PageNumberPagination; `next` is null on the last page. */
const pageNumberPaging = {
  initialPageParam: 1,
  getNextPageParam: (lastPage: Paginated<unknown>, _all: unknown, lastPageParam: number) =>
    lastPage.next ? lastPageParam + 1 : undefined,
};

export const RECIPIENTS_PAGE_SIZE = 50;

export const guardianSmsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Infinite (scroll-to-load) rather than a single page: the list only ever
    // grows, and a plain query silently cut it off at the server's page size.
    getSmsCampaigns: builder.infiniteQuery<
      Paginated<SmsCampaign>,
      { exam?: number; kind?: SmsCampaignKind; status?: SmsCampaignStatus } | void,
      number
    >({
      infiniteQueryOptions: pageNumberPaging,
      query: ({ queryArg, pageParam }) => ({
        url: "admin/sms-campaigns/",
        params: { ...(queryArg ?? {}), page: pageParam },
      }),
      providesTags: [{ type: "SmsCampaigns", id: "LIST" }],
    }),
    getSmsCampaign: builder.query<SmsCampaign, number>({
      query: (id) => `admin/sms-campaigns/${id}/`,
      providesTags: (_r, _e, id) => [{ type: "SmsCampaigns", id }],
    }),
    getSmsCampaignRecipients: builder.infiniteQuery<
      Paginated<SmsCampaignRecipient>,
      { id: number; status?: string },
      number
    >({
      infiniteQueryOptions: pageNumberPaging,
      query: ({ queryArg: { id, ...params }, pageParam }) => ({
        url: `admin/sms-campaigns/${id}/recipients/`,
        params: { ...params, page: pageParam, page_size: RECIPIENTS_PAGE_SIZE },
      }),
      providesTags: (_r, _e, { id }) => [{ type: "SmsRecipients", id }],
    }),
    /** Prepare or refresh the draft. Never sends anything. */
    buildCampaign: builder.mutation<
      SmsCampaign,
      { exam: number; kind: SmsCampaignKind }
    >({
      query: (body) => ({
        url: "admin/sms-campaigns/build/",
        method: "POST",
        body,
      }),
      // A rebuild reuses the draft's id but rewrites its rows, so any cached
      // recipient pages for it are stale.
      invalidatesTags: (result) => [
        { type: "SmsCampaigns", id: "LIST" },
        ...(result
          ? [
              { type: "SmsCampaigns" as const, id: result.id },
              { type: "SmsRecipients" as const, id: result.id },
            ]
          : []),
      ],
    }),
    /** The only call that spends credits. `confirm` is required server-side. */
    sendCampaign: builder.mutation<SmsCampaign, number>({
      query: (id) => ({
        url: `admin/sms-campaigns/${id}/send/`,
        method: "POST",
        body: { confirm: true },
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "SmsCampaigns", id },
        { type: "SmsCampaigns", id: "LIST" },
        { type: "SmsRecipients", id },
      ],
    }),
    cancelCampaign: builder.mutation<SmsCampaign, number>({
      query: (id) => ({ url: `admin/sms-campaigns/${id}/cancel/`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "SmsCampaigns", id },
        { type: "SmsCampaigns", id: "LIST" },
        { type: "SmsRecipients", id },
      ],
    }),
    retryFailedCampaign: builder.mutation<SmsCampaign, number>({
      query: (id) => ({
        url: `admin/sms-campaigns/${id}/retry-failed/`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "SmsCampaigns", id },
        { type: "SmsCampaigns", id: "LIST" },
        { type: "SmsRecipients", id },
      ],
    }),
    getSmsTemplates: builder.query<Paginated<SmsTemplate> | SmsTemplate[], void>({
      query: () => "admin/sms-templates/",
      providesTags: [{ type: "SmsTemplates", id: "LIST" }],
    }),
    updateSmsTemplate: builder.mutation<
      SmsTemplate,
      { id: number; body: string; is_active?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `admin/sms-templates/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "SmsTemplates", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSmsCampaignsInfiniteQuery,
  useGetSmsCampaignQuery,
  useGetSmsCampaignRecipientsInfiniteQuery,
  useBuildCampaignMutation,
  useSendCampaignMutation,
  useCancelCampaignMutation,
  useRetryFailedCampaignMutation,
  useGetSmsTemplatesQuery,
  useUpdateSmsTemplateMutation,
} = guardianSmsApi;
