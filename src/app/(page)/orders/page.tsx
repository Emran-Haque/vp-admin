"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar from "./includes/toolbar";
import OrderTable from "./includes/order-table";
import Pagination from "./includes/pagination";
import OrderDetailModal from "./includes/order-detail-modal";
import { useGetOrdersQuery, type Order } from "@/redux/api/ordersApi";

export default function Page() {
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading, isError } = useGetOrdersQuery({
    search: search || undefined,
    payment_status: paymentStatus || undefined,
    order_status: orderStatus || undefined,
    page,
  });

  const orders = data?.results ?? [];

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner />
      <Stats />
      <Toolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={(value) => {
          setPaymentStatus(value);
          setPage(1);
        }}
        orderStatus={orderStatus}
        onOrderStatusChange={(value) => {
          setOrderStatus(value);
          setPage(1);
        }}
      />
      <OrderTable orders={orders} isLoading={isLoading} isError={isError} onView={setSelectedOrder} />
      <Pagination
        count={data?.count ?? 0}
        shown={orders.length}
        page={page}
        hasNext={!!data?.next}
        hasPrev={!!data?.previous}
        onPageChange={setPage}
      />

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
