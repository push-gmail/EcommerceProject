import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  Loader2,
  Search,
  Send,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useSelector } from "react-redux";
import backendApi from "../../api/backendApi";
import type { RootState } from "../../redux/store";
import { emitGroceryCartChanged } from "../../utils/groceryCartEvents";

type MerchantInfo = {
  _id: string;
  merchantId?: string;
  name?: string;
  email?: string;
  phone?: string;
  shopName?: string;
  status?: string;
};

type ProductDetails = {
  _id: string;
  id?: string;
  title?: string;
  productName?: string;
  itemName?: string;
  brandName?: string;
  brandLogo?: string;
  images?: string[];
  image?: string;
  price?: number;
  sellingPrice?: number;
  mrp?: number;
  discount?: number;
  discountPercent?: number;
  packets?: number;
  totalPackets?: number;
  quantityInPackets?: string;
  unit?: string;
  variant?: string;
  description?: string;
  specifications?: Record<string, any>;
  categoryName?: string;
  subCategoryName?: string;
  subSubCategoryName?: string;
  merchant?: MerchantInfo | null;
  merchantId?: string;
  merchantName?: string;
  shopName?: string;
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

const getProductTitle = (product?: ProductDetails | null) => {
  if (!product) return "";

  return (
    product.title ||
    product.productName ||
    `${product.brandName || ""} ${product.itemName || ""}`.trim() ||
    "Product"
  );
};

const getPrice = (product?: ProductDetails | null) => {
  if (!product) return 0;
  return Number(product.price || product.sellingPrice || 0);
};

const getMrp = (product?: ProductDetails | null) => {
  if (!product) return 0;
  return Number(product.mrp || 0);
};

const getDiscount = (product?: ProductDetails | null) => {
  if (!product) return 0;
  return Number(product.discount || product.discountPercent || 0);
};

const getVariant = (product?: ProductDetails | null) => {
  if (!product) return "-";

  if (product.variant) return product.variant;

  const q = String(product.quantityInPackets || "").trim();
  const u = String(product.unit || "").trim();

  if (!q && !u) return "-";

  if (q && u && q.toLowerCase().includes(u.toLowerCase())) {
    return q;
  }

  return `${q} ${u}`.trim();
};

const getImages = (product?: ProductDetails | null) => {
  if (!product) return [];

  const images = Array.isArray(product.images) ? product.images : [];

  if (images.length > 0) {
    return images.map(toImageSrc).filter(Boolean);
  }

  if (product.image) {
    return [toImageSrc(product.image)].filter(Boolean);
  }

  if (product.brandLogo) {
    return [toImageSrc(product.brandLogo)].filter(Boolean);
  }

  return [];
};

const normalizeSpecifications = (product?: ProductDetails | null) => {
  const specs = product?.specifications || {};

  const entries = Object.entries(specs).filter(([key, value]) => {
    return key && value !== undefined && value !== null && String(value).trim();
  });

  const fallbackEntries: [string, any][] = [];

  if (product?.brandName) fallbackEntries.push(["Brand", product.brandName]);
  if (product?.itemName) fallbackEntries.push(["Model Name", product.itemName]);

  if (getVariant(product) !== "-") {
    fallbackEntries.push(["Quantity", getVariant(product)]);
  }

  if (product?.categoryName) fallbackEntries.push(["Category", product.categoryName]);
  if (product?.subCategoryName) fallbackEntries.push(["Sub Category", product.subCategoryName]);
  if (product?.subSubCategoryName) fallbackEntries.push(["Type", product.subSubCategoryName]);

  if (product?.packets || product?.totalPackets) {
    fallbackEntries.push([
      "Available Packets",
      product.totalPackets || product.packets,
    ]);
  }

  const finalEntries = entries.length > 0 ? entries : fallbackEntries;

  return finalEntries.map(([label, value]) => ({
    label,
    value: String(value),
  }));
};

export default function UserProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const selectedPincode = useSelector(
    (state: RootState) => state.groceryLocation.pincode
  );

  const cleanSelectedPincode = String(selectedPincode || "")
    .replace(/\D/g, "")
    .slice(0, 6);

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [error, setError] = useState("");

  const images = useMemo(() => getImages(product), [product]);
  const title = getProductTitle(product);
  const price = getPrice(product);
  const mrp = getMrp(product);
  const discount = getDiscount(product);
  const variant = getVariant(product);

  const specifications = useMemo(
    () => normalizeSpecifications(product),
    [product]
  );

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await backendApi.get(`/user/shop-products/${id}`);
      const data = response.data?.data || null;

      setProduct(data);

      const productImages = getImages(data);
      setSelectedImage(productImages[0] || "");
    } catch (err: any) {
      console.log("PRODUCT DETAILS ERROR:", err);
      setError(err.response?.data?.message || "Product not found");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbCartQuantity = async () => {
    try {
      const response = await backendApi.get("/user/cart", {
        withCredentials: true,
      });

      const items = response.data?.data?.items || [];
      const found = items.find((item: any) => item.productId === product?._id);

      setCartQuantity(found?.quantity || 0);
    } catch {
      setCartQuantity(0);
    }
  };

  useEffect(() => {
    if (id) fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (product?._id) fetchDbCartQuantity();
  }, [product?._id]);

  const addProductToDbCart = async (quantity = 1) => {
    if (!product?._id) return;

    if (!/^[1-9][0-9]{5}$/.test(cleanSelectedPincode)) {
      alert("Please select delivery pincode first");
      return;
    }

    try {
      setAddingCart(true);

      const response = await backendApi.post(
        "/user/cart/add",
        {
          productId: product._id,
          quantity,
          pincode: cleanSelectedPincode,
        },
        {
          withCredentials: true,
        }
      );

      const items = response.data?.data?.items || [];
      const found = items.find((item: any) => item.productId === product._id);

      setCartQuantity(found?.quantity || 0);
      emitGroceryCartChanged();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add item to cart");
    } finally {
      setAddingCart(false);
    }
  };

  const updateCartQuantity = async (nextQuantity: number) => {
    if (!product?._id) return;

    try {
      setAddingCart(true);

      const cartResponse = await backendApi.get("/user/cart", {
        withCredentials: true,
      });

      const items = cartResponse.data?.data?.items || [];
      const found = items.find((item: any) => item.productId === product._id);

      if (!found) {
        await addProductToDbCart(1);
        return;
      }

      if (nextQuantity < 1) {
        await backendApi.delete(`/user/cart/items/${found._id}`, {
          withCredentials: true,
        });

        setCartQuantity(0);
        emitGroceryCartChanged();
        return;
      }

      const response = await backendApi.patch(
        `/user/cart/items/${found._id}`,
        {
          quantity: nextQuantity,
        },
        {
          withCredentials: true,
        }
      );

      const updatedItems = response.data?.data?.items || [];
      const updatedFound = updatedItems.find(
        (item: any) => item.productId === product._id
      );

      setCartQuantity(updatedFound?.quantity || 0);
      emitGroceryCartChanged();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update cart");
    } finally {
      setAddingCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f3f6] text-[#212121]">
        <div className="flex items-center gap-3 text-[15px] font-semibold">
          <Loader2 className="animate-spin" size={20} />
          Loading product details...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f1f3f6] px-4 text-center text-[#212121]">
        <p className="text-xl font-semibold">{error || "Product not found"}</p>

        <button
          type="button"
          onClick={() => navigate("/grocery")}
          className="mt-4 rounded bg-[#26a541] px-5 py-2 text-sm font-semibold text-white"
        >
          Back to grocery
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-[#212121]">
      <header className="sticky top-0 z-50 border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1180px] items-center gap-5 px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f5]"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/grocery")}
            className="flex h-[40px] items-center gap-2 rounded-lg bg-[#a84f00] px-5 text-sm font-bold text-white"
          >
            🛒 Grocery
            <ChevronDown size={15} />
          </button>

          <div className="flex h-[44px] flex-1 items-center gap-2 rounded-xl border-2 border-[#f5a623] bg-white px-4">
            <Search size={20} className="text-[#616161]" />

            <input
              placeholder="Search grocery products in Supermart"
              className="h-full w-full bg-transparent text-[15px] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate("/grocery/cart")}
            className="relative flex items-center gap-2 text-sm text-[#212121]"
          >
            <ShoppingCart size={22} />
            Cart
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] bg-white">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[58%_42%]">
          <section className="bg-white p-4">
            {images.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`relative flex min-h-[345px] items-center justify-center rounded-xl bg-[#f3f3f3] p-4 transition ${
                      selectedImage === image
                        ? "ring-2 ring-[#2874f0]"
                        : "hover:ring-1 hover:ring-[#d7d7d7]"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${title} ${index + 1}`}
                      className="max-h-[320px] max-w-full object-contain"
                    />

                    {index === 0 && (
                      <span className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-xl bg-white shadow">
                        <Send size={20} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[520px] items-center justify-center rounded-xl bg-[#f3f3f3] text-[#878787]">
                No images available
              </div>
            )}
          </section>

          <aside className="bg-white px-5 py-5">
            <h1 className="text-[18px] font-medium leading-7 text-[#424242]">
              {title}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#f0f0f0] px-2 py-1 text-sm font-semibold text-[#212121]">
                4.2
                <Star size={13} fill="#008c45" strokeWidth={0} />
              </span>

              <span className="text-sm text-[#878787]">188</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-[#ffe500] px-2 py-1 text-[32px] font-black leading-none text-[#212121]">
                ₹{price}
              </span>

              {mrp > price && (
                <span className="rounded-md border border-[#d7d7d7] px-2 py-1 text-[22px] text-[#878787] line-through">
                  ₹{mrp}
                </span>
              )}

              {discount > 0 && (
                <span className="text-[28px] font-black text-[#008c45]">
                  {discount}% OFF
                </span>
              )}
            </div>

            <div className="mt-8">
              <p className="text-[17px] font-semibold">
                Selected Quantity:{" "}
                <span className="font-normal text-[#424242]">{variant}</span>
              </p>

              <button className="mt-5 rounded-xl bg-[#212121] px-5 py-3 text-lg font-bold text-white">
                {variant}
              </button>

              {price > 0 && variant !== "-" && (
                <p className="mt-2 text-sm text-[#878787]">
                  ₹{price}/{variant}
                </p>
              )}

              <div className="mt-6">
                {cartQuantity <= 0 ? (
                  <button
                    type="button"
                    disabled={addingCart}
                    onClick={() => addProductToDbCart(1)}
                    className="h-12 min-w-[170px] rounded-xl border border-[#26a541] bg-white px-6 text-[15px] font-bold uppercase text-[#26a541] shadow-sm transition hover:bg-[#f1fff4] disabled:opacity-60"
                  >
                    {addingCart ? "Adding..." : "Add Item"}
                  </button>
                ) : (
                  <div className="flex h-12 w-[170px] items-center justify-between overflow-hidden rounded-xl border border-[#26a541] bg-[#26a541] text-white shadow-sm">
                    <button
                      type="button"
                      disabled={addingCart}
                      onClick={() => updateCartQuantity(cartQuantity - 1)}
                      className="h-full w-12 text-2xl font-bold transition hover:bg-black/10 disabled:opacity-60"
                    >
                      -
                    </button>

                    <span className="flex-1 text-center text-[16px] font-black">
                      {cartQuantity}
                    </span>

                    <button
                      type="button"
                      disabled={addingCart}
                      onClick={() => updateCartQuantity(cartQuantity + 1)}
                      className="h-full w-12 text-2xl font-bold transition hover:bg-black/10 disabled:opacity-60"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            <section className="mt-8 border-b border-[#eeeeee] pb-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[22px] font-bold">Product highlights</h2>

                <button className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5f5f5]">
                  <ChevronDown size={18} className="rotate-180" />
                </button>
              </div>

              {specifications.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-7 md:grid-cols-2">
                  {specifications.map((spec, index) => (
                    <div
                      key={`${spec.label}-${index}`}
                      className="grid grid-cols-[1fr_1.2fr] gap-4 border-b border-[#eeeeee] py-3"
                    >
                      <p className="text-[16px] leading-5 text-[#424242]">
                        {spec.label}
                      </p>

                      <p className="text-[16px] leading-5 text-[#424242]">
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#878787]">
                  No specifications available.
                </p>
              )}
            </section>

            <section className="border-b border-[#eeeeee] py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[22px] font-bold">All details</h2>

                  <p className="mt-1 text-[15px] text-[#878787]">
                    Features, description and more
                  </p>
                </div>

                <button className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5f5f5]">
                  <ChevronDown size={18} />
                </button>
              </div>

              {product.description && (
                <p className="mt-4 text-[15px] leading-6 text-[#424242]">
                  {product.description}
                </p>
              )}
            </section>

            <section className="border-b border-[#eeeeee] py-5">
              <h2 className="text-[22px] font-bold">Delivery details</h2>

              <div className="mt-4 rounded-xl bg-[#fff8df] p-4 text-sm text-[#424242]">
                Delivery available from{" "}
                <span className="font-semibold">
                  {product.shopName ||
                    product.merchant?.shopName ||
                    "Merchant Store"}
                </span>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}