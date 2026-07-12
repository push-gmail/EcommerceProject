import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import backendApi from "../../../api/backendApi";
import type { RootState } from "../../../redux/store";

export type GroceryProduct = {
  id?: string;
  _id: string;
  merchantProductId?: string;

  productName: string;
  title?: string;

  image?: string;
  images?: string[];

  mrp: number;
  price?: number;
  sellingPrice: number;
  discount?: number;
  discountPercent: number;

  quantityInPackets: string;
  unit: string;
  variant?: string;
  pincode: string;

  brandId?: {
    _id: string;
    name?: string;
  };
  brandName?: string;
  brandLogo?: string;

  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  subSubCategoryId?: string;
  subSubCategoryName?: string;
  itemId?: string;
  itemName?: string;

  description?: string;
  specifications?: Record<string, any>;
};

type ApiPagination = {
  page: number;
  limit: number;
  totalProducts: number;
  totalPages: number;
};

type Props = {
  selectedCategoryId?: string;
  selectedSubCategoryId?: string;
  selectedSubSubCategoryId?: string;
  selectedItemId?: string;
  searchValue?: string;
  pageTitle?: string;
  breadcrumbCategory?: string;
  selectedSubCategoryName?: string;
  selectedSubSubCategoryName?: string;
  onAdd?: (product: GroceryProduct) => void;
};

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

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

const getFirstImage = (product: GroceryProduct) => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }

  if (product.image) return product.image;

  return "";
};

const getBrandName = (product: GroceryProduct) => {
  if (product.brandName) return product.brandName;

  if (
    product.brandId &&
    typeof product.brandId === "object" &&
    product.brandId.name
  ) {
    return product.brandId.name;
  }

  return "";
};

const getPrice = (product: GroceryProduct) => {
  return Number(product.sellingPrice || product.price || 0);
};

const getDiscount = (product: GroceryProduct) => {
  return Number(product.discountPercent || product.discount || 0);
};

const getQuantityText = (product: GroceryProduct) => {
  if (product.variant) return product.variant;

  const quantity = String(product.quantityInPackets || "").trim();
  const unit = String(product.unit || "").trim();

  if (!quantity && !unit) return "-";

  if (unit && quantity.toLowerCase().includes(unit.toLowerCase())) {
    return quantity;
  }

  return `${quantity} ${unit}`.trim();
};

export default function GroceryProductListing({
  selectedCategoryId = "",
  selectedSubCategoryId = "",
  selectedSubSubCategoryId = "",
  selectedItemId = "",
  searchValue = "",
  pageTitle = "Grocery",
  breadcrumbCategory = "All Categories",
  selectedSubCategoryName = "",
  selectedSubSubCategoryName = "",
  onAdd,
}: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedPincode = useSelector(
    (state: RootState) => state.groceryLocation.pincode
  );

  const [products, setProducts] = useState<GroceryProduct[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    limit: 12,
    totalProducts: 0,
    totalPages: 1,
  });

  const [localSearch, setLocalSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const urlCategoryId = searchParams.get("categoryId") || "";
  const urlSubCategoryId = searchParams.get("subCategoryId") || "";
  const urlSubSubCategoryId = searchParams.get("subSubCategoryId") || "";
  const urlItemId = searchParams.get("itemId") || "";

  const finalCategoryId = selectedCategoryId || urlCategoryId;
  const finalSubCategoryId = selectedSubCategoryId || urlSubCategoryId;
  const finalSubSubCategoryId = selectedSubSubCategoryId || urlSubSubCategoryId;
  const finalItemId = selectedItemId || urlItemId;

  const effectiveSearch = useMemo(() => {
    return localSearch.trim() || searchValue.trim();
  }, [localSearch, searchValue]);

  const fetchProducts = async () => {
    if (!selectedPincode) {
      setProducts([]);
      setPagination({
        page: 1,
        limit: 12,
        totalProducts: 0,
        totalPages: 1,
      });
      setMessage("Please enter pincode to see available products");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const params: Record<string, string | number> = {
        pincode: selectedPincode,
        page: 1,
        limit: 40,
      };

      if (finalCategoryId) params.categoryId = finalCategoryId;
      if (finalSubCategoryId) params.subCategoryId = finalSubCategoryId;
      if (finalSubSubCategoryId) params.subSubCategoryId = finalSubSubCategoryId;
      if (finalItemId) params.itemId = finalItemId;

      if (effectiveSearch) {
        params.search = effectiveSearch;
      }

      if (sort !== "recommended") {
        params.sort = sort;
      }

      const res = await backendApi.get("/user/shop-products", {
        params,
        skipAuthRefresh: true,
      } as any);

      const payload = res.data?.data || {};

      const nextProducts = Array.isArray(payload.products)
        ? payload.products
        : [];

      const nextPagination = payload.pagination || {
        page: 1,
        limit: 40,
        totalProducts: nextProducts.length,
        totalPages: 1,
      };

      setProducts(nextProducts);

      setPagination({
        page: Number(nextPagination.page || 1),
        limit: Number(nextPagination.limit || 40),
        totalProducts: Number(
          nextPagination.totalProducts ?? nextProducts.length
        ),
        totalPages: Number(nextPagination.totalPages || 1),
      });

      if (nextProducts.length === 0) {
        setMessage(`No products available for pincode ${selectedPincode}`);
      }
    } catch (error: any) {
      console.log("SHOP PRODUCTS FETCH ERROR:", error);

      setProducts([]);
      setPagination({
        page: 1,
        limit: 40,
        totalProducts: 0,
        totalPages: 1,
      });

      setMessage(
        error.response?.data?.message || "Failed to fetch grocery products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    selectedPincode,
    finalCategoryId,
    finalSubCategoryId,
    finalSubSubCategoryId,
    finalItemId,
    sort,
    searchValue,
  ]);

  const visibleProducts = useMemo(() => {
    return products;
  }, [products]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchProducts();
  };

  const handleProductClick = (product: GroceryProduct) => {
    const productId = product._id || product.id || product.merchantProductId;

    if (!productId) return;

    navigate(`/grocery/product/${productId}`);
  };

  return (
    <section className="min-h-[calc(100vh-120px)] bg-white">
      <div className="border-b border-[#f0f0f0] px-4 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-[#878787]">
              <span>Grocery</span>
              <span>›</span>
              <span>{breadcrumbCategory}</span>

              {selectedSubCategoryName && (
                <>
                  <span>›</span>
                  <span>{selectedSubCategoryName}</span>
                </>
              )}

              {selectedSubSubCategoryName && (
                <>
                  <span>›</span>
                  <span>{selectedSubSubCategoryName}</span>
                </>
              )}
            </div>

            <h1 className="text-[18px] font-semibold text-[#212121]">
              {pageTitle}{" "}
              <span className="ml-1 text-[12px] font-normal text-[#878787]">
                {selectedPincode
                  ? loading
                    ? "(Loading products...)"
                    : `(Showing ${visibleProducts.length} products of ${pagination.totalProducts} products for ${selectedPincode})`
                  : "(Enter pincode to view products)"}
              </span>
            </h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <form
              onSubmit={handleSearchSubmit}
              className="flex h-[38px] w-full items-center rounded border border-[#e0e0e0] bg-white px-3 sm:w-[260px]"
            >
              <Search size={17} className="text-[#878787]" />

              <input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search products"
                className="h-full min-w-0 flex-1 px-2 text-[14px] outline-none"
              />
            </form>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-[38px] rounded border border-[#e0e0e0] bg-white px-3 text-[14px] font-semibold outline-none sm:w-[180px]"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low-high">Price Low to High</option>
              <option value="price-high-low">Price High to Low</option>
              <option value="discount">Discount</option>
              <option value="newest">Newest</option>
            </select>

            <button className="flex h-[38px] items-center justify-center gap-2 rounded border border-[#e0e0e0] px-3 text-[14px] font-semibold lg:hidden">
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>
      </div>

      {!selectedPincode && (
        <div className="flex min-h-[360px] items-center justify-center px-4 text-center">
          <div>
            <h2 className="text-[22px] font-semibold text-[#212121]">
              Enter delivery pincode
            </h2>

            <p className="mt-2 text-[14px] text-[#878787]">
              Products will be shown according to your delivery pincode.
            </p>
          </div>
        </div>
      )}

      {selectedPincode && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      )}

      {selectedPincode && !loading && products.length === 0 && (
        <div className="flex min-h-[360px] items-center justify-center px-4 text-center">
          <div>
            <h2 className="text-[22px] font-semibold text-[#212121]">
              No products found
            </h2>

            <p className="mt-2 text-[14px] text-[#878787]">
              {message || `No products available for pincode ${selectedPincode}`}
            </p>
          </div>
        </div>
      )}

      {selectedPincode && !loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">   
          {visibleProducts.map((product) => {
            const productId =
              product._id || product.id || product.merchantProductId;

            const firstImage = getFirstImage(product);
            const brandName = getBrandName(product);
            const price = getPrice(product);
            const discount = getDiscount(product);
            const quantityText = getQuantityText(product);

            return (
              <article
                key={productId}
                onClick={() => handleProductClick(product)}
                className="group min-h-[300px] cursor-pointer border-b border-r border-[#f0f0f0] bg-white p-4 transition hover:shadow-[0_3px_16px_rgba(0,0,0,0.16)]"
              >
                <div className="flex h-[140px] items-center justify-center">
                  {firstImage ? (
                    <img
                      src={toImageSrc(firstImage)}
                      alt={product.productName || product.title || "Product"}
                      className="max-h-[130px] max-w-[180px] object-contain transition group-hover:scale-[1.03]"
                      onError={(event) => {
                        event.currentTarget.src =
                          "https://placehold.co/220x160/f5f5f5/878787?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="flex h-[120px] w-[160px] items-center justify-center bg-[#f5f5f5] text-[#878787]">
                      No Image
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[12px] text-[#b0b0b0]">Sponsored</p>

                <h3 className="mt-1 min-h-[42px] text-[15px] leading-[20px] text-[#212121]">
                  {brandName ? `${brandName} ` : ""}
                  {product.productName || product.title}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[20px] font-semibold text-[#212121]">
                    ₹{price}
                  </span>

                  <span className="text-[14px] text-[#878787] line-through">
                    ₹{product.mrp}
                  </span>

                  <span className="text-[13px] font-semibold text-[#26a541]">
                    {discount}% off
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                    className="h-[42px] rounded border border-[#f0f0f0] text-[14px] font-semibold text-[#212121]"
                  >
                    {quantityText}
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      if (onAdd) {
                        onAdd(product);
                        return;
                      }

                      window.dispatchEvent(
                        new CustomEvent("open-user-login-popup")
                      );
                    }}
                    className="h-[42px] rounded border border-[#f0f0f0] text-[14px] font-semibold text-[#2874f0]"
                  >
                    Add Item
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="min-h-[300px] border-b border-r border-[#f0f0f0] bg-white p-4">
      <div className="mx-auto mt-4 h-[120px] w-[140px] animate-pulse rounded bg-[#f1f3f6]" />
      <div className="mt-5 h-3 w-20 animate-pulse rounded bg-[#f1f3f6]" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#f1f3f6]" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-[#f1f3f6]" />
      <div className="mt-4 h-5 w-32 animate-pulse rounded bg-[#f1f3f6]" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="h-[42px] animate-pulse rounded bg-[#f1f3f6]" />
        <div className="h-[42px] animate-pulse rounded bg-[#f1f3f6]" />
      </div>
    </div>
  );
}