import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  X,
  Search,
  PackageCheck,
  PackageX,
  RefreshCcw,
} from "lucide-react";
import backendApi from "../../api/backendApi";

type RequestStatus = "pending" | "approved" | "rejected" | "all";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface ListResponse<T> {
  success: boolean;
  count?: number;
  status?: string;
  data: T[];
  message?: string;
}

interface MerchantProduct {
  _id: string;
  merchantId: any;
  categoryId: any;
  subCategoryId: any;
  subSubCategoryId: any;
  itemId: any;
  brandId: any;
  productName: string;
  images: string[];
  packets: number;
  quantityInPackets: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  status: "active" | "inactive";
  createdAt?: string;
}

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending Requests",
  approved: "Approved Requests",
  rejected: "Rejected Requests",
  all: "All Requests",
};

const statusDescriptions: Record<RequestStatus, string> = {
  pending: "Products submitted by merchants and waiting for master approval.",
  approved: "Products approved by master.",
  rejected: "Products rejected by master.",
  all: "All merchant product requests including pending, approved and rejected.",
};

const getName = (value: any) => {
  return typeof value === "object" && value?.name ? value.name : "-";
};

const getMerchantName = (value: any) => {
  return typeof value === "object" && value?.name ? value.name : "-";
};

const getMerchantEmail = (value: any) => {
  return typeof value === "object" && value?.email ? value.email : "-";
};

const getShopName = (value: any) => {
  return typeof value === "object" && value?.shopName ? value.shopName : "-";
};

const approvalStyle: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

const getValidStatus = (status?: string): RequestStatus => {
  if (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "all"
  ) {
    return status;
  }

  return "all";
};

export default function ProductRequests() {
  const params = useParams();
  const navigate = useNavigate();

  const currentStatus = getValidStatus(params.status);

  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get<ListResponse<MerchantProduct>>(
        `/master/product-requests?status=${currentStatus}&t=${Date.now()}`
      );

      setProducts(res.data.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch product requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentStatus]);

  const updateApprovalStatus = async (
    id: string,
    approvalStatus: ApprovalStatus
  ) => {
    try {
      setUpdatingId(id);
      setError("");
      setSuccess("");

      const res = await backendApi.put(
        `/master/product-requests/update-status/${id}`,
        { approvalStatus }
      );

      setSuccess(res.data?.message || "Request status updated successfully");
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update request");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      return (
        !q ||
        product.productName?.toLowerCase().includes(q) ||
        getMerchantName(product.merchantId).toLowerCase().includes(q) ||
        getMerchantEmail(product.merchantId).toLowerCase().includes(q) ||
        getShopName(product.merchantId).toLowerCase().includes(q) ||
        getName(product.itemId).toLowerCase().includes(q) ||
        getName(product.categoryId).toLowerCase().includes(q) ||
        getName(product.subCategoryId).toLowerCase().includes(q) ||
        getName(product.subSubCategoryId).toLowerCase().includes(q) ||
        getName(product.brandId).toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const pendingCount = products.filter(
    (product) => product.approvalStatus === "pending"
  ).length;

  const approvedCount = products.filter(
    (product) => product.approvalStatus === "approved"
  ).length;

  const rejectedCount = products.filter(
    (product) => product.approvalStatus === "rejected"
  ).length;

  const totalCount = products.length;

  const goToStatus = (status: RequestStatus) => {
    navigate(`/master/requests/${status}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_35%),linear-gradient(135deg,#020617,#031C12,#052E16)] p-5 text-slate-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-36 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 space-y-6">
        <section className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.16)] backdrop-blur-2xl">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                Merchant Product Requests
              </div>

              <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                {statusLabels[currentStatus]}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                {statusDescriptions[currentStatus]}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Total" value={totalCount} />
              <StatCard label="Pending" value={pendingCount} tone="amber" />
              <StatCard label="Approved" value={approvedCount} tone="emerald" />
              <StatCard label="Rejected" value={rejectedCount} tone="rose" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <FilterButton
              label="Pending"
              active={currentStatus === "pending"}
              onClick={() => goToStatus("pending")}
            />

            <FilterButton
              label="Approved"
              active={currentStatus === "approved"}
              onClick={() => goToStatus("approved")}
            />

            <FilterButton
              label="Rejected"
              active={currentStatus === "rejected"}
              onClick={() => goToStatus("rejected")}
            />

            <FilterButton
              label="All"
              active={currentStatus === "all"}
              onClick={() => goToStatus("all")}
            />
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-200">
            {success}
          </div>
        )}

        <section className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Request Table
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Filtered merchant product requests from MerchantProduct model.
              </p>
            </div>

            <div className="relative w-full md:w-96">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, merchant, email..."
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 py-3 pl-11 pr-4 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-emerald-400/20 bg-black/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-xl">
            <table className="w-full min-w-[1700px] text-left text-sm text-slate-100">
              <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
                <tr>
                  <th className="p-4">Image</th>
                  <th className="p-4">Merchant</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category Path</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Packets</th>
                  <th className="p-4">Quantity In Packets</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-400/10">
                {loading && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Loading requests...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredProducts.map((product) => {
                    const firstImage =
                      Array.isArray(product.images) &&
                      product.images.length > 0
                        ? product.images[0]
                        : "";

                    return (
                      <tr
                        key={product._id}
                        className="transition hover:bg-emerald-400/5"
                      >
                        <td className="p-4">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={product.productName}
                              className="h-14 w-14 rounded-2xl border border-emerald-400/20 object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://placehold.co/120x120/031C12/10B981?text=IMG";
                              }}
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xs font-black text-emerald-200">
                              IMG
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <p className="font-black text-white">
                            {getMerchantName(product.merchantId)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {getShopName(product.merchantId)}
                          </p>
                        </td>

                        <td className="p-4 text-slate-300">
                          {getMerchantEmail(product.merchantId)}
                        </td>

                        <td className="p-4">
                          <p className="font-black text-white">
                            {product.productName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Item: {getName(product.itemId)}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="text-emerald-100">
                            {getName(product.categoryId)}
                          </p>
                          <p className="text-xs text-cyan-100">
                            {getName(product.subCategoryId)}
                          </p>
                          <p className="text-xs text-amber-100">
                            {getName(product.subSubCategoryId)}
                          </p>
                        </td>

                        <td className="p-4 font-bold text-white">
                          {getName(product.brandId)}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {Number(product.packets) > 0 ? (
                              <PackageCheck
                                size={17}
                                className="text-emerald-300"
                              />
                            ) : (
                              <PackageX
                                size={17}
                                className="text-rose-300"
                              />
                            )}

                            <span
                              className={`text-2xl font-black ${
                                Number(product.packets) > 0
                                  ? "text-emerald-200"
                                  : "text-rose-200"
                              }`}
                            >
                              {Number(product.packets) || 0}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-slate-200">
                            {product.quantityInPackets || "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Unit: {product.unit || "-"}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="text-slate-300">
                            MRP: ₹{product.mrp}
                          </p>
                          <p className="font-black text-emerald-200">
                            Sell: ₹{product.sellingPrice}
                          </p>
                          <p className="text-xs text-amber-200">
                            {product.discountPercent}% off
                          </p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${
                              approvalStyle[product.approvalStatus] ||
                              approvalStyle.pending
                            }`}
                          >
                            {product.approvalStatus}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                updatingId === product._id ||
                                product.approvalStatus === "approved"
                              }
                              onClick={() =>
                                updateApprovalStatus(product._id, "approved")
                              }
                              title="Approve Product"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Check size={17} />
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingId === product._id ||
                                product.approvalStatus === "rejected"
                              }
                              onClick={() =>
                                updateApprovalStatus(product._id, "rejected")
                              }
                              title="Reject Product"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <X size={17} />
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingId === product._id ||
                                product.approvalStatus === "pending"
                              }
                              onClick={() =>
                                updateApprovalStatus(product._id, "pending")
                              }
                              title="Move To Pending"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <RefreshCcw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-10 text-center">
                      <div className="mx-auto max-w-sm rounded-3xl border border-emerald-400/20 bg-white/5 p-6">
                        <p className="text-lg font-bold text-white">
                          No requests found
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Merchant product requests will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "amber" | "emerald" | "rose";
}) {
  const toneClass = {
    white: "border-white/10 bg-black/30 text-white",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-center backdrop-blur-xl ${toneClass[tone]}`}
    >
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
        active
          ? "border border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-cyan-400/15 to-blue-500/20 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.18)]"
          : "border border-white/10 bg-black/25 text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}