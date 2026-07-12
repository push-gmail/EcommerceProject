import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import backendApi from "../../api/backendApi";
import type {
  ListResponse,
  Merchant,
  MerchantForm,
  MerchantStatus,
} from "../../types/merchant.types";

const initialForm: MerchantForm = {
  name: "",
  email: "",
  phone: "",
  shopName: "",
  pincode: "",
  status: "active",
};

const statusStyles: Record<MerchantStatus, string> = {
  active:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-emerald-500/10",
  inactive:
    "border-amber-400/30 bg-amber-400/10 text-amber-200 shadow-amber-500/10",
  blocked:
    "border-rose-400/30 bg-rose-400/10 text-rose-200 shadow-rose-500/10",
};

function StatusBadge({ status }: { status: MerchantStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide shadow-lg ${
        statusStyles[status] || statusStyles.inactive
      }`}
    >
      {status}
    </span>
  );
}

export default function Merchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [form, setForm] = useState<MerchantForm>(initialForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get<ListResponse<Merchant>>(
        `/merchant/get-merchants?t=${Date.now()}`
      );

      setMerchants(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Merchant name is required");
      return;
    }

    if (!form.email.trim()) {
      setError("Merchant email is required");
      return;
    }

    if (!form.shopName.trim()) {
      setError("Shop name is required");
      return;
    }

    const cleanPincode = form.pincode.replace(/\D/g, "").slice(0, 6);

    if (!cleanPincode) {
      setError("Merchant pincode is required");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      setError("Enter valid 6 digit pincode");
      return;
    }

    const payload: MerchantForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      shopName: form.shopName.trim(),
      pincode: cleanPincode,
    };

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      if (editingId) {
        const res = await backendApi.put(
          `/merchant/update-merchant/${editingId}`,
          payload
        );

        setSuccess(res.data?.message || "Merchant updated successfully");
      } else {
        const res = await backendApi.post("/merchant/create-merchant", payload);

        setSuccess(
          res.data?.message ||
            "Merchant created successfully and credentials sent by email"
        );
      }

      resetForm();
      setSearch("");
      setCurrentPage(1);
      await fetchMerchants();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (editingId
            ? "Failed to update merchant"
            : "Failed to create merchant")
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: MerchantStatus) => {
    try {
      setUpdatingId(id);
      setError("");
      setSuccess("");

      const res = await backendApi.put(`/merchant/update-merchant-status/${id}`, {
        status,
      });

      setSuccess(res.data?.message || "Merchant status updated successfully");
      await fetchMerchants();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setEditingId(merchant._id);

    setForm({
      name: merchant.name || "",
      email: merchant.email || "",
      phone: merchant.phone || "",
      shopName: merchant.shopName || "",
      pincode: merchant.pincode || "",
      status: merchant.status || "active",
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteMerchant = async (id: string, merchantName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete merchant "${merchantName}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setUpdatingId(id);
      setError("");
      setSuccess("");

      const res = await backendApi.delete(`/merchant/delete-merchant/${id}`);

      setSuccess(res.data?.message || "Merchant deleted successfully");

      await fetchMerchants();

      if (paginatedData.length === 1 && safePage > 1) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }

      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete merchant");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return merchants;

    return merchants.filter((merchant) => {
      return (
        merchant.merchantId?.toLowerCase().includes(q) ||
        merchant.name?.toLowerCase().includes(q) ||
        merchant.email?.toLowerCase().includes(q) ||
        merchant.phone?.toLowerCase().includes(q) ||
        merchant.shopName?.toLowerCase().includes(q) ||
        merchant.pincode?.toLowerCase().includes(q) ||
        merchant.status?.toLowerCase().includes(q)
      );
    });
  }, [merchants, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
  const showingFrom = filteredData.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + rowsPerPage, filteredData.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [safePage, totalPages]);

  const activeCount = merchants.filter((m) => m.status === "active").length;
  const inactiveCount = merchants.filter((m) => m.status === "inactive").length;
  const blockedCount = merchants.filter((m) => m.status === "blocked").length;

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_35%),linear-gradient(135deg,#020617,#031C12,#052E16)] p-5 text-slate-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-36 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 space-y-6">
        <section className="flex flex-col justify-between gap-5 rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.16)] backdrop-blur-2xl md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
              Emerald Command Center
            </div>

            <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Merchants
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Master creates merchant accounts with a unique service pincode.
              Backend generates a temporary password, saves hashed password, and
              emails login credentials.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-center backdrop-blur-xl">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-2xl font-black text-white">
                {merchants.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center backdrop-blur-xl">
              <p className="text-xs text-emerald-200">Active</p>
              <p className="text-2xl font-black text-emerald-200">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center backdrop-blur-xl">
              <p className="text-xs text-amber-200">Inactive</p>
              <p className="text-2xl font-black text-amber-200">
                {inactiveCount}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-center backdrop-blur-xl">
              <p className="text-xs text-rose-200">Blocked</p>
              <p className="text-2xl font-black text-rose-200">
                {blockedCount}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200 shadow-[0_0_28px_rgba(244,63,94,0.12)] backdrop-blur-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-200 shadow-[0_0_28px_rgba(16,185,129,0.12)] backdrop-blur-xl">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl"
        >
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-white">
                {editingId ? "Edit Merchant" : "Create Merchant"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {editingId
                  ? "Update merchant details. Password will not be changed."
                  : "Add merchant details and assign a unique service pincode. Login password will be generated and sent by email automatically."}
              </p>
            </div>

            {editingId && (
              <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                Editing Mode
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Merchant Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Example: Raj Kumar"
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="merchant@gmail.com"
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="9876543210"
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Shop Name
              </label>
              <input
                value={form.shopName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shopName: e.target.value }))
                }
                placeholder="Raj Fresh Mart"
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Pincode
              </label>
              <input
                value={form.pincode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
                placeholder="826754"
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as MerchantStatus,
                  }))
                }
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              >
                <option className="bg-[#031C12]" value="active">
                  Active
                </option>
                <option className="bg-[#031C12]" value="inactive">
                  Inactive
                </option>
                <option className="bg-[#031C12]" value="blocked">
                  Blocked
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={creating}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating
                ? editingId
                  ? "Updating..."
                  : "Creating & Sending Email..."
                : editingId
                ? "Update Merchant"
                : "Create Merchant"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold text-white shadow-lg shadow-black/20 transition hover:bg-white/15"
            >
              Reset
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-6 py-3 font-bold text-rose-100 shadow-lg shadow-black/20 transition hover:bg-rose-500/20"
              >
                <X size={16} />
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <section className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Merchant List</h2>
              <p className="mt-1 text-sm text-slate-400">
                Manage merchant accounts, edit details, delete merchants and
                change access status.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto xl:items-center">
              <div className="relative w-full md:w-96">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search merchant, email, shop, pincode, status..."
                  className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 pr-24 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 transition hover:text-rose-300"
                  >
                    Clear
                  </button>
                )}

                <div className="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.9)]" />
              </div>

              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              >
                <option className="bg-[#031C12]" value={5}>
                  5 / page
                </option>
                <option className="bg-[#031C12]" value={10}>
                  10 / page
                </option>
                <option className="bg-[#031C12]" value={20}>
                  20 / page
                </option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-emerald-400/20 bg-black/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-xl">
            <table className="w-full min-w-[1280px] text-left text-sm text-slate-100">
              <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
                <tr>
                  <th className="p-4 font-bold">Merchant ID</th>
                  <th className="p-4 font-bold">Merchant</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Phone</th>
                  <th className="p-4 font-bold">Shop</th>
                  <th className="p-4 font-bold">Pincode</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Change Status</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-400/10">
                {loading && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Loading merchants...
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginatedData.map((merchant) => (
                    <tr
                      key={merchant._id}
                      className={`transition hover:bg-emerald-400/5 ${
                        editingId === merchant._id ? "bg-cyan-400/5" : ""
                      }`}
                    >
                      <td className="p-4">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                          {merchant.merchantId}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-white">{merchant.name}</p>
                        <p className="text-xs text-slate-500">
                          {merchant.isPasswordChanged
                            ? "Password changed"
                            : "Temporary password"}
                        </p>
                      </td>

                      <td className="p-4 text-slate-300">{merchant.email}</td>

                      <td className="p-4 text-slate-300">
                        {merchant.phone || "-"}
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-emerald-100">
                          {merchant.shopName}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                          {merchant.pincode || "-"}
                        </span>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={merchant.status} />
                      </td>

                      <td className="p-4">
                        <select
                          disabled={updatingId === merchant._id}
                          value={merchant.status}
                          onChange={(e) =>
                            handleStatusChange(
                              merchant._id,
                              e.target.value as MerchantStatus
                            )
                          }
                          className="rounded-xl border border-emerald-400/20 bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none disabled:opacity-50"
                        >
                          <option className="bg-[#031C12]" value="active">
                            Active
                          </option>
                          <option className="bg-[#031C12]" value="inactive">
                            Inactive
                          </option>
                          <option className="bg-[#031C12]" value="blocked">
                            Blocked
                          </option>
                        </select>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditMerchant(merchant)}
                            disabled={updatingId === merchant._id}
                            title="Edit Merchant"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 transition hover:bg-cyan-400/20 hover:shadow-[0_0_18px_rgba(34,211,238,0.16)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteMerchant(merchant._id, merchant.name)
                            }
                            disabled={updatingId === merchant._id}
                            title="Delete Merchant"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-100 transition hover:bg-rose-500/20 hover:shadow-[0_0_18px_rgba(244,63,94,0.16)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center">
                      <div className="mx-auto max-w-sm rounded-3xl border border-emerald-400/20 bg-white/5 p-6">
                        <p className="text-lg font-bold text-white">
                          No merchants found
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Create your first merchant account.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-emerald-300">{showingFrom}</span>{" "}
              to{" "}
              <span className="font-bold text-emerald-300">{showingTo}</span>{" "}
              of{" "}
              <span className="font-bold text-emerald-300">
                {filteredData.length}
              </span>{" "}
              merchants
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {pageNumbers.map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    page === safePage
                      ? "bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "border border-emerald-400/20 bg-black/30 text-emerald-100 hover:bg-emerald-400/10"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}