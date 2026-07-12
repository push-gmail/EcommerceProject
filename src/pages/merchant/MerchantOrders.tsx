import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackageCheck,
  PackageX,
  RefreshCcw,
} from "lucide-react";
import backendApi from "../../api/backendApi";

type MerchantOrder = {
  _id: string;
  orderNo: string;
  userId?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items: {
    productId: string;
    productName: string;
    image?: string;
    variant?: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  address: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  grandTotal: number;
  status: string;
  rejectionReason?: string;
  createdAt?: string;
};

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

const toImageSrc = (value?: string) => {
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image")
  ) {
    return value;
  }

  if (value.startsWith("/uploads")) {
    return `${API_ORIGIN}${value}`;
  }

  return `data:image/jpeg;base64,${value}`;
};

const statusClass = (status: string) => {
  if (status === "confirmed") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "rejected") {
    return "border-red-400/20 bg-red-500/10 text-red-300";
  }

  if (status === "out_of_stock") {
    return "border-orange-400/20 bg-orange-500/10 text-orange-300";
  }

  return "border-yellow-400/20 bg-yellow-500/10 text-yellow-200";
};

const normalizeOrders = (payload: any): MerchantOrder[] => {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;

  return [];
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
};

const ImageBox = ({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) => {
  const [failed, setFailed] = useState(false);

  const finalSrc = useMemo(() => toImageSrc(src), [src]);

  return (
    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {finalSrc && !failed ? (
        <img
          src={finalSrc}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <PackageCheck className="text-slate-500" size={24} />
      )}
    </div>
  );
};

export default function MerchantOrders() {
  const mountedRef = useRef(true);

  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrders = useCallback(
    async (showFullLoader = false) => {
      try {
        if (showFullLoader) {
          setInitialLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await backendApi.get("/merchant/orders", {
          withCredentials: true,
        });

        if (!mountedRef.current) return;

        const nextOrders = normalizeOrders(response.data);
        setOrders(nextOrders);
      } catch (err: any) {
        if (!mountedRef.current) return;

        setError(err.response?.data?.message || "Failed to fetch orders");
      } finally {
        if (!mountedRef.current) return;

        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchOrders(true);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchOrders]);

  const approveOrder = async (orderId: string) => {
    try {
      setActionLoadingId(orderId);
      setError("");
      setSuccess("");

      const response = await backendApi.patch(
        `/merchant/orders/${orderId}/approve`,
        {},
        { withCredentials: true }
      );

      if (!mountedRef.current) return;

      setSuccess(response.data?.message || "Order approved successfully");

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: "confirmed",
                merchantDecisionAt: new Date().toISOString(),
              } as MerchantOrder
            : order
        )
      );

      await fetchOrders(false);
    } catch (err: any) {
      if (!mountedRef.current) return;

      setError(err.response?.data?.message || "Failed to approve order");
      await fetchOrders(false);
    } finally {
      if (!mountedRef.current) return;
      setActionLoadingId("");
    }
  };

  const rejectOrder = async (orderId: string) => {
    const reason = window.prompt("Rejection reason?", "Rejected by merchant");

    if (reason === null) return;

    try {
      setActionLoadingId(orderId);
      setError("");
      setSuccess("");

      const response = await backendApi.patch(
        `/merchant/orders/${orderId}/reject`,
        { reason },
        { withCredentials: true }
      );

      if (!mountedRef.current) return;

      setSuccess(response.data?.message || "Order rejected successfully");

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: "rejected",
                rejectionReason: reason,
                merchantDecisionAt: new Date().toISOString(),
              } as MerchantOrder
            : order
        )
      );

      await fetchOrders(false);
    } catch (err: any) {
      if (!mountedRef.current) return;

      setError(err.response?.data?.message || "Failed to reject order");
    } finally {
      if (!mountedRef.current) return;
      setActionLoadingId("");
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-[#020617] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              Merchant Orders
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Order Requests
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Approve or reject user grocery order requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(false)}
            disabled={refreshing || actionLoadingId !== ""}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {initialLoading ? (
          <div className="flex min-h-[360px] items-center justify-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.04] text-slate-200">
            <Loader2 className="animate-spin" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center">
            <PackageCheck className="mx-auto mb-3 text-slate-500" size={40} />
            <p className="text-lg font-bold text-white">No order requests found</p>
            <p className="mt-1 text-sm text-slate-400">
              New user orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const isActionLoading = actionLoadingId === order._id;
              const customerName =
                order.userId?.name || order.address?.fullName || "Customer";
              const customerEmail =
                order.userId?.email || order.address?.email || "-";
              const customerPhone =
                order.userId?.phone || order.address?.phone || "-";

              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20"
                >
                  <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-all text-lg font-black text-white">
                          {order.orderNo}
                        </h2>

                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status.replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-1 text-sm text-slate-400">
                        <p>
                          User:{" "}
                          <span className="font-semibold text-white">
                            {customerName}
                          </span>
                        </p>

                        <p>
                          Email:{" "}
                          <span className="font-semibold text-slate-200">
                            {customerEmail}
                          </span>
                        </p>

                        <p>
                          Phone:{" "}
                          <span className="font-semibold text-slate-200">
                            {customerPhone}
                          </span>
                        </p>

                        <p>
                          Date:{" "}
                          <span className="font-semibold text-slate-200">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Grand Total
                      </p>
                      <p className="mt-1 text-2xl font-black text-emerald-300">
                        ₹{order.grandTotal}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[1fr_360px]">
                    <div className="space-y-3">
                      {(order.items || []).map((item, index) => (
                        <div
                          key={`${order._id}-${item.productId}-${index}`}
                          className="grid grid-cols-[72px_1fr] gap-4 rounded-2xl border border-white/10 bg-black/20 p-3"
                        >
                          <ImageBox src={item.image} alt={item.productName} />

                          <div className="min-w-0">
                            <p className="break-words text-sm font-black text-white sm:text-base">
                              {item.productName}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {item.variant || "-"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm">
                              <span className="rounded-full bg-white/5 px-3 py-1 font-bold text-slate-200">
                                Qty: {item.quantity}
                              </span>

                              <span className="rounded-full bg-white/5 px-3 py-1 font-bold text-slate-200">
                                Price: ₹{item.price}
                              </span>

                              <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-black text-emerald-300">
                                Total: ₹{item.total}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="h-fit rounded-2xl border border-white/10 bg-black/20 p-4">
                      <h3 className="text-base font-black text-white">
                        Delivery Address
                      </h3>

                      <div className="mt-3 space-y-1 text-sm leading-6 text-slate-300">
                        <p className="font-bold text-white">
                          {order.address?.fullName || customerName}
                        </p>

                        <p>{order.address?.addressLine1 || "-"}</p>

                        {order.address?.addressLine2 && (
                          <p>{order.address.addressLine2}</p>
                        )}

                        <p>
                          {order.address?.city || "-"},{" "}
                          {order.address?.state || "-"} -{" "}
                          {order.address?.pincode || "-"}
                        </p>

                        <p>Phone: {order.address?.phone || customerPhone}</p>
                      </div>

                      <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Subtotal</span>
                          <span className="font-bold text-white">
                            ₹{order.subtotal}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Grand Total</span>
                          <span className="text-lg font-black text-emerald-300">
                            ₹{order.grandTotal}
                          </span>
                        </div>
                      </div>

                      {order.status === "pending_merchant_approval" && (
                        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => approveOrder(order._id)}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isActionLoading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <PackageCheck size={16} />
                            )}
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => rejectOrder(order._id)}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isActionLoading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <PackageX size={16} />
                            )}
                            Reject
                          </button>
                        </div>
                      )}

                      {order.rejectionReason && (
                        <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs font-semibold leading-5 text-red-200">
                          {order.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}