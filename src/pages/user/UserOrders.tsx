import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  PackageCheck,
  PackageX,
  RefreshCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import backendApi from "../../api/backendApi";
import {  useNavigate } from "react-router-dom";

type OrderStatus =
  | "pending_merchant_approval"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "out_of_stock";

type UserOrderItem = {
  productId: string;
  merchantId?: string;
  productName: string;
  image?: string;
  variant?: string;
  quantity: number;
  price: number;
  mrp?: number;
  total: number;
};

type UserOrder = {
  _id: string;
  orderNo: string;
  items: UserOrderItem[];
  subtotal: number;
  deliveryCharge?: number;
  grandTotal: number;
  status: OrderStatus;
  rejectionReason?: string;
  merchantDecisionAt?: string;
  createdAt?: string;
  updatedAt?: string;
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

  if (value.startsWith("uploads")) {
    return `${API_ORIGIN}/${value}`;
  }

  return `data:image/jpeg;base64,${value}`;
};

const formatDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const money = (value?: number) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const getOrderTitle = (order: UserOrder) => {
  const firstItem = order.items?.[0];

  if (!firstItem) return "Grocery Order";

  if (order.items.length === 1) return firstItem.productName;

  return `${firstItem.productName} + ${order.items.length - 1} more item${
    order.items.length - 1 === 1 ? "" : "s"
  }`;
};

const getTotalQuantity = (order: UserOrder) => {
  return order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
};

const getStatusMeta = (status: OrderStatus) => {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      title: "Order confirmed",
      description: "Your order has been approved.",
      badgeClass: "bg-[#e7f8ec] text-[#168533]",
      softClass: "bg-[#f1fff4] text-[#168533] border-[#c8efd2]",
      iconClass: "bg-[#168533] text-white",
      dotClass: "bg-[#26a541]",
      Icon: CheckCircle2,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      title: "Order rejected",
      description: "Your order request was rejected.",
      badgeClass: "bg-[#fff1f1] text-[#ff6161]",
      softClass: "bg-[#fff7f7] text-[#ff6161] border-[#ffd4d4]",
      iconClass: "bg-[#ff6161] text-white",
      dotClass: "bg-[#ff6161]",
      Icon: PackageX,
    };
  }

  if (status === "out_of_stock") {
    return {
      label: "Out of stock",
      title: "Out of stock",
      description: "Stock was not available during approval.",
      badgeClass: "bg-[#fff4e5] text-[#c77700]",
      softClass: "bg-[#fff9ed] text-[#c77700] border-[#ffe1aa]",
      iconClass: "bg-[#f59e0b] text-white",
      dotClass: "bg-[#f59e0b]",
      Icon: AlertCircle,
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      title: "Order cancelled",
      description: "This order has been cancelled.",
      badgeClass: "bg-[#f1f3f6] text-[#616161]",
      softClass: "bg-[#f7f7f7] text-[#616161] border-[#e0e0e0]",
      iconClass: "bg-[#878787] text-white",
      dotClass: "bg-[#878787]",
      Icon: PackageX,
    };
  }

  return {
    label: "Pending",
    title: "Waiting for approval",
    description: "Order sent to merchant for approval.",
    badgeClass: "bg-[#fff7df] text-[#c77700]",
    softClass: "bg-[#fffaf0] text-[#c77700] border-[#ffe6a5]",
    iconClass: "bg-[#f5a623] text-white",
    dotClass: "bg-[#f5a623]",
    Icon: Clock,
  };
};

export default function UserOrders() {
  const navigate=useNavigate();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(
        (order) => order.status === "pending_merchant_approval"
      ).length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      issue: orders.filter(
        (order) =>
          order.status === "rejected" || order.status === "out_of_stock"
      ).length,
    };
  }, [orders]);

  const fetchOrders = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await backendApi.get("/user/orders/my-orders", {
        withCredentials: true,
      });

      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setOrders(data);

      if (data.length > 0) {
        setExpandedOrderId((prev) => {
          const exists = data.some((order: UserOrder) => order._id === prev);
          return exists ? prev : data[0]._id;
        });
      } else {
        setExpandedOrderId("");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      setOrders([]);
      setExpandedOrderId("");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const interval = window.setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[calc(100vh-112px)] bg-[#f1f3f6]">
      <div className="bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#f0f0f0] px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-[#212121]">
              My Orders
            </h1>

            <p className="mt-1 text-[13px] leading-5 text-[#878787]">
              Track product image, packets, quantity, price and order status.
            </p>
          </div>

         <button
  type="button"
  onClick={() => navigate("/grocery/myprofile/orders")}
  disabled={refreshing || loading}
  className="flex h-10 w-fit items-center gap-2 rounded bg-[#2874f0] px-5 text-[13px] font-semibold text-white shadow-sm disabled:opacity-60"
>
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-0 border-b border-[#f0f0f0] md:grid-cols-4">
          <StatBox label="Total Orders" value={stats.total} />
          <StatBox label="Pending" value={stats.pending} />
          <StatBox label="Confirmed" value={stats.confirmed} />
          <StatBox label="Issues" value={stats.issue} />
        </div>
      </div>

      {error && (
        <div className="m-5 flex items-center gap-2 rounded bg-red-50 p-4 text-sm font-semibold text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="m-5 flex min-h-[420px] items-center justify-center gap-2 rounded bg-white text-sm font-semibold text-[#424242] shadow-sm">
          <Loader2 className="animate-spin" size={20} />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="m-5 flex min-h-[420px] flex-col items-center justify-center rounded bg-white px-4 text-center shadow-sm">
          <ShoppingBag size={54} className="text-[#c2c2c2]" />

          <h2 className="mt-4 text-[20px] font-semibold text-[#212121]">
            No orders yet
          </h2>

          <p className="mt-2 max-w-[420px] text-[14px] leading-6 text-[#878787]">
            Jab aap grocery products order karenge, unka image, packet,
            quantity, price aur status yahan show hoga.
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          {orders.map((order) => {
            const expanded = expandedOrderId === order._id;

            return (
              <OrderCard
                key={order._id}
                order={order}
                expanded={expanded}
                onToggle={() =>
                  setExpandedOrderId((prev) =>
                    prev === order._id ? "" : order._id
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-[#f0f0f0] px-5 py-4 last:border-r-0">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#878787]">
        {label}
      </p>

      <p className="mt-1 text-[20px] font-bold text-[#212121]">{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
}: {
  order: UserOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = getStatusMeta(order.status);
  const StatusIcon = meta.Icon;
  const firstItem = order.items?.[0];
  const totalQuantity = getTotalQuantity(order);

  return (
    <div className="overflow-hidden rounded bg-white shadow-sm ring-1 ring-[#e5e7eb]">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[96px_1fr_170px_150px] md:items-center">
        <div className="flex h-[96px] w-[96px] items-center justify-center rounded bg-[#f5f5f5]">
          {firstItem?.image ? (
            <img
              src={toImageSrc(firstItem.image)}
              alt={firstItem.productName}
              className="max-h-[86px] max-w-[86px] object-contain"
            />
          ) : (
            <PackageCheck className="text-[#bdbdbd]" size={36} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="line-clamp-2 text-[16px] font-semibold text-[#212121]">
              {getOrderTitle(order)}
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold ${meta.badgeClass}`}
            >
              {meta.label}
            </span>
          </div>

          <p className="mt-1 text-[12px] text-[#878787]">
            Order ID:{" "}
            <span className="font-semibold text-[#616161]">
              {order.orderNo}
            </span>
          </p>

          {formatDateTime(order.createdAt) && (
            <p className="mt-1 text-[12px] text-[#878787]">
              Ordered on {formatDateTime(order.createdAt)}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <SmallPill label={`${order.items.length} item`} />
            <SmallPill label={`Qty ${totalQuantity}`} />
            {firstItem?.variant && <SmallPill label={firstItem.variant} />}
          </div>

          {order.rejectionReason && (
            <p className="mt-3 rounded bg-red-50 p-2 text-[12px] font-semibold text-red-600">
              {order.rejectionReason}
            </p>
          )}
        </div>

        <div className="rounded border border-[#f0f0f0] bg-[#fafafa] p-3">
          <p className="text-[12px] text-[#878787]">Total Amount</p>
          <p className="mt-1 text-[20px] font-bold text-[#212121]">
            {money(order.grandTotal)}
          </p>

          <p className="mt-1 text-[12px] text-[#26a541]">
            Delivery{" "}
            {Number(order.deliveryCharge || 0) > 0
              ? money(order.deliveryCharge)
              : "Free"}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className={`flex items-start gap-2 rounded border px-3 py-3 ${meta.softClass}`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${meta.iconClass}`}
            >
              <StatusIcon size={16} />
            </span>

            <div>
              <p className="text-[13px] font-bold">{meta.title}</p>
              <p className="mt-1 text-[12px] leading-5 opacity-80">
                {meta.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 items-center justify-center gap-2 rounded border border-[#2874f0] bg-white text-[13px] font-bold text-[#2874f0] hover:bg-[#f5faff]"
          >
            {expanded ? "Hide Details" : "View Details"}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && <OrderExpandedDetails order={order} />}
    </div>
  );
}

function OrderExpandedDetails({ order }: { order: UserOrder }) {
  const meta = getStatusMeta(order.status);

  const mrpTotal = order.items.reduce((sum, item) => {
    return sum + Number(item.mrp || item.price || 0) * Number(item.quantity || 0);
  }, 0);

  const saving = Math.max(mrpTotal - Number(order.subtotal || 0), 0);

  return (
    <div className="border-t border-[#eeeeee] bg-[#fbfbfb]">
      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[1fr_320px]">
        <section className="rounded bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Truck size={18} className="text-[#2874f0]" />
            <h3 className="text-[16px] font-semibold text-[#212121]">
              Order Items
            </h3>
          </div>

          <div className="space-y-3">
            {order.items.map((item, index) => (
              <OrderItemCard
                key={`${order._id}-${item.productId}-${index}`}
                item={item}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded bg-white p-4 shadow-sm">
            <h3 className="text-[16px] font-semibold text-[#212121]">
              Price Details
            </h3>

            <div className="mt-4 space-y-3 text-[14px] text-[#424242]">
              <div className="flex justify-between">
                <span>Price ({order.items.length} item)</span>
                <span>{money(order.subtotal)}</span>
              </div>

              {saving > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-[#26a541]">- {money(saving)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-[#26a541]">
                  {Number(order.deliveryCharge || 0) > 0
                    ? money(order.deliveryCharge)
                    : "Free"}
                </span>
              </div>

              <div className="border-t border-dashed border-[#d7d7d7] pt-3">
                <div className="flex justify-between text-[17px] font-bold text-[#212121]">
                  <span>Total Amount</span>
                  <span>{money(order.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded bg-white p-4 shadow-sm">
            <h4 className="text-[16px] font-semibold text-[#212121]">
              Status Timeline
            </h4>

            <div className="mt-4 space-y-4">
              <TimelineRow
                active
                title="Order placed"
                description={
                  formatDate(order.createdAt)
                    ? `Placed on ${formatDate(order.createdAt)}`
                    : "Order request created"
                }
              />

              <TimelineRow
                active={order.status !== "pending_merchant_approval"}
                title={
                  order.status === "confirmed"
                    ? "Approved"
                    : order.status === "rejected"
                    ? "Rejected"
                    : order.status === "out_of_stock"
                    ? "Out of stock"
                    : "Merchant approval"
                }
                description={
                  order.status === "pending_merchant_approval"
                    ? "Waiting for merchant approval"
                    : meta.description
                }
                danger={
                  order.status === "rejected" || order.status === "out_of_stock"
                }
              />

              {order.merchantDecisionAt && (
                <p className="rounded bg-[#f7f7f7] p-2 text-[12px] text-[#878787]">
                  Last updated on {formatDateTime(order.merchantDecisionAt)}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OrderItemCard({ item }: { item: UserOrderItem }) {
  return (
    <div className="rounded border border-[#eeeeee] bg-white p-3">
      <div className="grid grid-cols-[84px_1fr] gap-4">
        <div className="flex h-[84px] w-[84px] items-center justify-center rounded bg-[#f5f5f5]">
          {item.image ? (
            <img
              src={toImageSrc(item.image)}
              alt={item.productName}
              className="max-h-[74px] max-w-[74px] object-contain"
            />
          ) : (
            <PackageCheck className="text-[#bdbdbd]" size={32} />
          )}
        </div>

        <div className="min-w-0">
          <h4 className="line-clamp-2 text-[15px] font-semibold text-[#212121]">
            {item.productName}
          </h4>

          <p className="mt-1 text-[13px] text-[#878787]">
            Packet:{" "}
            <span className="font-semibold text-[#424242]">
              {item.variant || "Packet"}
            </span>
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] md:grid-cols-4">
            <InfoBox label="Qty" value={String(item.quantity)} />
            <InfoBox label="Price" value={money(item.price)} />
            <InfoBox label="MRP" value={money(item.mrp || item.price)} />
            <InfoBox label="Total" value={money(item.total)} strong />
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#f1f3f6] px-3 py-1 text-[12px] font-semibold text-[#424242]">
      {label}
    </span>
  );
}

function InfoBox({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded bg-[#f7f7f7] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[#878787]">
        {label}
      </p>

      <p
        className={`mt-1 text-[13px] ${
          strong ? "font-bold text-[#212121]" : "font-semibold text-[#424242]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TimelineRow({
  active,
  title,
  description,
  danger = false,
}: {
  active: boolean;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
          active
            ? danger
              ? "border-[#ff6161] bg-[#ff6161]"
              : "border-[#26a541] bg-[#26a541]"
            : "border-[#d7d7d7] bg-white"
        }`}
      >
        {active && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>

      <div>
        <p className="text-[13px] font-semibold text-[#212121]">{title}</p>
        <p className="mt-1 text-[12px] leading-5 text-[#878787]">
          {description}
        </p>
      </div>
    </div>
  );
}