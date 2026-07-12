import {  useEffect, useMemo, useState } from "react";

import type { FormEvent } from "react";
import backendApi from "../../api/backendApi";
import StatusBadge from "../../components/master/StatusBadge";
import type {
  Category,
  CategoryForm,
  CategoryListResponse,
} from "../../types/category.types";

const initialForm: CategoryForm = {
  name: "",
  image: "",
  displayOrder: 0,
  status: "active",
};

const getImageSrc = (image?: string) => {
  if (!image) return "";

  const cleanImage = image.trim();

  if (!cleanImage) return "";

  if (
    cleanImage.startsWith("http://") ||
    cleanImage.startsWith("https://") ||
    cleanImage.startsWith("data:image/")
  ) {
    return cleanImage;
  }

  if (cleanImage.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${cleanImage}`;
  }

  if (cleanImage.startsWith("iVBOR")) {
    return `data:image/png;base64,${cleanImage}`;
  }

  if (cleanImage.startsWith("UklGR")) {
    return `data:image/webp;base64,${cleanImage}`;
  }

  return cleanImage;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get<CategoryListResponse>(
        "/master/get-categories"
      );

      setCategories(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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
      setError("Category name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await backendApi.put(`/master/updateCategoryById/${editingId}`, form);
      } else {
        await backendApi.post("/master/create-category", form);
      }

      resetForm();
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category._id);

    setForm({
      name: category.name,
      image: category.image || "",
      displayOrder: category.displayOrder || 0,
      status: category.status,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to deactivate this category?"
    );

    if (!confirmDelete) return;

    try {
      await backendApi.delete(`/master/deleteCategoryById/${id}`);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to deactivate category");
    }
  };

  const handleViewImage = (image: string, name: string) => {
    const imageSrc = getImageSrc(image);

    if (!imageSrc) {
      setError("No image available for this category");
      return;
    }

    setSelectedImage(imageSrc);
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

  const filteredCategories = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return categories;

    return categories.filter((category) => {
      const name = category.name?.toLowerCase() || "";
      const slug = category.slug?.toLowerCase() || "";
      const status = category.status?.toLowerCase() || "";
      const order = String(category.displayOrder || "");

      return (
        name.includes(searchText) ||
        slug.includes(searchText) ||
        status.includes(searchText) ||
        order.includes(searchText)
      );
    });
  }, [categories, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / rowsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const showingFrom = filteredCategories.length === 0 ? 0 : startIndex + 1;

  const showingTo = Math.min(endIndex, filteredCategories.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  const activeCount = categories.filter(
    (category) => category.status === "active"
  ).length;

  const inactiveCount = categories.filter(
    (category) => category.status === "inactive"
  ).length;

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_35%),linear-gradient(135deg,#020617,#031C12,#052E16)] p-5 text-slate-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-36 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col justify-between gap-5 rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.16)] backdrop-blur-2xl md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
              Emerald Command Center
            </div>

            <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Create and manage top-level grocery categories like Staples,
              Dairy, Snacks, Beverages, Fruits, Vegetables and Home Care.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-center shadow-[0_0_24px_rgba(16,185,129,0.12)] backdrop-blur-xl">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-2xl font-black text-white">
                {categories.length}
              </p>
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
        </div>

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
                {editingId ? "Edit Category" : "Add Category"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Master creates the main grocery category structure here.
              </p>
            </div>

            {editingId && (
              <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                Editing Mode
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Category Name
              </label>
              <input
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                placeholder="Example: Staples"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Image URL / Base64
              </label>
              <input
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                placeholder="https://image-url.com or base64 image"
                value={form.image}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, image: e.target.value }))
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
                    status: e.target.value as CategoryForm["status"],
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

          {form.image && (
            <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-black/25 p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Image Preview
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={getImageSrc(form.image)}
                  alt={form.name || "Category preview"}
                  className="h-20 w-20 rounded-2xl border border-emerald-400/20 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/120x120/031C12/10B981?text=IMG";
                  }}
                />

                <p className="max-w-xl text-sm text-slate-400">
                  Image will be shown in the category list after save.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] hover:shadow-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Category"
                : "Add Category"}
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
                  name: "Premium Grocery",
                  image: "",
                  displayOrder: categories.length + 1,
                  status: "active",
                })
              }
              className="rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 px-6 py-3 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02]"
            >
              Quick Premium Fill
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
          <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-2xl font-black text-white">
                Category List
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Manage all top-level grocery categories.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto xl:items-center">
              <div className="relative w-full md:w-96">
                <input
                  className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 pr-24 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  placeholder="Search by name, slug, status or order..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                className="rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
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
                <option className="bg-[#031C12]" value={50}>
                  50 / page
                </option>
              </select>
            </div>
          </div>

          {search && (
            <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              Search result for{" "}
              <span className="font-black text-white">"{search}"</span>:{" "}
              <span className="font-black">{filteredCategories.length}</span>{" "}
              categories found.
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-black/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] backdrop-blur-xl">
            <table className="w-full text-left text-sm text-slate-100">
              <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
                <tr>
                  <th className="p-4 font-bold">Image</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-400/10">
                {loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      Loading categories...
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginatedCategories.map((category) => {
                    const imageSrc = getImageSrc(category.image || "");

                    return (
                      <tr
                        key={category._id}
                        className="transition hover:bg-emerald-400/5"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={category.name}
                                className="h-12 w-12 rounded-2xl border border-emerald-400/20 object-cover shadow-[0_0_22px_rgba(16,185,129,0.14)]"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://placehold.co/80x80/031C12/10B981?text=IMG";
                                }}
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xs font-bold text-emerald-200 shadow-[0_0_22px_rgba(16,185,129,0.12)]">
                                IMG
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleViewImage(
                                  category.image || "",
                                  category.name
                                )
                              }
                              disabled={!imageSrc}
                              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 hover:shadow-[0_0_18px_rgba(16,185,129,0.16)] disabled:cursor-not-allowed disabled:border-slate-500/20 disabled:bg-slate-500/10 disabled:text-slate-500"
                            >
                              View
                            </button>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-white">
                            {category.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Grocery master category
                          </p>
                        </td>

                        <td className="p-4">
                          <StatusBadge status={category.status} />
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(category)}
                              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20 hover:shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeactivate(category._id)}
                              className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-400/20 hover:shadow-[0_0_18px_rgba(244,63,94,0.16)]"
                            >
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      <div className="mx-auto max-w-sm rounded-3xl border border-emerald-400/20 bg-white/5 p-6">
                        <p className="text-lg font-bold text-white">
                          No categories found
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Try a different search or add your first grocery
                          category.
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
              <span className="font-bold text-emerald-300">
                {showingFrom}
              </span>{" "}
              to{" "}
              <span className="font-bold text-emerald-300">{showingTo}</span>{" "}
              of{" "}
              <span className="font-bold text-emerald-300">
                {filteredCategories.length}
              </span>{" "}
              filtered categories
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
                className="rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="rounded-xl border border-emerald-400/20 bg-black/30 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10"
                  >
                    1
                  </button>
                  <span className="px-1 text-xs text-slate-500">...</span>
                </>
              )}

              {pageNumbers.map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    page === safeCurrentPage
                      ? "bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "border border-emerald-400/20 bg-black/30 text-emerald-100 hover:bg-emerald-400/10"
                  }`}
                >
                  {page}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  <span className="px-1 text-xs text-slate-500">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="rounded-xl border border-emerald-400/20 bg-black/30 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end text-xs text-slate-500">
            <p className="text-emerald-300">
              Emerald Command Center · Category Control
            </p>
          </div>
        </div>
      </div>

      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-3xl border border-emerald-400/25 bg-[#031C12]/95 p-5 shadow-[0_0_60px_rgba(16,185,129,0.24)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Category Image Preview
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
                    Image preview not available
                  </p>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                    This URL is probably not a direct image URL. Use a direct
                    image URL ending with .jpg, .jpeg, .png, .webp, or upload
                    the image to Cloudinary.
                  </p>

                  <a
                    href={selectedImage}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20"
                  >
                    Open URL
                  </a>
                </div>
              )}
            </div>

            <p className="mt-3 truncate text-xs text-slate-500">
              {selectedImage.startsWith("data:image/")
                ? "Base64 image loaded successfully"
                : selectedImage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}