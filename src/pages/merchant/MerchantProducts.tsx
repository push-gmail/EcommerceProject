import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  ImagePlus,
  ListPlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import backendApi from "../../api/backendApi";
import type {
  MerchantProduct,
  MerchantProductForm,
} from "../../types/merchantProduct.types";

interface ListResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

interface Category {
  _id: string;
  name: string;
  status: "active" | "inactive";
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: any;
  status: "active" | "inactive";
}

interface SubSubCategory {
  _id: string;
  name: string;
  categoryId: any;
  subCategoryId: any;
  status: "active" | "inactive";
}

interface Item {
  _id: string;
  name: string;
  categoryId: any;
  subCategoryId: any;
  subSubCategoryId: any;
  status: "active" | "inactive";
}

interface Brand {
  _id: string;
  name: string;
  status: "active" | "inactive";
}

interface SpecRow {
  id: string;
  keyName: string;
  label: string;
  value: string;
  isDefault: boolean;
}

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

const getId = (value: any) => {
  return typeof value === "object" && value?._id ? value._id : value;
};

const getName = (value: any) => {
  return typeof value === "object" && value?.name ? value.name : "-";
};

const toImageSrc = (value?: string) => {
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image") ||
    value.startsWith("blob:")
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

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

const specificationTemplates = [
  { keyName: "weight", label: "Weight" },
  { keyName: "netQuantity", label: "Net Quantity" },
  { keyName: "packSize", label: "Pack Size" },
  { keyName: "productType", label: "Product Type" },
  { keyName: "qualityGrade", label: "Quality Grade" },
  { keyName: "ingredients", label: "Ingredients" },
  { keyName: "shelfLife", label: "Shelf Life" },
  { keyName: "countryOfOrigin", label: "Country Of Origin" },
  { keyName: "storageInstructions", label: "Storage Instructions" },
  { keyName: "vegetarian", label: "Vegetarian" },
  { keyName: "organic", label: "Organic" },
  { keyName: "allergenInfo", label: "Allergen Info" },
  { keyName: "fssaiLicense", label: "FSSAI License" },
  { keyName: "manufacturingDetails", label: "Manufacturing Details" },
  { keyName: "expiryDetails", label: "Expiry Details" },
  { keyName: "flavour", label: "Flavour" },
  { keyName: "purity", label: "Purity" },
  { keyName: "grainType", label: "Grain Type" },
  { keyName: "grainLength", label: "Grain Length" },
  { keyName: "cookingTime", label: "Cooking Time" },
  { keyName: "oilType", label: "Oil Type" },
  { keyName: "fatContent", label: "Fat Content" },
  { keyName: "spiceForm", label: "Spice Form" },
  { keyName: "noAddedColor", label: "No Added Color" },
  { keyName: "preservatives", label: "Preservatives" },
  { keyName: "servingSize", label: "Serving Size" },
  { keyName: "nutritionalInfo", label: "Nutritional Info" },
];

const createDefaultSpecRows = (): SpecRow[] => {
  return specificationTemplates.map((item) => ({
    id: makeId(),
    keyName: item.keyName,
    label: item.label,
    value: "",
    isDefault: true,
  }));
};

const objectToSpecRows = (specifications: Record<string, any>): SpecRow[] => {
  const existingSpecs = specifications || {};
  const usedKeys = new Set<string>();

  const defaultRows = specificationTemplates.map((item) => {
    usedKeys.add(item.keyName);

    return {
      id: makeId(),
      keyName: item.keyName,
      label: item.label,
      value:
        existingSpecs[item.keyName] !== undefined
          ? String(existingSpecs[item.keyName])
          : "",
      isDefault: true,
    };
  });

  const customRows = Object.entries(existingSpecs)
    .filter(([keyName]) => !usedKeys.has(keyName))
    .map(([keyName, value]) => ({
      id: makeId(),
      keyName,
      label: keyName,
      value: String(value),
      isDefault: false,
    }));

  return [...defaultRows, ...customRows];
};

const specRowsToObject = (rows: SpecRow[]) => {
  const specs: Record<string, string> = {};

  rows.forEach((row) => {
    const keyName = row.keyName.trim();
    const value = row.value.trim();

    if (keyName && value) {
      specs[keyName] = value;
    }
  });

  return specs;
};

const initialForm: MerchantProductForm = {
  categoryId: "",
  subCategoryId: "",
  subSubCategoryId: "",
  itemId: "",
  brandId: "",
  productName: "",
  images: [],
  specifications: {},
  packets: 0,
  quantityInPackets: "",
  unit: "",
  mrp: 0,
  sellingPrice: 0,
  discountPercent: 0,
  description: "",
  status: "active",
};

const approvalStyles: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export default function MerchantProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>(
    []
  );
  const [items, setItems] = useState<Item[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<MerchantProduct[]>([]);

  const [form, setForm] = useState<MerchantProductForm>({ ...initialForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [specRows, setSpecRows] = useState<SpecRow[]>(createDefaultSpecRows());

  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewImageName, setPreviewImageName] = useState("");
  const [previewImageError, setPreviewImageError] = useState(false);

  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        categoriesRes,
        subCategoriesRes,
        subSubCategoriesRes,
        itemsRes,
        brandsRes,
        productsRes,
      ] = await Promise.all([
        backendApi.get<ListResponse<Category>>("/master/get-categories"),
        backendApi.get<ListResponse<SubCategory>>("/master/get-sub-categories"),
        backendApi.get<ListResponse<SubSubCategory>>(
          "/master/get-sub-sub-categories"
        ),
        backendApi.get<ListResponse<Item>>("/master/get-items"),
        backendApi.get<ListResponse<Brand>>("/master/get-brands"),
        backendApi.get<ListResponse<MerchantProduct>>("/merchant/my-products"),
      ]);

      setCategories(categoriesRes.data.data || []);
      setSubCategories(subCategoriesRes.data.data || []);
      setSubSubCategories(subSubCategoriesRes.data.data || []);
      setItems(itemsRes.data.data || []);
      setBrands(brandsRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch product data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const filteredSubCategories = useMemo(() => {
    if (!form.categoryId) return [];

    return subCategories.filter((sub) => {
      return (
        String(getId(sub.categoryId)) === form.categoryId &&
        sub.status === "active"
      );
    });
  }, [form.categoryId, subCategories]);

  const filteredSubSubCategories = useMemo(() => {
    if (!form.categoryId || !form.subCategoryId) return [];

    return subSubCategories.filter((subSub) => {
      return (
        String(getId(subSub.categoryId)) === form.categoryId &&
        String(getId(subSub.subCategoryId)) === form.subCategoryId &&
        subSub.status === "active"
      );
    });
  }, [form.categoryId, form.subCategoryId, subSubCategories]);

  const filteredItems = useMemo(() => {
    if (!form.categoryId || !form.subCategoryId || !form.subSubCategoryId) {
      return [];
    }

    return items.filter((item) => {
      return (
        String(getId(item.categoryId)) === form.categoryId &&
        String(getId(item.subCategoryId)) === form.subCategoryId &&
        String(getId(item.subSubCategoryId)) === form.subSubCategoryId &&
        item.status === "active"
      );
    });
  }, [form.categoryId, form.subCategoryId, form.subSubCategoryId, items]);

  const activeBrands = useMemo(() => {
    return brands.filter((brand) => brand.status === "active");
  }, [brands]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !q ||
        product.productName.toLowerCase().includes(q) ||
        getName(product.categoryId).toLowerCase().includes(q) ||
        getName(product.subCategoryId).toLowerCase().includes(q) ||
        getName(product.subSubCategoryId).toLowerCase().includes(q) ||
        getName(product.itemId).toLowerCase().includes(q) ||
        getName(product.brandId).toLowerCase().includes(q) ||
        String(product.pincode || "").toLowerCase().includes(q);

      const matchesApproval = approvalFilter
        ? product.approvalStatus === approvalFilter
        : true;

      return matchesSearch && matchesApproval;
    });
  }, [products, search, approvalFilter]);

  const clearImageFiles = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setImagePreviews([]);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...initialForm });
    setExistingImages([]);
    clearImageFiles();
    setSpecRows(createDefaultSpecRows());
  };

  const handleCategoryChange = (categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryId,
      subCategoryId: "",
      subSubCategoryId: "",
      itemId: "",
    }));
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    setForm((prev) => ({
      ...prev,
      subCategoryId,
      subSubCategoryId: "",
      itemId: "",
    }));
  };

  const handleSubSubCategoryChange = (subSubCategoryId: string) => {
    setForm((prev) => ({
      ...prev,
      subSubCategoryId,
      itemId: "",
    }));
  };

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter((file) => {
      const validType = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ].includes(file.type);

      const validSize = file.size <= 5 * 1024 * 1024;

      return validType && validSize;
    });

    if (files.length !== validFiles.length) {
      setError("Only JPG, JPEG, PNG, WEBP images under 5MB are allowed");
      setSuccess("");
    }

    const remainingSlots = Math.max(0, 10 - existingImages.length);
    const nextFiles = validFiles.slice(0, remainingSlots);

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));

    setImages(nextFiles);
    setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));

    event.target.value = "";
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));

    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!form.categoryId) return "Category is required";
    if (!form.subCategoryId) return "Sub category is required";
    if (!form.subSubCategoryId) return "Sub-sub category is required";
    if (!form.itemId) return "Item is required";
    if (!form.brandId) return "Brand is required";
    if (!form.productName.trim()) return "Product name is required";

    if (Number(form.packets) < 0) {
      return "Packets cannot be negative";
    }

    if (!form.quantityInPackets.trim()) {
      return "Quantity in packets is required";
    }

    if (!form.unit.trim()) return "Unit is required";

    if (Number(form.mrp) <= 0) return "MRP must be greater than 0";

    if (Number(form.sellingPrice) <= 0) {
      return "Selling price must be greater than 0";
    }

    if (Number(form.sellingPrice) > Number(form.mrp)) {
      return "Selling price cannot be greater than MRP";
    }

    if (!editingId && images.length === 0) {
      return "Please upload at least one product image";
    }

    if (editingId && existingImages.length === 0 && images.length === 0) {
      return "Please keep or upload at least one product image";
    }

    return "";
  };

  const buildFormData = () => {
    const formData = new FormData();

    formData.append("categoryId", form.categoryId);
    formData.append("subCategoryId", form.subCategoryId);
    formData.append("subSubCategoryId", form.subSubCategoryId);
    formData.append("itemId", form.itemId);
    formData.append("brandId", form.brandId);

    formData.append("productName", form.productName.trim());
    formData.append("packets", String(Number(form.packets) || 0));
    formData.append("quantityInPackets", form.quantityInPackets.trim());
    formData.append("unit", form.unit.trim());

    formData.append("mrp", String(Number(form.mrp) || 0));
    formData.append("sellingPrice", String(Number(form.sellingPrice) || 0));
    formData.append(
      "discountPercent",
      String(Number(form.discountPercent) || 0)
    );

    formData.append("description", form.description || "");
    formData.append("status", form.status || "active");

    formData.append(
      "specifications",
      JSON.stringify(form.specifications || {})
    );

    if (editingId) {
      formData.append("existingImages", JSON.stringify(existingImages));
    }

    images.forEach((image) => {
      formData.append("images", image);
    });

    return formData;
  };

  const handleSubmitProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = buildFormData();

      if (editingId) {
        const res = await backendApi.put(
          `/merchant/update-product/${editingId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setSuccess(res.data?.message || "Product updated successfully");
      } else {
        const res = await backendApi.post("/merchant/create-product", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setSuccess(res.data?.message || "Product submitted successfully");
      }

      resetForm();
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: MerchantProduct) => {
    const productImages = Array.isArray(product.images) ? product.images : [];
    const specs =
      product.specifications &&
      typeof product.specifications === "object" &&
      !Array.isArray(product.specifications)
        ? product.specifications
        : {};

    setEditingId(product._id);

    setForm({
      categoryId: String(getId(product.categoryId)),
      subCategoryId: String(getId(product.subCategoryId)),
      subSubCategoryId: String(getId(product.subSubCategoryId)),
      itemId: String(getId(product.itemId)),
      brandId: String(getId(product.brandId)),
      productName: product.productName || "",
      images: productImages,
      specifications: specs,
      packets: product.packets || 0,
      quantityInPackets: product.quantityInPackets || "",
      unit: product.unit || "",
      mrp: product.mrp || 0,
      sellingPrice: product.sellingPrice || 0,
      discountPercent: product.discountPercent || 0,
      description: product.description || "",
      status: product.status || "active",
    });

    setExistingImages(productImages);
    clearImageFiles();
    setSpecRows(objectToSpecRows(specs));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");

      const res = await backendApi.delete(`/merchant/delete-product/${id}`);

      setSuccess(res.data?.message || "Product deleted successfully");
      await fetchData();

      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const openPreviewImage = (imageUrl: string, productName: string) => {
    if (!imageUrl) {
      setError("No image available for this product");
      return;
    }

    setPreviewImage(toImageSrc(imageUrl));
    setPreviewImageName(productName);
    setPreviewImageError(false);
    setPreviewImageOpen(true);
  };

  const closePreviewImage = () => {
    setPreviewImage("");
    setPreviewImageName("");
    setPreviewImageError(false);
    setPreviewImageOpen(false);
  };

  const openSpecModal = () => {
    setSpecRows(objectToSpecRows(form.specifications || {}));
    setSpecModalOpen(true);
  };

  const addCustomSpecRow = () => {
    setSpecRows((prev) => [
      ...prev,
      {
        id: makeId(),
        keyName: "",
        label: "",
        value: "",
        isDefault: false,
      },
    ]);
  };

  const updateSpecRow = (
    id: string,
    field: "keyName" | "value",
    value: string
  ) => {
    setSpecRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeSpecRow = (id: string) => {
    setSpecRows((prev) => {
      const next = prev.filter((row) => row.id !== id);
      return next.length ? next : createDefaultSpecRows();
    });
  };

  const saveSpecifications = () => {
    setForm((prev) => ({
      ...prev,
      specifications: specRowsToObject(specRows),
    }));

    setSpecModalOpen(false);
  };

  const pendingCount = products.filter(
    (product) => product.approvalStatus === "pending"
  ).length;

  const approvedCount = products.filter(
    (product) => product.approvalStatus === "approved"
  ).length;

  const rejectedCount = products.filter(
    (product) => product.approvalStatus === "rejected"
  ).length;

  const imageCount = existingImages.length + images.length;
  const specCount = Object.keys(form.specifications || {}).length;

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
              Merchant Product Center
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-4xl font-black text-transparent">
                Products
              </h1>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Add or update products with multiple uploaded images. Product
              pincode will be assigned automatically from your merchant profile.
              After submit, product will go to master approval.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <StatCard title="Total" value={products.length} />
            <StatCard title="Pending" value={pendingCount} tone="amber" />
            <StatCard title="Approved" value={approvedCount} tone="emerald" />
            <StatCard title="Rejected" value={rejectedCount} tone="rose" />
          </div>
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

      <form
        onSubmit={handleSubmitProduct}
        className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl"
      >
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 className="text-2xl font-black">
              {editingId ? "Edit Product" : "Add Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Merchant delivery pincode is fixed by master admin and will be
              added automatically by backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openSpecModal}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
            >
              <ListPlus size={17} />
              Add Specifications
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs">
                {specCount}
              </span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-500/20"
              >
                <X size={17} />
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <FieldSelect
            label="Category"
            value={form.categoryId}
            onChange={handleCategoryChange}
            options={categories.filter((c) => c.status === "active")}
            placeholder="Select Category"
          />

          <FieldSelect
            label="Sub Category"
            value={form.subCategoryId}
            onChange={handleSubCategoryChange}
            options={filteredSubCategories}
            placeholder="Select Sub Category"
            disabled={!form.categoryId}
          />

          <FieldSelect
            label="Sub-Sub Category"
            value={form.subSubCategoryId}
            onChange={handleSubSubCategoryChange}
            options={filteredSubSubCategories}
            placeholder="Select Sub-Sub Category"
            disabled={!form.subCategoryId}
          />

          <FieldSelect
            label="Item"
            value={form.itemId}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, itemId: value }))
            }
            options={filteredItems}
            placeholder="Select Item"
            disabled={!form.subSubCategoryId}
          />

          <FieldSelect
            label="Brand"
            value={form.brandId}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, brandId: value }))
            }
            options={activeBrands}
            placeholder="Select Brand"
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldInput
            label="Product Name"
            value={form.productName}
            placeholder="Daawat Basmati Rice 1kg"
            onChange={(value) =>
              setForm((prev) => ({ ...prev, productName: value }))
            }
          />

          <FieldInput
            label="Packets"
            type="number"
            value={form.packets}
            placeholder="Example: 50"
            onChange={(value) =>
              setForm((prev) => ({ ...prev, packets: Number(value) }))
            }
          />

          <FieldInput
            label="Quantity In Packets"
            value={form.quantityInPackets}
            placeholder="Example: 1kg, 500g, 1ltr"
            onChange={(value) =>
              setForm((prev) => ({ ...prev, quantityInPackets: value }))
            }
          />

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Unit
            </label>

            <select
              value={form.unit}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, unit: e.target.value }))
              }
              className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 outline-none"
            >
              <option className="bg-[#031C12]" value="">
                Select Unit
              </option>

              {["kg", "g", "ltr", "ml", "piece", "pack"].map((unit) => (
                <option className="bg-[#031C12]" value={unit} key={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <FieldInput
            label="MRP"
            type="number"
            value={form.mrp}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, mrp: Number(value) }))
            }
          />

          <FieldInput
            label="Selling Price"
            type="number"
            value={form.sellingPrice}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, sellingPrice: Number(value) }))
            }
          />

          <FieldInput
            label="Discount %"
            type="number"
            value={form.discountPercent}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, discountPercent: Number(value) }))
            }
          />

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as MerchantProductForm["status"],
                }))
              }
              className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 outline-none"
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

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Description
          </label>

          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Product description"
            className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 outline-none"
          />
        </div>

        <div className="mt-5 space-y-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <div className="flex items-center gap-2">
            <ImagePlus size={18} className="text-cyan-200" />
            <label className="text-sm font-black text-cyan-100">
              Product Images
            </label>
          </div>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImagesChange}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-500/20 file:px-4 file:py-2 file:text-emerald-100"
          />

          <p className="text-xs text-white/45">
            Upload up to 10 images. JPG, PNG, WEBP only. Max 5MB each.
          </p>

          {existingImages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-white/50">
                Existing Images
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {existingImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2"
                  >
                    <img
                      src={toImageSrc(src)}
                      alt={`Existing ${index + 1}`}
                      className="h-28 w-full rounded-xl object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-white/50">
                New Images
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {imagePreviews.map((src, index) => (
                  <div
                    key={src}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2"
                  >
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="h-28 w-full rounded-xl object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-sm font-black text-cyan-100">
              Images Added: {imageCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Uploaded images will be shown on user product details after
              approval.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
            <p className="text-sm font-black text-amber-100">
              Specifications Added: {specCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Click Add Specifications to add grocery product details.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}

            {saving
              ? "Submitting..."
              : editingId
              ? "Update Product"
              : "Submit Product"}
          </button>
        </div>
      </form>

      <section className="rounded-[2rem] border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.14)] backdrop-blur-2xl">
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 className="text-2xl font-black">My Products</h2>

            <p className="mt-1 text-sm text-slate-400">
              Manage product details and approval status.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 outline-none"
            >
              <option className="bg-[#031C12]" value="">
                All Approval
              </option>

              <option className="bg-[#031C12]" value="pending">
                Pending
              </option>

              <option className="bg-[#031C12]" value="approved">
                Approved
              </option>

              <option className="bg-[#031C12]" value="rejected">
                Rejected
              </option>
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, pincode, category..."
              className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 outline-none md:w-96"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-emerald-400/20 bg-black/30">
          <table className="w-full min-w-[1600px] text-left text-sm">
            <thead className="border-b border-emerald-400/10 bg-emerald-500/10 text-cyan-100">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Product</th>
                <th className="p-4">Category Path</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Packets</th>
                <th className="p-4">Quantity In Packets</th>
                <th className="p-4">Pincode</th>
                <th className="p-4">Price</th>
                <th className="p-4">Approval</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-400/10">
              {loading && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Loading products...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredProducts.map((product) => {
                  const firstImage =
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]
                      : "";

                  return (
                    <tr
                      key={product._id}
                      className="transition hover:bg-emerald-400/5"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {firstImage ? (
                            <img
                              src={toImageSrc(firstImage)}
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

                          <button
                            type="button"
                            disabled={!firstImage}
                            onClick={() =>
                              openPreviewImage(firstImage, product.productName)
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                            title="View Image"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
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

                      <td className="p-4 font-bold">
                        {getName(product.brandId)}
                      </td>

                      <td className="p-4">
                        <p className="font-black text-white">
                          {product.packets}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-200">
                          {product.quantityInPackets}
                        </p>

                        <p className="text-xs text-slate-500">
                          Unit: {product.unit}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-cyan-100">
                          {product.pincode || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Merchant area
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="text-slate-300">MRP: ₹{product.mrp}</p>

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
                            approvalStyles[product.approvalStatus] ||
                            approvalStyles.pending
                          }`}
                        >
                          {product.approvalStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold">
                          {product.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                            title="Edit Product"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product._id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {specModalOpen &&
        createPortal(
          <SpecModal
            specRows={specRows}
            onClose={() => setSpecModalOpen(false)}
            onAdd={addCustomSpecRow}
            onUpdate={updateSpecRow}
            onRemove={removeSpecRow}
            onSave={saveSpecifications}
          />,
          document.body
        )}

      {previewImageOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-4xl rounded-[2rem] border border-emerald-400/25 bg-[#031C12]/95 p-6 text-white shadow-[0_0_70px_rgba(16,185,129,0.22)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                    Product Image Preview
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    {previewImageName}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closePreviewImage}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-black/40 p-4">
                {!previewImageError ? (
                  <img
                    src={previewImage}
                    alt={previewImageName}
                    className="max-h-[70vh] w-full rounded-2xl object-contain"
                    onError={() => setPreviewImageError(true)}
                  />
                ) : (
                  <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 p-6 text-center">
                    <p className="text-lg font-black text-amber-200">
                      Image preview not available
                    </p>

                    <p className="mt-2 max-w-xl break-all text-xs text-slate-400">
                      {previewImage}
                    </p>

                    <a
                      href={previewImage}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 px-5 py-3 text-sm font-black text-slate-950"
                    >
                      Open Image URL
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function StatCard({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: number;
  tone?: "default" | "amber" | "emerald" | "rose";
}) {
  const styles = {
    default: "border-white/10 bg-black/30 text-white",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${styles[tone]}`}>
      <p className="text-xs opacity-80">{title}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 outline-none"
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ _id: string; name: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 outline-none disabled:opacity-50"
      >
        <option className="bg-[#031C12]" value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option className="bg-[#031C12]" key={option._id} value={option._id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function SpecModal({
  specRows,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
  onSave,
}: {
  specRows: SpecRow[];
  onClose: () => void;
  onAdd: () => void;
  onUpdate: (id: string, field: "keyName" | "value", value: string) => void;
  onRemove: (id: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-5xl rounded-[2rem] border border-amber-400/25 bg-[#031C12]/95 p-6 text-white shadow-[0_0_60px_rgba(251,191,36,0.16)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
              Product Specifications
            </p>

            <h3 className="mt-1 text-2xl font-black">Add Specifications</h3>

            <p className="mt-1 text-xs text-slate-400">
              Fill only needed fields. Empty fields will not be saved.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-3 md:grid-cols-2">
            {specRows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                {row.isDefault ? (
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-amber-200">
                    {row.label}
                  </label>
                ) : (
                  <input
                    value={row.keyName}
                    onChange={(e) =>
                      onUpdate(row.id, "keyName", e.target.value)
                    }
                    placeholder="Custom key, example: aroma"
                    className="mb-2 w-full rounded-xl border border-amber-400/20 bg-black/35 px-4 py-3 text-sm outline-none"
                  />
                )}

                <div className="flex gap-3">
                  <input
                    value={row.value}
                    onChange={(e) => onUpdate(row.id, "value", e.target.value)}
                    placeholder={`Enter ${row.label || "value"}`}
                    className="flex-1 rounded-xl border border-amber-400/20 bg-black/35 px-4 py-3 text-sm outline-none"
                  />

                  {!row.isDefault && (
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100"
          >
            <Plus size={16} />
            Add Custom Field
          </button>

          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 px-6 py-3 text-sm font-black text-slate-950"
          >
            <Save size={16} />
            Save Specifications
          </button>
        </div>
      </div>
    </div>
  );
}