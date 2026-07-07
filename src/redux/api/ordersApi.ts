import { baseApi } from "./baseApi";
import type { Paginated } from "./types";

export type OrderItem = {
  id: number;
  item_type: "book" | "course";
  book: number | null;
  course: number | null;
  title_snapshot: string;
  price: string;
  quantity: number;
  line_total: string;
};

export type Order = {
  id: number;
  order_number: string;
  user: number;
  user_email: string;
  items: OrderItem[];
  subtotal: string;
  discount: string;
  total: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  transaction_id: string;
  customer_phone: string;
  shipping_address: string;
  admin_note: string;
  promo_code: string;
  created_at: string;
  updated_at: string;
};

export type OrderListParams = {
  payment_status?: string;
  order_status?: string;
  search?: string;
  page?: number;
};

export type UpdateOrderStatusInput = Partial<{
  payment_status: string;
  order_status: string;
  transaction_id: string;
  admin_note: string;
}>;

export type Payment = {
  id: number;
  order: number;
  method: string;
  transaction_id: string;
  amount: string;
  status: string;
  created_at: string;
};

export type PaymentListParams = { status?: string; order?: number; page?: number };

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Paginated<Order>, OrderListParams | void>({
      query: (params) => ({ url: "admin/orders/", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((o) => ({ type: "Orders" as const, id: o.id })),
              { type: "Orders" as const, id: "LIST" },
            ]
          : [{ type: "Orders" as const, id: "LIST" }],
    }),
    updateOrderStatus: builder.mutation<Order, { id: number; data: UpdateOrderStatusInput }>({
      query: ({ id, data }) => ({
        url: `admin/orders/${id}/update-status/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Orders", id },
        { type: "Orders", id: "LIST" },
      ],
    }),
    getPayments: builder.query<Paginated<Payment>, PaymentListParams | void>({
      query: (params) => ({ url: "admin/payments/", params: params ?? undefined }),
      providesTags: [{ type: "Payments", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetOrdersQuery, useUpdateOrderStatusMutation, useGetPaymentsQuery } = ordersApi;
