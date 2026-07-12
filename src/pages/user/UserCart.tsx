import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Home,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";
import { emitGroceryCartChanged } from "../../utils/groceryCartEvents";
import { emitGroceryOrderNotification } from "../../utils/groceryOrderNotification";

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

type CartBilling = {
  _id: string;
  selectedPincode: string;
  subtotal: number;
  mrpTotal: number;
  discountTotal: number;
  deliveryCharge: number;
  grandTotal: number;
  totalItems: number;
  totalQuantity: number;
};

type CartItem = {
  _id: string;
  cartId: string;
  productId: string;
  merchantId: string;
  productName: string;
  image?: string;
  variant?: string;
  productPincode: string;
  quantity: number;
  price: number;
  mrp: number;
  total: number;
};

type UserAddress = {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  pincode: string;
  locality?: string;
  addressLine: string;
  city: string;
  state: string;
  landmark?: string;
  alternatePhone?: string;
  addressType?: "home" | "work";
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
};

const formatAddress = (address: UserAddress) => {
  return [
    address.addressLine,
    address.locality,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

export default function UserCart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartBilling | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [loading, setLoading] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const selectedAddress = useMemo(() => {
    return (
      addresses.find((address) => address._id === selectedAddressId) || null
    );
  }, [addresses, selectedAddressId]);

  const matchingAddresses = useMemo(() => {
    if (!cart?.selectedPincode) return addresses;

    return addresses.filter((address) => {
      return String(address.pincode) === String(cart.selectedPincode);
    });
  }, [addresses, cart?.selectedPincode]);

  const otherAddresses = useMemo(() => {
    if (!cart?.selectedPincode) return [];

    return addresses.filter((address) => {
      return String(address.pincode) !== String(cart.selectedPincode);
    });
  }, [addresses, cart?.selectedPincode]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await backendApi.get("/user/cart", {
        withCredentials: true,
      });

      const nextCart = response.data?.data?.cart || null;
      const nextItems = response.data?.data?.items || [];

      setCart(nextCart);
      setItems(nextItems);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true);

      const response = await backendApi.get("/user/addresses", {
        withCredentials: true,
      });

      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setAddresses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch addresses");
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (!cart?.selectedPincode || addresses.length === 0) return;

    const defaultMatching = addresses.find((address) => {
      return (
        address.isDefault &&
        String(address.pincode) === String(cart.selectedPincode)
      );
    });

    const firstMatching = addresses.find((address) => {
      return String(address.pincode) === String(cart.selectedPincode);
    });

    setSelectedAddressId((prev) => {
      const prevAddress = addresses.find((address) => address._id === prev);

      if (
        prevAddress &&
        String(prevAddress.pincode) === String(cart.selectedPincode)
      ) {
        return prev;
      }

      return defaultMatching?._id || firstMatching?._id || "";
    });
  }, [cart?.selectedPincode, addresses]);

  const validateSelectedAddress = () => {
    if (!cart?._id) return "Cart is empty";
    if (!cart.selectedPincode) return "Selected grocery pincode not found";
    if (items.length === 0) return "Cart is empty";
    if (!selectedAddress) return "Please select delivery address";

    if (String(selectedAddress.pincode) !== String(cart.selectedPincode)) {
      return "Selected address pincode must match selected grocery pincode";
    }

    return "";
  };

  const updateItemQuantity = async (item: CartItem, quantity: number) => {
    try {
      setError("");
      setActionLoadingId(item._id);

      if (quantity < 1) {
        await removeItem(item);
        return;
      }

      const response = await backendApi.patch(
        `/user/cart/items/${item._id}`,
        { quantity },
        { withCredentials: true }
      );

      setCart(response.data?.data?.cart || null);
      setItems(response.data?.data?.items || []);
      emitGroceryCartChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update item");
    } finally {
      setActionLoadingId("");
    }
  };

  const removeItem = async (item: CartItem) => {
    try {
      setError("");
      setActionLoadingId(item._id);

      const response = await backendApi.delete(`/user/cart/items/${item._id}`, {
        withCredentials: true,
      });

      setCart(response.data?.data?.cart || null);
      setItems(response.data?.data?.items || []);
      emitGroceryCartChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove item");
    } finally {
      setActionLoadingId("");
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setError("");

      const addressError = validateSelectedAddress();

      if (addressError) {
        setError(addressError);
        return;
      }

      if (!cart?._id || !selectedAddress?._id) {
        setError("Cart or address not found");
        return;
      }

      setPlacingOrder(true);

      await backendApi.post(
        "/user/orders/place-order",
        {
          cartId: cart._id,
          addressId: selectedAddress._id,
        },
        { withCredentials: true }
      );

      setCart(null);
      setItems([]);
      setSelectedAddressId("");

      emitGroceryCartChanged();

      emitGroceryOrderNotification({
        title: "Order placed successfully",
        message:
          "Order placed successfully. Merchant approval ke baad order confirm hoga.",
        type: "success",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-[#212121]">
      <header className="sticky top-0 z-40 border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1180px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#f5f5f5]"
            >
              <ChevronLeft size={22} />
            </button>

            <div>
              <h1 className="text-lg font-bold">My Cart</h1>
              <p className="text-xs text-[#878787]">
                {cart?.totalQuantity || 0} item
                {(cart?.totalQuantity || 0) === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/grocery")}
            className="rounded bg-[#26a541] px-4 py-2 text-sm font-semibold text-white"
          >
            Continue Shopping
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded bg-red-50 p-4 text-sm font-semibold text-red-600">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="rounded bg-white">
            <div className="border-b border-[#eeeeee] p-4">
              <h2 className="font-bold">Cart Items</h2>

              {cart?.selectedPincode && (
                <p className="mt-1 text-xs text-[#878787]">
                  Selected grocery pincode:{" "}
                  <span className="font-bold text-[#212121]">
                    {cart.selectedPincode}
                  </span>
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-[250px] items-center justify-center gap-2 text-sm font-semibold">
                <Loader2 className="animate-spin" size={18} />
                Loading cart...
              </div>
            ) : items.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <ShoppingCart size={42} className="text-[#878787]" />
                <p className="mt-3 text-lg font-bold">Your cart is empty</p>
                <p className="mt-1 text-sm text-[#878787]">
                  Add grocery products to continue.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#eeeeee]">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="grid grid-cols-[90px_1fr] gap-4 p-4"
                  >
                    <div className="flex h-[90px] w-[90px] items-center justify-center rounded bg-[#f5f5f5]">
                      {item.image ? (
                        <img
                          src={toImageSrc(item.image)}
                          alt={item.productName}
                          className="max-h-[80px] max-w-[80px] object-contain"
                        />
                      ) : (
                        <ShoppingCart className="text-[#bdbdbd]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#212121]">
                            {item.productName}
                          </h3>

                          <p className="mt-1 text-xs text-[#878787]">
                            {item.variant || "Packet"}
                          </p>

                          <p className="mt-1 text-xs text-[#878787]">
                            Product pincode: {item.productPincode}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={actionLoadingId === item._id}
                          onClick={() => removeItem(item)}
                          className="text-[#878787] hover:text-red-500 disabled:opacity-60"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-lg font-bold">₹{item.price}</span>

                        {Number(item.mrp || 0) > Number(item.price || 0) && (
                          <span className="text-sm text-[#878787] line-through">
                            ₹{item.mrp}
                          </span>
                        )}

                        <span className="rounded bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                          In cart
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-9 w-[120px] items-center justify-between overflow-hidden rounded border border-[#26a541]">
                          <button
                            type="button"
                            disabled={actionLoadingId === item._id}
                            onClick={() =>
                              updateItemQuantity(item, item.quantity - 1)
                            }
                            className="grid h-full w-9 place-items-center text-[#26a541] disabled:opacity-60"
                          >
                            <Minus size={16} />
                          </button>

                          <span className="font-bold">{item.quantity}</span>

                          <button
                            type="button"
                            disabled={actionLoadingId === item._id}
                            onClick={() =>
                              updateItemQuantity(item, item.quantity + 1)
                            }
                            className="grid h-full w-9 place-items-center text-[#26a541] disabled:opacity-60"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <p className="text-sm text-[#424242]">
                          Total:{" "}
                          <span className="font-bold">₹{item.total}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded bg-white">
            <div className="flex items-center justify-between border-b border-[#eeeeee] p-4">
              <div>
                <h2 className="font-bold">Delivery Address</h2>
                <p className="mt-1 text-xs text-[#878787]">
                  Select saved address. Address pincode must match grocery
                  pincode.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/grocery/myprofile/addresses")}
                className="rounded border border-[#2874f0] px-3 py-2 text-xs font-bold text-[#2874f0]"
              >
                Add / Manage
              </button>
            </div>

            {addressesLoading ? (
              <div className="flex min-h-[150px] items-center justify-center gap-2 text-sm font-semibold">
                <Loader2 className="animate-spin" size={17} />
                Loading addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-4">
                <div className="rounded border border-dashed border-[#d7d7d7] bg-[#fafafa] p-5 text-center">
                  <MapPin className="mx-auto text-[#878787]" size={34} />
                  <p className="mt-2 text-sm font-semibold">
                    No saved address found
                  </p>
                  <p className="mt-1 text-xs text-[#878787]">
                    Add delivery address before placing order.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/grocery/myprofile/addresses")}
                    className="mt-4 rounded bg-[#2874f0] px-4 py-2 text-xs font-bold text-white"
                  >
                    Add Address
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {matchingAddresses.length > 0 && (
                  <div className="space-y-3">
                    {matchingAddresses.map((address) => (
                      <AddressCard
                        key={address._id}
                        address={address}
                        selected={selectedAddressId === address._id}
                        disabled={false}
                        onSelect={() => setSelectedAddressId(address._id)}
                      />
                    ))}
                  </div>
                )}

                {matchingAddresses.length === 0 && (
                  <div className="rounded bg-yellow-50 p-4 text-sm font-semibold text-yellow-700">
                    No saved address found for selected grocery pincode{" "}
                    {cart?.selectedPincode}. Please add/select address with same
                    pincode.
                  </div>
                )}

                {otherAddresses.length > 0 && (
                  <div className="pt-2">
                    <p className="mb-2 text-xs font-bold uppercase text-[#878787]">
                      Other saved addresses
                    </p>

                    <div className="space-y-3">
                      {otherAddresses.map((address) => (
                        <AddressCard
                          key={address._id}
                          address={address}
                          selected={false}
                          disabled
                          onSelect={() => undefined}
                          selectedPincode={cart?.selectedPincode}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded bg-white">
          <div className="border-b border-[#eeeeee] p-4">
            <h2 className="font-bold uppercase text-[#878787]">
              Price Details
            </h2>
          </div>

          <div className="space-y-3 p-4 text-sm">
            <div className="flex justify-between">
              <span>Price</span>
              <span>₹{cart?.subtotal || 0}</span>
            </div>

            <div className="flex justify-between">
              <span>Discount</span>
              <span className="text-[#26a541]">
                -₹{cart?.discountTotal || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="text-[#26a541]">Free</span>
            </div>

            <div className="border-t border-dashed border-[#d7d7d7] pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>₹{cart?.grandTotal || 0}</span>
              </div>
            </div>

            {selectedAddress && (
              <div className="rounded bg-[#f5faff] p-3 text-xs text-[#424242]">
                <p className="font-bold text-[#212121]">
                  Deliver to: {selectedAddress.name}
                </p>
                <p className="mt-1 leading-5">
                  {formatAddress(selectedAddress)}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={placingOrder || items.length === 0 || !selectedAddress}
              onClick={handlePlaceOrder}
              className="mt-4 h-12 w-full rounded bg-[#fb641b] text-sm font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>

            <p className="text-xs leading-5 text-[#878787]">
              Order pehle merchant approval ke liye jayega. Merchant approve
              karega tab stock reduce hoga aur order confirm hoga.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function AddressCard({
  address,
  selected,
  disabled,
  onSelect,
  selectedPincode,
}: {
  address: UserAddress;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  selectedPincode?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`w-full rounded border p-4 text-left transition ${
        selected
          ? "border-[#2874f0] bg-[#f5faff]"
          : disabled
          ? "border-[#eeeeee] bg-[#fafafa] opacity-70"
          : "border-[#e0e0e0] bg-white hover:border-[#2874f0]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-[#2874f0]" : "border-[#d7d7d7]"
          }`}
        >
          {selected && <CheckCircle2 size={15} className="text-[#2874f0]" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-[#212121]">{address.name}</p>

            <span className="rounded bg-[#f1f3f6] px-2 py-1 text-[11px] font-bold uppercase text-[#616161]">
              {address.addressType || "home"}
            </span>

            {address.isDefault && (
              <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">
                Default
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-semibold text-[#424242]">
            {address.phone}
          </p>

          <p className="mt-2 text-sm leading-6 text-[#424242]">
            {formatAddress(address)}
          </p>

          {disabled && selectedPincode && (
            <p className="mt-2 text-xs font-semibold text-red-500">
              This address pincode does not match selected grocery pincode{" "}
              {selectedPincode}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}