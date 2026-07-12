import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import backendApi from "../../api/backendApi";
import StatusBadge from "../../components/master/StatusBadge";
import Pagination from "../../components/master/Pagination";
import type { Brand, BrandForm, ListResponse } from "../../types/category.types";

const initialForm: BrandForm = {
  name: "",
  logo: "",
  description: "",
  displayOrder: 0,
  status: "active",
};

const isBase64Image = (value: string) => {
  return value.startsWith("data:image/");
};

const shortImageText = (value: string) => {
  if (!value) return "";
  if (isBase64Image(value)) return "Base64 image uploaded";
  if (value.length > 90) return `${value.slice(0, 90)}...`;
  return value;
};

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<BrandForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get<ListResponse<Brand>>(
        `/master/get-brands?t=${Date.now()}`
      );

      setBrands(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
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
      setError("Brand name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await backendApi.put(`/master/updateBrandById/${editingId}`, form);
      } else {
        await backendApi.post("/master/create-brand", form);
      }

      resetForm();
      setSearch("");
      setCurrentPage(1);

      await fetchBrands();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save brand");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand._id);

    setForm({
      name: brand.name,
      logo: brand.logo || "",
      description: brand.description || "",
      displayOrder: brand.displayOrder || 0,
      status: brand.status,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to deactivate this brand?"
    );

    if (!confirmDelete) return;

    try {
      await backendApi.delete(`/master/delete-brands/${id}`);
      await fetchBrands();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to deactivate brand");
    }
  };

  const handleViewImage = (image: string | undefined, name: string) => {
    const cleanImage = image?.trim() || "";

    if (!cleanImage) {
      setError("No logo available for this brand");
      return;
    }

    setSelectedImage(cleanImage);
    setSelectedImageName(name);
    setImageLoadError(false);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage("");
    setSelectedImageName("");
    setImageLoadError(false);
    setImageModalOpen(false);
  };

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return brands;

    return brands.filter((brand) => {
      const name = brand.name?.toLowerCase() || "";
      const slug = brand.slug?.toLowerCase() || "";
      const status = brand.status?.toLowerCase() || "";
      const description = brand.description?.toLowerCase() || "";
      const order = String(brand.displayOrder || "");

      return (
        name.includes(q) ||
        slug.includes(q) ||
        status.includes(q) ||
        description.includes(q) ||
        order.includes(q)
      );
    });
  }, [brands, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
  const showingFrom = filteredData.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + rowsPerPage, filteredData.length);

  const activeCount = brands.filter((brand) => brand.status === "active").length;

  const inactiveCount = brands.filter(
    (brand) => brand.status === "inactive"
  ).length;

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
              Brands
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Create grocery brands like Amul, Fortune, Tata, Aashirvaad,
              Daawat and more.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-center shadow-[0_0_24px_rgba(16,185,129,0.12)] backdrop-blur-xl">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-2xl font-black text-white">{brands.length}</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center shadow-[0_0_24px_rgba(16,185,129,0.12)] backdrop-blur-xl">
              <p className="text-xs text-emerald-200">Active</p>
              <p className="text-2xl font-black text-emerald-200">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center shadow-[0_0_24px_rgba(250,204,21,0.10)] backdrop-blur-xl">
              <p className="text-xs text-amber-200">Inactive</p>
              <p className="text-2xl font-black text-amber-200">
                {inactiveCount}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200 shadow-[0_0_28px_rgba(244,63,94,0.12)] backdrop-blur-xl">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl"
        >
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-white">
                {editingId ? "Edit Brand" : "Add Brand"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Add brand name, logo and description.
              </p>
            </div>

            {editingId && (
              <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                Editing Mode
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Brand Name
              </label>
              <input
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                placeholder="Example: Amul"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Logo URL / Base64
              </label>
              <input
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                placeholder="https://logo-url.com or data:image..."
                value={form.logo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, logo: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Description
              </label>
              <input
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                placeholder="Short brand description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Display Order
              </label>
              <input
                type="number"
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    displayOrder: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Status
              </label>
              <select
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as BrandForm["status"],
                  }))
                }
              >
                <option className="bg-[#031C12]" value="active">
                  Active
                </option>
                <option className="bg-[#031C12]" value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] hover:shadow-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Brand"
                : "Add Brand"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold text-white shadow-lg shadow-black/20 transition hover:bg-white/15"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setForm({
                  name: "Premium Brand",
                  logo: "",
                  description: "Premium grocery brand",
                  displayOrder: brands.length + 1,
                  status: "active",
                })
              }
              className="rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 px-6 py-3 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02]"
            >
              Quick Premium Fill
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Brand List</h2>
              <p className="mt-1 text-sm text-slate-400">
                Manage all grocery brands.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto xl:items-center">
              <div className="relative w-full md:w-96">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brand, slug, status..."
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

          <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-black/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-xl">
            <table className="w-full text-left text-sm text-slate-100">
              <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
                <tr>
                  <th className="p-4 font-bold">Logo</th>
                  <th className="p-4 font-bold">Brand</th>
                  <th className="p-4 font-bold">Description</th>
                  <th className="p-4 font-bold">Order</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-400/10">
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading brands...
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginatedData.map((brand) => (
                    <tr
                      key={brand._id}
                      className="transition hover:bg-emerald-400/5"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {brand.logo ? (
                            <img
                              src={brand.logo.trim()}
                              alt={brand.name}
                              className="h-12 w-12 rounded-2xl border border-emerald-400/20 object-cover shadow-[0_0_22px_rgba(16,185,129,0.14)]"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://placehold.co/80x80/031C12/10B981?text=LOGO";
                              }}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xs font-bold text-emerald-200 shadow-[0_0_22px_rgba(16,185,129,0.12)]">
                              LOGO
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleViewImage(brand.logo || "", brand.name)
                            }
                            disabled={!brand.logo}
                            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-slate-500/20 disabled:bg-slate-500/10 disabled:text-slate-500"
                          >
                            View
                          </button>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-white">{brand.name}</p>
                        <p className="text-xs text-slate-500">{brand.slug}</p>
                      </td>

                      <td className="p-4 text-slate-300">
                        {brand.description || "-"}
                      </td>

                      <td className="p-4">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                          #{brand.displayOrder}
                        </span>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={brand.status} />
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(brand)}
                            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeactivate(brand._id)}
                            className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-400/20"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <div className="mx-auto max-w-sm rounded-3xl border border-emerald-400/20 bg-white/5 p-6">
                        <p className="text-lg font-bold text-white">
                          No brands found
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Add your first grocery brand.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
          />
        </section>
      </div>

      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-3xl border border-emerald-400/25 bg-[#031C12]/95 p-5 shadow-[0_0_60px_rgba(16,185,129,0.24)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Brand Logo Preview
                </p>
                <h3 className="mt-1 text-2xl font-black text-white">
                  {selectedImageName}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeImageModal}
                className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-500/20"
              >
                Close
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-black/40 p-4">
              {!imageLoadError ? (
                <img
                  src={selectedImage}
                  alt={selectedImageName}
                  className="max-h-[70vh] w-full rounded-2xl object-contain"
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 p-6 text-center">
                  <p className="text-lg font-black text-amber-200">
                    Logo preview not available
                  </p>

                  {!isBase64Image(selectedImage) && (
                    <a
                      href={selectedImage}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20"
                    >
                      Open URL
                    </a>
                  )}
                </div>
              )}
            </div>

            <p className="mt-3 truncate text-xs text-slate-500">
              {shortImageText(selectedImage)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}