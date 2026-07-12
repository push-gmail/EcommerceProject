import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  PackageCheck,
  PackageX,
  Search,
  Store,
  X,
  Layers,
  Download,
} from "lucide-react";
import backendApi from "../../api/backendApi";

interface ListResponse<T> {
  success: boolean;
  count?: number;
  data: T[];
  message?: string;
}

interface StockMerchant {
  _id: string;
  merchantId: string;
  name: string;
  email: string;
  phone?: string;
  shopName: string;
  status: string;
}

interface StockMiniData {
  _id: string;
  name: string;
  slug?: string;
  logo?: string;
}

interface MerchantStockDetail {
  productId: string;
  productName: string;
  images: string[];

  packets: number;
  quantityInPackets: string;
  unit: string;

  mrp: number;
  sellingPrice: number;
  discountPercent: number;

  approvalStatus: "pending" | "approved" | "rejected";
  productStatus: "active" | "inactive";

  merchant: StockMerchant | null;

  category: StockMiniData | null;
  subCategory: StockMiniData | null;
  subSubCategory: StockMiniData | null;
  item: StockMiniData | null;
  brand: StockMiniData | null;

  createdAt?: string;
  updatedAt?: string;
}

interface StockVariant {
  _id: string;
  variant: string;
  quantityInPackets: string;
  unit: string;
  packets: number;
  stockStatus: "in-stock" | "out-of-stock";
  merchants: MerchantStockDetail[];
}

interface GroupedStockRow {
  _id: string;
  itemId: string;
  itemName: string;
  brandId: string;
  brandName: string;
  totalPackets: number;
  stockStatus: "in-stock" | "out-of-stock";
  variants: StockVariant[];
}

const stockBadgeClass = (status: "in-stock" | "out-of-stock") => {
  if (status === "in-stock") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  return "border-rose-400/30 bg-rose-400/10 text-rose-200";
};

const valueOrDash = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  return value;
};

const safeArray = <T,>(value: T[] | undefined | null): T[] => {
  return Array.isArray(value) ? value : [];
};

const getStockStatus = (packets: number): "in-stock" | "out-of-stock" => {
  return Number(packets) > 0 ? "in-stock" : "out-of-stock";
};

const csvEscape = (value: string | number | null | undefined) => {
  const stringValue =
    value === undefined || value === null ? "" : String(value);

  return `"${stringValue.replace(/"/g, '""')}"`;
};

const downloadCsvFile = (
  filename: string,
  rows: Array<Array<string | number>>
) => {
  const csvContent = rows
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const normalizeStockRows = (rows: unknown[]): GroupedStockRow[] => {
  return safeArray<unknown>(rows).map((rawRow) => {
    const row = rawRow as Partial<GroupedStockRow> & {
      name?: string;
      variants?: unknown[];
    };

    const variants: StockVariant[] = safeArray<unknown>(row.variants).map(
      (rawVariant) => {
        const variant = rawVariant as Partial<StockVariant> & {
          merchants?: unknown[];
        };

        const packets = Number(variant.packets || 0);

        return {
          _id: String(variant._id || `${row._id}-${variant.variant}`),
          variant: String(variant.variant || "-"),
          quantityInPackets: String(variant.quantityInPackets || ""),
          unit: String(variant.unit || ""),
          packets,
          stockStatus:
            variant.stockStatus === "in-stock" ||
            variant.stockStatus === "out-of-stock"
              ? variant.stockStatus
              : getStockStatus(packets),
          merchants: safeArray<MerchantStockDetail>(
            variant.merchants as MerchantStockDetail[]
          ),
        };
      }
    );

    const totalPackets =
      Number(row.totalPackets) ||
      variants.reduce((sum, variant) => sum + Number(variant.packets || 0), 0);

    return {
      _id: String(row._id || row.itemId || row.itemName || Math.random()),
      itemId: String(row.itemId || ""),
      itemName: String(row.itemName || row.name || "Item not found"),
      brandId: String(row.brandId || ""),
      brandName: String(row.brandName || "Brand not found"),
      totalPackets,
      stockStatus:
        row.stockStatus === "in-stock" || row.stockStatus === "out-of-stock"
          ? row.stockStatus
          : getStockStatus(totalPackets),
      variants,
    };
  });
};

export default function MyStocks() {
  const [stocks, setStocks] = useState<GroupedStockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in-stock" | "out-of-stock"
  >("all");

  const [selectedItem, setSelectedItem] = useState<GroupedStockRow | null>(
    null
  );
  const [selectedVariant, setSelectedVariant] = useState<StockVariant | null>(
    null
  );
  const [selectedMerchant, setSelectedMerchant] =
    useState<MerchantStockDetail | null>(null);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get<ListResponse<GroupedStockRow>>(
        `/master/get-all-stocks?t=${Date.now()}`
      );

      const responseData = Array.isArray(res.data?.data) ? res.data.data : [];
      setStocks(normalizeStockRows(responseData));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch stock records");
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return safeArray<GroupedStockRow>(stocks).filter((stock) => {
      const variants = safeArray<StockVariant>(stock.variants);

      const matchesStock =
        stockFilter === "all" ? true : stock.stockStatus === stockFilter;

      const variantText = variants
        .map((variant) => variant.variant || "")
        .join(" ")
        .toLowerCase();

      const merchantText = variants
        .flatMap((variant) =>
          safeArray<MerchantStockDetail>(variant.merchants)
        )
        .map((detail) => {
          return `${detail.merchant?.name || ""} ${
            detail.merchant?.shopName || ""
          } ${detail.productName || ""} ${detail.brand?.name || ""}`;
        })
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !q ||
        String(stock.itemName || "").toLowerCase().includes(q) ||
        String(stock.brandName || "").toLowerCase().includes(q) ||
        variantText.includes(q) ||
        merchantText.includes(q);

      return matchesStock && matchesSearch;
    });
  }, [stocks, search, stockFilter]);

  const totalItems = stocks.length;

  const inStockCount = stocks.filter(
    (stock) => stock.stockStatus === "in-stock"
  ).length;

  const outStockCount = stocks.filter(
    (stock) => stock.stockStatus === "out-of-stock"
  ).length;

  const totalPackets = stocks.reduce((sum, stock) => {
    return sum + (Number(stock.totalPackets) || 0);
  }, 0);

  const closeAllModals = () => {
    setSelectedItem(null);
    setSelectedVariant(null);
    setSelectedMerchant(null);
  };

  const handleExportStocks = () => {
    const rows: Array<Array<string | number>> = [
      [
        "Item Name",
        "Brand",
        "Total Packets",
        "Stock Status",
        "Variant",
        "Variant Packets",
        "Merchant Name",
        "Merchant ID",
        "Merchant Email",
        "Merchant Phone",
        "Shop Name",
        "Product Name",
        "Product Packets",
        "Unit",
        "MRP",
        "Selling Price",
        "Discount %",
        "Category",
        "Sub Category",
        "Sub-Sub Category",
      ],
    ];

    filteredStocks.forEach((stock) => {
      const variants = safeArray<StockVariant>(stock.variants);

      if (variants.length === 0) {
        rows.push([
          stock.itemName,
          stock.brandName,
          stock.totalPackets,
          stock.stockStatus,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        return;
      }

      variants.forEach((variant) => {
        const merchants = safeArray<MerchantStockDetail>(variant.merchants);

        if (merchants.length === 0) {
          rows.push([
            stock.itemName,
            stock.brandName,
            stock.totalPackets,
            stock.stockStatus,
            variant.variant,
            variant.packets,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            variant.unit,
            "",
            "",
            "",
            "",
            "",
            "",
          ]);
          return;
        }

        merchants.forEach((detail) => {
          rows.push([
            stock.itemName,
            stock.brandName,
            stock.totalPackets,
            stock.stockStatus,
            variant.variant,
            variant.packets,
            detail.merchant?.name || "",
            detail.merchant?.merchantId || "",
            detail.merchant?.email || "",
            detail.merchant?.phone || "",
            detail.merchant?.shopName || "",
            detail.productName || "",
            detail.packets || 0,
            detail.unit || "",
            detail.mrp || 0,
            detail.sellingPrice || 0,
            detail.discountPercent || 0,
            detail.category?.name || "",
            detail.subCategory?.name || "",
            detail.subSubCategory?.name || "",
          ]);
        });
      });
    });

    const today = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`master-stocks-${today}.csv`, rows);
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
                Emerald Stock Center
              </div>

              <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                My Stocks
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Item + brand wise grouped stock. Same variant ke packets
                merchant-wise add honge.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Items" value={totalItems} />
              <StatCard label="In Stock" value={inStockCount} tone="emerald" />
              <StatCard label="Out Stock" value={outStockCount} tone="rose" />
              <StatCard label="Packets" value={totalPackets} tone="cyan" />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200 shadow-[0_0_28px_rgba(244,63,94,0.12)] backdrop-blur-xl">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Grouped Stock Table
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Name, brand, total packets and variant details are available
                here.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
              <button
                type="button"
                onClick={handleExportStocks}
                disabled={filteredStocks.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={17} />
                Export CSV
              </button>

              <div className="relative w-full md:w-96">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item, brand, variant, merchant..."
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
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-emerald-400/20 bg-black/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-xl">
            <table className="w-full min-w-[1000px] text-left text-sm text-slate-100">
              <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
                <tr>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Brand</th>
                  <th className="p-4 font-bold">Total Packets</th>
                  <th className="p-4 font-bold">Stock</th>
                  <th className="p-4 font-bold">Variant</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-400/10">
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading grouped stocks...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredStocks.map((stock) => {
                    const variantCount = safeArray<StockVariant>(
                      stock.variants
                    ).length;

                    return (
                      <tr
                        key={stock._id}
                        className="transition hover:bg-emerald-400/5"
                      >
                        <td className="p-4">
                          <p className="font-black text-white">
                            {stock.itemName || "Item not found"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {variantCount} variant
                            {variantCount > 1 ? "s" : ""} available
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-emerald-100">
                            {stock.brandName || "Brand not found"}
                          </p>
                        </td>

                        <td className="p-4">
                          <p
                            className={`text-2xl font-black ${
                              Number(stock.totalPackets) > 0
                                ? "text-emerald-200"
                                : "text-rose-200"
                            }`}
                          >
                            {Number(stock.totalPackets) || 0}
                          </p>
                        </td>

                        <td className="p-4">
                          <StockBadge status={stock.stockStatus} />
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedItem({
                                ...stock,
                                variants: safeArray<StockVariant>(
                                  stock.variants
                                ),
                              })
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && filteredStocks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <div className="mx-auto max-w-sm rounded-3xl border border-emerald-400/20 bg-white/5 p-6">
                        <p className="text-lg font-bold text-white">
                          No stock records found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Merchant products will appear here after creation.
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

      {selectedItem &&
        createPortal(
          <div className="fixed inset-0 z-[990] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <div className="w-full max-w-5xl rounded-[2rem] border border-emerald-400/25 bg-[#031C12]/95 p-6 text-white shadow-[0_0_70px_rgba(16,185,129,0.22)]">
              <ModalHeader
                eyebrow="Variant Details"
                title={`${selectedItem.itemName} · ${selectedItem.brandName}`}
                onClose={closeAllModals}
              />

              <div className="mb-5 grid grid-cols-3 gap-3">
                <DetailBox label="Item" value={selectedItem.itemName} />
                <DetailBox label="Brand" value={selectedItem.brandName} />
                <DetailBox
                  label="Total Packets"
                  value={selectedItem.totalPackets}
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto rounded-3xl border border-emerald-400/20 bg-black/30">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
                    <tr>
                      <th className="p-4">S.No</th>
                      <th className="p-4">Variant</th>
                      <th className="p-4">Packets</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Merchant</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-emerald-400/10">
                    {safeArray<StockVariant>(selectedItem.variants).map(
                      (variant, index) => (
                        <tr
                          key={variant._id}
                          className="transition hover:bg-emerald-400/5"
                        >
                          <td className="p-4 font-bold text-slate-300">
                            {index + 1}
                          </td>

                          <td className="p-4">
                            <p className="font-black text-white">
                              {variant.variant}
                            </p>

                            <p className="text-xs text-slate-500">
                              Unit: {valueOrDash(variant.unit)}
                            </p>
                          </td>

                          <td className="p-4">
                            <p
                              className={`text-2xl font-black ${
                                Number(variant.packets) > 0
                                  ? "text-emerald-200"
                                  : "text-rose-200"
                              }`}
                            >
                              {Number(variant.packets) || 0}
                            </p>
                          </td>

                          <td className="p-4">
                            <StockBadge status={variant.stockStatus} />
                          </td>

                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedVariant({
                                  ...variant,
                                  merchants: safeArray<MerchantStockDetail>(
                                    variant.merchants
                                  ),
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}

                    {safeArray<StockVariant>(selectedItem.variants).length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-slate-400"
                        >
                          No variants found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        )}

      {selectedVariant &&
        createPortal(
          <div className="fixed inset-0 z-[995] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-5xl rounded-[2rem] border border-cyan-400/25 bg-[#031C12]/95 p-6 text-white shadow-[0_0_70px_rgba(34,211,238,0.18)]">
              <ModalHeader
                eyebrow="Merchant Variant Breakup"
                title={`Variant: ${selectedVariant.variant}`}
                onClose={() => setSelectedVariant(null)}
              />

              <div className="mb-5 grid grid-cols-3 gap-3">
                <DetailBox label="Variant" value={selectedVariant.variant} />
                <DetailBox label="Packets" value={selectedVariant.packets} />
                <DetailBox
                  label="Merchants"
                  value={
                    safeArray<MerchantStockDetail>(
                      selectedVariant.merchants
                    ).length
                  }
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto rounded-3xl border border-cyan-400/20 bg-black/30">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-cyan-400/10 bg-cyan-500/10 text-cyan-100">
                    <tr>
                      <th className="p-4">S.No</th>
                      <th className="p-4">Merchant</th>
                      <th className="p-4">Shop</th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Packets</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-cyan-400/10">
                    {safeArray<MerchantStockDetail>(
                      selectedVariant.merchants
                    ).map((detail, index) => (
                      <tr
                        key={`${detail.productId}-${index}`}
                        className="transition hover:bg-cyan-400/5"
                      >
                        <td className="p-4 font-bold text-slate-300">
                          {index + 1}
                        </td>

                        <td className="p-4">
                          <p className="font-black text-white">
                            {detail.merchant?.name || "Merchant not found"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {detail.merchant?.email || "-"}
                          </p>
                        </td>

                        <td className="p-4 font-bold text-emerald-100">
                          {detail.merchant?.shopName || "-"}
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-white">
                            {detail.productName}
                          </p>

                          <p className="text-xs text-slate-500">
                            Brand: {detail.brand?.name || "-"}
                          </p>
                        </td>

                        <td className="p-4">
                          <p
                            className={`text-2xl font-black ${
                              Number(detail.packets) > 0
                                ? "text-emerald-200"
                                : "text-rose-200"
                            }`}
                          >
                            {Number(detail.packets) || 0}
                          </p>
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setSelectedMerchant(detail)}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/20"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {safeArray<MerchantStockDetail>(selectedVariant.merchants)
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-400"
                        >
                          No merchants found for this variant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body
        )}

      {selectedMerchant &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-4xl rounded-[2rem] border border-emerald-400/25 bg-[#031C12]/95 p-6 text-white shadow-[0_0_70px_rgba(16,185,129,0.22)]">
              <ModalHeader
                eyebrow="Merchant Detail"
                title={selectedMerchant.merchant?.name || "Merchant not found"}
                onClose={() => setSelectedMerchant(null)}
              />

              <div className="mb-5 flex items-center gap-4 rounded-3xl border border-emerald-400/20 bg-black/25 p-4">
                {selectedMerchant.images?.[0] ? (
                  <img
                    src={selectedMerchant.images[0]}
                    alt={selectedMerchant.productName}
                    className="h-20 w-20 rounded-2xl border border-emerald-400/20 object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/160x160/031C12/10B981?text=IMG";
                    }}
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-sm font-black text-emerald-200">
                    IMG
                  </div>
                )}

                <div>
                  <p className="text-xl font-black text-white">
                    {selectedMerchant.productName}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Brand: {selectedMerchant.brand?.name || "-"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Store size={18} className="text-emerald-300" />
                    <p className="font-black text-emerald-100">
                      Merchant Details
                    </p>
                  </div>

                  <DetailRow
                    label="Merchant Name"
                    value={selectedMerchant.merchant?.name}
                  />

                  <DetailRow
                    label="Merchant ID"
                    value={selectedMerchant.merchant?.merchantId}
                  />

                  <DetailRow
                    label="Email"
                    value={selectedMerchant.merchant?.email}
                  />

                  <DetailRow
                    label="Phone"
                    value={selectedMerchant.merchant?.phone}
                  />

                  <DetailRow
                    label="Shop Name"
                    value={selectedMerchant.merchant?.shopName}
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <PackageCheck size={18} className="text-emerald-300" />
                    <p className="font-black text-emerald-100">
                      Stock Details
                    </p>
                  </div>

                  <DetailRow
                    label="Item"
                    value={selectedMerchant.item?.name || "Item not found"}
                  />

                  <DetailRow
                    label="Product"
                    value={selectedMerchant.productName}
                  />

                  <DetailRow
                    label="Variant"
                    value={selectedMerchant.quantityInPackets}
                  />

                  <DetailRow
                    label="Packets"
                    value={selectedMerchant.packets}
                  />

                  <DetailRow label="Unit" value={selectedMerchant.unit} />
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-4 md:col-span-2">
                  <div className="mb-3 flex items-center gap-2">
                    <Layers size={18} className="text-cyan-300" />
                    <p className="font-black text-emerald-100">
                      Price & Category
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <DetailBox label="MRP" value={`₹${selectedMerchant.mrp}`} />

                    <DetailBox
                      label="Selling Price"
                      value={`₹${selectedMerchant.sellingPrice}`}
                    />

                    <DetailBox
                      label="Discount"
                      value={`${selectedMerchant.discountPercent}%`}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <DetailBox
                      label="Category"
                      value={selectedMerchant.category?.name || "-"}
                    />

                    <DetailBox
                      label="Sub Category"
                      value={selectedMerchant.subCategory?.name || "-"}
                    />

                    <DetailBox
                      label="Sub-Sub Category"
                      value={selectedMerchant.subSubCategory?.name || "-"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
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

function StockBadge({
  status,
}: {
  status: "in-stock" | "out-of-stock";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase ${stockBadgeClass(
        status
      )}`}
    >
      {status === "in-stock" ? (
        <PackageCheck size={14} />
      ) : (
        <PackageX size={14} />
      )}

      {status === "in-stock" ? "In Stock" : "Out of Stock"}
    </span>
  );
}

function ModalHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
          {eyebrow}
        </p>

        <h3 className="mt-1 text-2xl font-black text-white">{title}</h3>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-100 transition hover:bg-rose-500/20"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 py-2 last:border-b-0">
      <span className="text-sm text-slate-400">{label}</span>

      <span className="text-right text-sm font-bold text-white">
        {valueOrDash(value)}
      </span>
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 text-lg font-black text-white">
        {valueOrDash(value)}
      </p>
    </div>
  );
}