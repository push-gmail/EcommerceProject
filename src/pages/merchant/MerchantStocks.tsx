import { useEffect, useMemo, useState } from "react";
import {
  PackageCheck,
  PackageX,
  Search,
  RefreshCcw,
  Warehouse,
} from "lucide-react";
import backendApi from "../../api/backendApi";

interface ListResponse<T> {
  success: boolean;
  count?: number;
  data: T[];
  message?: string;
}

interface MerchantStock {
  _id: string;

  productName: string;
  images: string[];

  itemName: string;
  brandName: string;

  categoryName: string;
  subCategoryName: string;
  subSubCategoryName: string;

  packets: number;
  quantityInPackets: string;
  unit: string;

  mrp: number;
  sellingPrice: number;
  discountPercent: number;

  approvalStatus: "pending" | "approved" | "rejected";
  productStatus: "active" | "inactive";

  stockStatus: "in-stock" | "out-of-stock";

  createdAt?: string;
  updatedAt?: string;
}

const stockBadgeClass = (status: "in-stock" | "out-of-stock") => {
  if (status === "in-stock") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  return "border-rose-400/30 bg-rose-400/10 text-rose-200";
};

const approvalBadgeClass: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export default function MerchantStocks() {
  const [stocks, setStocks] = useState<MerchantStock[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in-stock" | "out-of-stock"
  >("all");

  const [error, setError] = useState("");

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get<ListResponse<MerchantStock>>(
        `/merchant/my-stocks?t=${Date.now()}`
      );

      setStocks(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch stocks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return stocks.filter((stock) => {
      const matchesStock =
        stockFilter === "all" ? true : stock.stockStatus === stockFilter;

      const matchesSearch =
        !q ||
        stock.itemName?.toLowerCase().includes(q) ||
        stock.productName?.toLowerCase().includes(q) ||
        stock.brandName?.toLowerCase().includes(q) ||
        stock.quantityInPackets?.toLowerCase().includes(q) ||
        stock.categoryName?.toLowerCase().includes(q) ||
        stock.subCategoryName?.toLowerCase().includes(q) ||
        stock.subSubCategoryName?.toLowerCase().includes(q);

      return matchesStock && matchesSearch;
    });
  }, [stocks, search, stockFilter]);

  const totalItems = stocks.length;

  const inStockCount = stocks.filter(
    (stock) => stock.stockStatus === "in-stock"
  ).length;

  const outOfStockCount = stocks.filter(
    (stock) => stock.stockStatus === "out-of-stock"
  ).length;

  const totalPackets = stocks.reduce((sum, stock) => {
    return sum + (Number(stock.packets) || 0);
  }, 0);

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_35%),linear-gradient(135deg,#020617,#031C12,#052E16)] p-5 text-slate-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-36 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 space-y-6">
        <section className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                <Warehouse size={14} />
                Merchant Stock Center
              </div>

              <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                Stocks
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                View your product stocks. If packets are greater than zero,
                product is In Stock. If packets are zero, product is Out of
                Stock.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Items" value={totalItems} />
              <StatCard label="In Stock" value={inStockCount} tone="emerald" />
              <StatCard
                label="Out Stock"
                value={outOfStockCount}
                tone="rose"
              />
              <StatCard label="Packets" value={totalPackets} tone="cyan" />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Stock Table</h2>
              <p className="mt-1 text-sm text-slate-400">
                Your item-wise product stock list.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
              <div className="relative w-full md:w-96">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item, product, brand..."
                  className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 py-3 pl-11 pr-4 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                />
              </div>

              <select
                value={stockFilter}
                onChange={(e) =>
                  setStockFilter(
                    e.target.value as "all" | "in-stock" | "out-of-stock"
                  )
                }
                className="rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              >
                <option className="bg-[#031C12]" value="all">
                  All Stocks
                </option>
                <option className="bg-[#031C12]" value="in-stock">
                  In Stock
                </option>
                <option className="bg-[#031C12]" value="out-of-stock">
                  Out of Stock
                </option>
              </select>

              <button
                type="button"
                onClick={fetchStocks}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-emerald-400/20 bg-black/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-xl">
            <table className="w-full min-w-[1000px] text-left text-sm text-slate-100">
              <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
                <tr>
                  <th className="p-4">Image</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Quantity In Packets</th>
                  <th className="p-4">Packets</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4">Approval</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-400/10">
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading stocks...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredStocks.map((stock) => {
                    const firstImage =
                      Array.isArray(stock.images) && stock.images.length > 0
                        ? stock.images[0]
                        : "";

                    return (
                      <tr
                        key={stock._id}
                        className="transition hover:bg-emerald-400/5"
                      >
                        <td className="p-4">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={stock.productName}
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
                            {stock.itemName || "Item not found"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Brand: {stock.brandName || "-"}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-emerald-100">
                            {stock.productName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {stock.categoryName} / {stock.subCategoryName} /{" "}
                            {stock.subSubCategoryName}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="font-black text-slate-100">
                            {stock.quantityInPackets || "-"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Unit: {stock.unit || "-"}
                          </p>
                        </td>

                        <td className="p-4">
                          <p
                            className={`text-2xl font-black ${
                              Number(stock.packets) > 0
                                ? "text-emerald-200"
                                : "text-rose-200"
                            }`}
                          >
                            {Number(stock.packets) || 0}
                          </p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase ${stockBadgeClass(
                              stock.stockStatus
                            )}`}
                          >
                            {stock.stockStatus === "in-stock" ? (
                              <PackageCheck size={14} />
                            ) : (
                              <PackageX size={14} />
                            )}

                            {stock.stockStatus === "in-stock"
                              ? "In Stock"
                              : "Out of Stock"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${
                              approvalBadgeClass[stock.approvalStatus] ||
                              approvalBadgeClass.pending
                            }`}
                          >
                            {stock.approvalStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && filteredStocks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <div className="mx-auto max-w-sm rounded-3xl border border-emerald-400/20 bg-white/5 p-6">
                        <p className="text-lg font-bold text-white">
                          No stocks found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Add products from Products section to see stock here.
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
  tone?: "white" | "emerald" | "rose" | "cyan";
}) {
  const toneClass = {
    white: "border-white/10 bg-black/30 text-white",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
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