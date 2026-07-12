import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Bell,
  ChevronDown,
  CheckCircle2,
  Clock,
  Crosshair,
  Loader2,
  LogOut,
  MapPin,
  PackageCheck,
  PackageX,
  RefreshCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import backendApi from "../../../api/backendApi";
import type { RootState } from "../../../redux/store";
import {
  setGroceryLocation,
  setGroceryPincode,
} from "../../../redux/slices/groceryLocationSlice";
import {
  GROCERY_ORDER_NOTIFICATION_EVENT,
  type GroceryOrderNotificationPayload,
  type GroceryOrderNotificationType,
} from "../../../utils/groceryOrderNotification";
import { GROCERY_CART_CHANGED_EVENT } from "../../../utils/groceryCartEvents";

type GroceryHeaderProps = {
  search: string;
  setSearch: (value: string) => void;
  cartCount: number;
  onLoginClick?: () => void;
};

type UserData = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
};

type UserAddress = {
  _id: string;
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

type UserOrder = {
  _id: string;
  orderNo: string;
  items: {
    productId: string;
    productName: string;
    image?: string;
    variant?: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  deliveryCharge?: number;
  grandTotal: number;
  status:
    | "pending_merchant_approval"
    | "confirmed"
    | "rejected"
    | "cancelled"
    | "out_of_stock";
  rejectionReason?: string;
  merchantDecisionAt?: string;
  createdAt?: string;
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

const formatAddressLine = (address: UserAddress) => {
  return [
    address.addressLine,
    address.locality,
    address.landmark,
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getOrderTitle = (order: UserOrder) => {
  const firstItem = order.items?.[0];

  if (!firstItem) return "Grocery Order";

  if (order.items.length === 1) return firstItem.productName;

  return `${firstItem.productName} + ${order.items.length - 1} more item${
    order.items.length - 1 === 1 ? "" : "s"
  }`;
};

const getNotificationStyles = (type?: GroceryOrderNotificationType) => {
  if (type === "rejected" || type === "out_of_stock") {
    return {
      iconWrap: "bg-red-100 text-red-600",
      button: "bg-[#ff6161] text-white",
    };
  }

  if (type === "confirmed" || type === "success") {
    return {
      iconWrap: "bg-green-100 text-green-700",
      button: "bg-[#26a541] text-white",
    };
  }

  return {
    iconWrap: "bg-blue-100 text-[#2874f0]",
    button: "bg-[#2874f0] text-white",
  };
};

const getStatusMeta = (status: UserOrder["status"]) => {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      title: "Order confirmed",
      description: "Your order is confirmed.",
      badgeClass: "bg-[#e7f8ec] text-[#168533]",
      iconClass: "bg-[#168533] text-white",
      Icon: CheckCircle2,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      title: "Order rejected",
      description: "Merchant rejected this order request.",
      badgeClass: "bg-[#fff1f1] text-[#ff6161]",
      iconClass: "bg-[#ff6161] text-white",
      Icon: PackageX,   
    };
  }

  if (status === "out_of_stock") {
    return {
      label: "Out of stock",
      title: "Out of stock",
      description: "Stock is not available.",
      badgeClass: "bg-[#fff4e5] text-[#c77700]",
      iconClass: "bg-[#f59e0b] text-white",
      Icon: AlertCircle,
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      title: "Order cancelled",
      description: "This order has been cancelled.",
      badgeClass: "bg-[#f1f3f6] text-[#616161]",
      iconClass: "bg-[#878787] text-white",
      Icon: PackageX,
    };
  }

  return {
    label: "Pending",
    title: "Waiting for approval",
    description: "Sent to merchant for approval.",
    badgeClass: "bg-[#fff7df] text-[#c77700]",
    iconClass: "bg-[#f5a623] text-white",
    Icon: Clock,
  };
};

export default function GroceryHeader({
  search,
  setSearch,
  cartCount,
  onLoginClick,
}: GroceryHeaderProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const groceryLocation = useSelector(
    (state: RootState) => state.groceryLocation
  );

  const selectedPincode = groceryLocation.pincode;
  const selectedAddressLine = groceryLocation.addressLine;
  const selectedCity = groceryLocation.city;
  const selectedState = groceryLocation.state;

  const [user, setUser] = useState<UserData | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [locationOpen, setLocationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState(selectedPincode);
  const [pincodeError, setPincodeError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [dbCartCount, setDbCartCount] = useState(cartCount || 0);

  const [headerNotification, setHeaderNotification] =
    useState<GroceryOrderNotificationPayload | null>(null);

  const [middlePopup, setMiddlePopup] =
    useState<GroceryOrderNotificationPayload | null>(null);

  const [notificationCount, setNotificationCount] = useState(0);

  const [ordersPopupOpen, setOrdersPopupOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState<UserOrder[]>([]);

  const locationRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const fetchMe = async () => {
    try {
      const res = await backendApi.get("/user/me", {
        skipAuthRefresh: true,
      } as any);

      setUser(res.data?.data || null);
    } catch {
      setUser(null);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await backendApi.get("/user/cart", {
        withCredentials: true,
        skipAuthRefresh: true,
      } as any);

      setDbCartCount(response.data?.data?.cart?.totalQuantity || 0);
    } catch {
      setDbCartCount(0);
    }
  };

  const fetchSavedAddresses = async () => {
    try {
      if (!user) {
        setSavedAddresses([]);
        return;
      }

      setAddressesLoading(true);

      const res = await backendApi.get("/user/addresses");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setSavedAddresses(data);
    } catch {
      setSavedAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await backendApi.get("/user/orders/my-orders", {
        withCredentials: true,
      });

      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setOrders(data);
    } catch (err: any) {
      setOrdersError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const openMyOrdersPopup = async () => {
    if (!user) {
      onLoginClick?.();
      return;
    }

    setAccountOpen(false);
    setLocationOpen(false);
    setMiddlePopup(null);
    setNotificationCount(0);
    setOrdersPopupOpen(true);

    await fetchOrders();
  };

  const showOrderNotification = (payload: GroceryOrderNotificationPayload) => {
    setHeaderNotification(payload);
    setMiddlePopup(payload);
    setNotificationCount((prev) => prev + 1);

    window.setTimeout(() => {
      setHeaderNotification(null);
    }, 5000);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    setDbCartCount(cartCount || 0);
  }, [cartCount]);

  useEffect(() => {
    if (!user) {
      setDbCartCount(0);
      return;
    }

    fetchCartCount();

    const handleCartChanged = () => {
      fetchCartCount();
    };

    window.addEventListener(GROCERY_CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(GROCERY_CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [user]);

  useEffect(() => {
    const handleUserLoginSuccess = () => {
      fetchMe();
      fetchCartCount();
    };

    window.addEventListener("user-login-success", handleUserLoginSuccess);

    return () => {
      window.removeEventListener("user-login-success", handleUserLoginSuccess);
    };
  }, []);

  useEffect(() => {
    const handleAddressesChanged = () => {
      fetchSavedAddresses();
    };

    window.addEventListener("user-addresses-changed", handleAddressesChanged);

    return () => {
      window.removeEventListener(
        "user-addresses-changed",
        handleAddressesChanged
      );
    };
  }, [user]);

  useEffect(() => {
    if (locationOpen && user) {
      fetchSavedAddresses();
    }
  }, [locationOpen, user]);

  useEffect(() => {
    setPincodeInput(selectedPincode);
  }, [selectedPincode]);

  useEffect(() => {
    const handleOrderNotification = (event: Event) => {
      const customEvent = event as CustomEvent<GroceryOrderNotificationPayload>;
      const payload = customEvent.detail;

      if (!payload) return;

      showOrderNotification(payload);
      fetchCartCount();
    };

    window.addEventListener(
      GROCERY_ORDER_NOTIFICATION_EVENT,
      handleOrderNotification
    );

    return () => {
      window.removeEventListener(
        GROCERY_ORDER_NOTIFICATION_EVENT,
        handleOrderNotification
      );
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const seenKey = "seen_grocery_order_status_ids";

    const getSeenIds = () => {
      try {
        const raw = localStorage.getItem(seenKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const saveSeenId = (id: string) => {
      const seenIds = getSeenIds();

      if (!seenIds.includes(id)) {
        localStorage.setItem(seenKey, JSON.stringify([...seenIds, id]));
      }
    };

    const checkOrderStatus = async () => {
      try {
        const response = await backendApi.get("/user/orders/my-orders", {
          withCredentials: true,
          skipAuthRefresh: true,
        } as any);

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const seenIds = getSeenIds();

        const updatedOrder = data.find((order: any) => {
          const status = order.status;
          const notifyId = `${order._id}-${status}`;

          return (
            ["confirmed", "rejected", "out_of_stock"].includes(status) &&
            !seenIds.includes(notifyId)
          );
        });

        if (!updatedOrder) return;

        const notifyId = `${updatedOrder._id}-${updatedOrder.status}`;

        let payload: GroceryOrderNotificationPayload = {
          title: "Order update",
          message: "Your order status has been updated.",
          type: "info",
          orderId: updatedOrder._id,
        };

        if (updatedOrder.status === "confirmed") {
          payload = {
            title: "Order confirmed successfully",
            message: "Your order is confirmed.",
            type: "confirmed",
            orderId: updatedOrder._id,
          };
        }

        if (updatedOrder.status === "rejected") {
          payload = {
            title: "Order rejected",
            message:
              updatedOrder.rejectionReason ||
              "Merchant rejected your order request.",
            type: "rejected",
            orderId: updatedOrder._id,
          };
        }

        if (updatedOrder.status === "out_of_stock") {
          payload = {
            title: "Product out of stock",
            message:
              updatedOrder.rejectionReason ||
              "Merchant could not approve because stock is unavailable.",
            type: "out_of_stock",
            orderId: updatedOrder._id,
          };
        }

        saveSeenId(notifyId);
        showOrderNotification(payload);
      } catch {
        // ignore polling error
      }
    };

    checkOrderStatus();

    const interval = window.setInterval(checkOrderStatus, 10000);

    return () => window.clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setLocationOpen(false);
      }

      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getSavedAddressText = () => {
    if (selectedAddressLine) return selectedAddressLine;

    const cityState = [selectedCity, selectedState].filter(Boolean).join(", ");

    if (cityState) return cityState;

    return "Products available for this pincode will be shown.";
  };

  const resetToAllProductsForPincode = () => {
    navigate("/grocery", { replace: true });
  };

  const handleSelectAddress = (address: UserAddress) => {
    dispatch(
      setGroceryLocation({
        pincode: address.pincode,
        addressLine: formatAddressLine(address),
        city: address.city,
        state: address.state,
        country: "India",
      })
    );

    setPincodeInput(address.pincode);
    setPincodeError("");
    setLocationOpen(false);

    resetToAllProductsForPincode();
  };

  const handleSavePincode = () => {
    const cleanPincode = pincodeInput.replace(/\D/g, "").slice(0, 6);

    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      setPincodeError("Please enter valid 6 digit pincode");
      return;
    }

    const matchingAddress = savedAddresses.find(
      (address) => address.pincode === cleanPincode
    );

    if (matchingAddress) {
      handleSelectAddress(matchingAddress);
      return;
    }

    dispatch(setGroceryPincode(cleanPincode));

    setPincodeInput(cleanPincode);
    setPincodeError("");
    setLocationOpen(false);

    resetToAllProductsForPincode();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setPincodeError("Current location is not supported in this browser");
      return;
    }

    setDetectingLocation(true);
    setPincodeError("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const res = await backendApi.post(
            "/user/location/pincode",
            {
              latitude,
              longitude,
            },
            {
              skipAuthRefresh: true,
            } as any
          );

          const data = res.data?.data || {};
          const detectedPincode = data.pincode;

          if (!detectedPincode) {
            setPincodeError("Pincode not found for your current location");
            return;
          }

          dispatch(
            setGroceryLocation({
              pincode: detectedPincode,
              addressLine:
                data.addressLine ||
                data.address?.addressLine ||
                data.address?.displayAddress ||
                data.displayAddress ||
                "",
              city: data.city || data.address?.city || "",
              state: data.state || data.address?.state || "",
              country: data.country || data.address?.country || "",
            })
          );

          setPincodeInput(detectedPincode);
          setPincodeError("");
          setLocationOpen(false);

          resetToAllProductsForPincode();
        } catch (error: any) {
          setPincodeError(
            error.response?.data?.message || "Failed to detect pincode"
          );
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          setPincodeError("Please allow location permission");
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setPincodeError("Location unavailable. Please enter pincode manually");
          return;
        }

        if (error.code === error.TIMEOUT) {
          setPincodeError("Location request timed out");
          return;
        }

        setPincodeError("Failed to get current location");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleSelectFallbackPincode = () => {
    if (selectedAddressLine || selectedCity || selectedState) {
      dispatch(
        setGroceryLocation({
          pincode: selectedPincode,
          addressLine: selectedAddressLine,
          city: selectedCity,
          state: selectedState,
          country: groceryLocation.country,
        })
      );
    } else {
      dispatch(setGroceryPincode(selectedPincode));
    }

    setPincodeInput(selectedPincode);
    setLocationOpen(false);

    resetToAllProductsForPincode();
  };

  const handleLogout = async () => {
    try {
      await backendApi.post("/user/logout", undefined, {
        skipAuthRefresh: true,
      } as any);
    } catch {
      // ignore logout error
    } finally {
      setUser(null);
      setSavedAddresses([]);
      setAccountOpen(false);
      setOrders([]);
      setOrdersPopupOpen(false);
      setDbCartCount(0);
      navigate("/grocery", { replace: true });
    }
  };

  const displayName =
    user?.name || user?.email?.split("@")[0] || user?.phone || "";

  const popupStyles = getNotificationStyles(middlePopup?.type);
  const toastStyles = getNotificationStyles(headerNotification?.type);

  return (
    <>
      {headerNotification && (
        <div className="fixed right-5 top-[70px] z-[999] w-[340px] rounded-xl bg-white p-4 text-[#212121] shadow-2xl">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toastStyles.iconWrap}`}
            >
              {headerNotification.type === "rejected" ||
              headerNotification.type === "out_of_stock" ? (
                <PackageX size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold">{headerNotification.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#424242]">
                {headerNotification.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setHeaderNotification(null)}
              className="text-[#878787]"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {middlePopup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center text-[#212121] shadow-2xl">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${popupStyles.iconWrap}`}
            >
              {middlePopup.type === "rejected" ||
              middlePopup.type === "out_of_stock" ? (
                <PackageX size={34} />
              ) : (
                <PackageCheck size={34} />
              )}
            </div>

            <h2 className="mt-4 text-2xl font-black">{middlePopup.title}</h2>

            <p className="mt-2 text-sm leading-6 text-[#424242]">
              {middlePopup.message}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMiddlePopup(null)}
                className="h-11 rounded border border-[#d7d7d7] text-sm font-bold text-[#424242]"
              >
                Close
              </button>

              <button
  type="button"
  onClick={() => navigate("/grocery/myprofile/orders")}
  className={`h-11 rounded text-sm font-bold ${popupStyles.button}`}
>
                My Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {ordersPopupOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 px-3 py-5">
          <div className="flex max-h-[88vh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl bg-[#f1f3f6] text-[#212121] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">My Orders</h2>
                <p className="text-xs text-[#878787]">
                  Product image, packets, price and status
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchOrders}
                  className="hidden items-center gap-2 rounded bg-[#26a541] px-3 py-2 text-xs font-bold text-white sm:flex"
                >
                  <RefreshCcw size={14} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setOrdersPopupOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f5f5f5]"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4">
              {ordersError && (
                <div className="mb-4 flex items-center gap-2 rounded bg-red-50 p-4 text-sm font-semibold text-red-600">
                  <AlertCircle size={18} />
                  {ordersError}
                </div>
              )}

              {ordersLoading ? (
                <div className="flex min-h-[280px] items-center justify-center gap-2 rounded bg-white text-sm font-semibold">
                  <Loader2 className="animate-spin" size={18} />
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded bg-white text-center">
                  <ShoppingBag size={46} className="text-[#878787]" />
                  <h3 className="mt-3 text-lg font-bold">No orders yet</h3>
                  <p className="mt-1 text-sm text-[#878787]">
                    Your grocery orders will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOrdersPopupOpen(false);
                      navigate("/grocery");
                    }}
                    className="mt-5 rounded bg-[#26a541] px-5 py-2 text-sm font-bold text-white"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const meta = getStatusMeta(order.status);
                    const StatusIcon = meta.Icon;
                    const firstItem = order.items?.[0];

                    return (
                      <div
                        key={order._id}
                        className="rounded bg-white shadow-sm"
                      >
                        <div className="grid grid-cols-[82px_1fr] gap-3 p-4 md:grid-cols-[100px_1fr_190px]">
                          <div className="flex h-[82px] w-[82px] items-center justify-center rounded bg-[#f5f5f5] md:h-[94px] md:w-[94px]">
                            {firstItem?.image ? (
                              <img
                                src={toImageSrc(firstItem.image)}
                                alt={firstItem.productName}
                                className="max-h-[74px] max-w-[74px] object-contain md:max-h-[86px] md:max-w-[86px]"
                              />
                            ) : (
                              <PackageCheck
                                className="text-[#bdbdbd]"
                                size={34}
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-[15px] font-semibold text-[#212121]">
                              {getOrderTitle(order)}
                            </h3>

                            <p className="mt-1 text-xs text-[#878787]">
                              Order ID: {order.orderNo}
                            </p>

                            {formatDate(order.createdAt) && (
                              <p className="mt-1 text-xs text-[#878787]">
                                Ordered on {formatDate(order.createdAt)}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {order.items.map((item) => (
                                <span
                                  key={`${order._id}-${item.productId}`}
                                  className="rounded-full bg-[#f1f3f6] px-3 py-1 text-xs font-semibold text-[#424242]"
                                >
                                  {item.productName} •{" "}
                                  {item.variant || "Packet"} • Qty{" "}
                                  {item.quantity}
                                </span>
                              ))}
                            </div>

                            {order.rejectionReason && (
                              <p className="mt-3 rounded bg-red-50 p-2 text-xs font-semibold text-red-600">
                                {order.rejectionReason}
                              </p>
                            )}
                          </div>

                          <div className="col-span-2 flex items-start justify-between border-t border-[#eeeeee] pt-4 md:col-span-1 md:block md:border-t-0 md:pt-0">
                            <div>
                              <p className="text-lg font-bold">
                                ₹{order.grandTotal}
                              </p>

                              <span
                                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                            </div>

                            <div className="mt-0 flex items-start gap-2 md:mt-5">
                              <span
                                className={`mt-[2px] grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta.iconClass}`}
                              >
                                <StatusIcon size={16} />
                              </span>

                              <div>
                                <p className="text-sm font-bold text-[#212121]">
                                  {meta.title}
                                </p>
                                <p className="mt-1 max-w-[180px] text-xs leading-5 text-[#878787]">
                                  {meta.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {order.items.length > 1 && (
                          <div className="border-t border-[#eeeeee] px-4 py-3">
                            <p className="text-xs font-semibold text-[#878787]">
                              Items in this order
                            </p>

                            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                              {order.items.map((item) => (
                                <div
                                  key={`${order._id}-detail-${item.productId}`}
                                  className="flex items-center gap-3 rounded bg-[#fafafa] p-2"
                                >
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white">
                                    {item.image ? (
                                      <img
                                        src={toImageSrc(item.image)}
                                        alt={item.productName}
                                        className="max-h-10 max-w-10 object-contain"
                                      />
                                    ) : (
                                      <PackageCheck
                                        className="text-[#bdbdbd]"
                                        size={20}
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold">
                                      {item.productName}
                                    </p>
                                    <p className="text-[11px] text-[#878787]">
                                      {item.variant || "Packet"} • Qty{" "}
                                      {item.quantity} • ₹{item.total}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-[#26a541] text-white">
        <div className="mx-auto flex h-[56px] max-w-[1536px] items-center px-4">
          <div className="flex w-[260px] items-center justify-center pr-4">
            <h1
              onClick={() => navigate("/grocery")}
              className="cursor-pointer text-[25px] font-extrabold italic tracking-tight"
            >
              Grocery
            </h1>
          </div>

          <div className="flex h-[36px] max-w-[540px] flex-1 items-center rounded-[2px] bg-white shadow-sm">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search grocery products"
              className="h-full min-w-0 flex-1 rounded-[2px] px-4 text-[14px] text-[#212121] outline-none placeholder:text-[#878787]"
            />

            <button
              type="button"
              className="flex h-full w-[48px] items-center justify-center text-[#26a541]"
            >
              <Search size={23} strokeWidth={3} />
            </button>
          </div>

          <div ref={locationRef} className="relative ml-5 hidden lg:block">
            <button
              type="button"
              onClick={() => {
                setLocationOpen((prev) => !prev);
                setAccountOpen(false);
              }}
              className="flex h-[56px] items-center gap-1 px-2 text-[16px] font-semibold"
            >
              <MapPin size={18} fill="white" />

              {selectedPincode
                ? `Delivery to ${selectedPincode}`
                : "Select city"}

              <ChevronDown size={15} />
            </button>

            {locationOpen && (
              <div className="absolute left-1/2 top-[56px] w-[400px] -translate-x-1/2 rounded-sm bg-white text-[#212121] shadow-[0_4px_18px_rgba(0,0,0,0.2)]">
                <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />

                <div className="px-6 pb-6 pt-6">
                  <h3 className="text-[16px] font-semibold">
                    Where do you want the delivery?
                  </h3>

                  <p className="mt-1 text-[13px] text-[#878787]">
                    Grocery is available in selected pincodes.
                  </p>

                  <div className="mt-5 flex h-[42px] border border-[#e0e0e0]">
                    <input
                      value={pincodeInput}
                      onChange={(event) => {
                        setPincodeError("");
                        setPincodeInput(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        );
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSavePincode();
                        }
                      }}
                      placeholder="Enter pincode"
                      className="h-full min-w-0 flex-1 px-4 text-[14px] text-[#212121] outline-none placeholder:text-[#878787]"
                    />

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={detectingLocation}
                      className="flex h-full min-w-[142px] items-center justify-center gap-1 border-l border-[#e0e0e0] px-3 text-[13px] font-semibold leading-[14px] text-[#2874f0] disabled:opacity-60"
                    >
                      {detectingLocation ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Crosshair size={15} />
                      )}

                      <span className="text-left">
                        Current
                        <br />
                        Location
                      </span>
                    </button>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSavePincode}
                      className="h-[34px] rounded-sm bg-[#2874f0] px-7 text-[13px] font-semibold text-white shadow-sm"
                    >
                      CHECK
                    </button>
                  </div>

                  {pincodeError && (
                    <p
                      className={`mt-2 text-[12px] font-semibold ${
                        pincodeError.includes("Detecting")
                          ? "text-[#2874f0]"
                          : "text-[#ff6161]"
                      }`}
                    >
                      {pincodeError}
                    </p>
                  )}

                  <div className="mt-6 border-t border-[#f0f0f0] pt-5">
                    <h4 className="text-[16px] font-semibold text-[#212121]">
                      Saved Addresses
                    </h4>

                    {addressesLoading && (
                      <p className="mt-4 text-[13px] text-[#878787]">
                        Loading saved addresses...
                      </p>
                    )}

                    {!addressesLoading &&
                      savedAddresses.map((address) => {
                        const addressText = formatAddressLine(address);

                        const isSelected =
                          selectedPincode === address.pincode &&
                          selectedAddressLine === addressText;

                        return (
                          <button
                            key={address._id}
                            type="button"
                            onClick={() => handleSelectAddress(address)}
                            className="mt-5 flex w-full items-start gap-4 text-left"
                          >
                            <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#2874f0]">
                              {isSelected && (
                                <span className="h-[8px] w-[8px] rounded-full bg-[#2874f0]" />
                              )}
                            </span>

                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold leading-[18px] text-[#212121]">
                                {address.pincode}
                              </span>

                              <span className="mt-[7px] block max-w-[290px] text-[13px] leading-[17px] text-[#878787]">
                                {addressText}
                              </span>
                            </span>
                          </button>
                        );
                      })}

                    {!addressesLoading &&
                      savedAddresses.length === 0 &&
                      selectedPincode && (
                        <button
                          type="button"
                          onClick={handleSelectFallbackPincode}
                          className="mt-5 flex w-full items-start gap-4 text-left"
                        >
                          <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#2874f0]">
                            <span className="h-[8px] w-[8px] rounded-full bg-[#2874f0]" />
                          </span>

                          <span className="min-w-0">
                            <span className="block text-[15px] font-semibold leading-[18px] text-[#212121]">
                              {selectedPincode}
                            </span>

                            <span className="mt-[7px] block max-w-[290px] text-[13px] leading-[17px] text-[#878787]">
                              {getSavedAddressText()}
                            </span>
                          </span>
                        </button>
                      )}

                    {!addressesLoading &&
                      savedAddresses.length === 0 &&
                      !selectedPincode && (
                        <p className="mt-4 text-[13px] leading-5 text-[#878787]">
                          No saved address found. Add address from My Profile.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={accountRef} className="relative ml-5">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((prev) => !prev);
                  setLocationOpen(false);
                }}
                className="flex h-[56px] items-center gap-1 px-2 text-[16px] font-semibold"
              >
                {displayName}
                <ChevronDown size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  onLoginClick?.();
                }}
                className="h-[32px] min-w-[122px] rounded-[1px] bg-white px-7 text-[15px] font-semibold text-[#26a541]"
              >
                Login
              </button>
            )}

            {user && accountOpen && (
              <div className="absolute right-0 top-[56px] w-[250px] bg-white text-[#212121] shadow-[0_4px_18px_rgba(0,0,0,0.18)]">
                <div className="absolute -top-2 right-10 h-4 w-4 rotate-45 bg-white" />

                <DropdownItem
                  icon={<User size={18} />}
                  label="My Profile"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate("/grocery/myprofile");
                  }}
                />

                {/* <DropdownItem
                  icon={<ShoppingBag size={18} />}
                  label="My Orders"
                  onClick={openMyOrdersPopup}
                /> */}

                
                <DropdownItem
  icon={<ShoppingBag size={18} />}
  label="My Orders"
  onClick={() => navigate("/grocery/myprofile/orders")}
/>

                <DropdownItem
                  icon={<LogOut size={18} />}
                  label="Logout"
                  danger
                  onClick={handleLogout}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            className="ml-5 hidden h-[56px] items-center gap-1 px-2 text-[16px] font-semibold md:flex"
          >
            More
            <ChevronDown size={15} />
          </button>

          <button
            type="button"
            onClick={openMyOrdersPopup}
            className="relative ml-4 hidden h-[56px] items-center justify-center px-2 text-white md:flex"
            title="Notifications"
          >
            <Bell size={22} />

            {notificationCount > 0 && (
              <span className="absolute right-0 top-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff6161] px-[5px] text-[11px] font-bold leading-none">
                {notificationCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/grocery/cart")}
            className="relative ml-4 flex h-[56px] min-w-[94px] items-center justify-center gap-2 bg-[#168533] px-4 text-[16px] font-semibold"
          >
            <ShoppingCart size={22} fill="white" />

            {dbCartCount > 0 && (
              <span className="absolute left-[17px] top-[3px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff6161] px-[5px] text-[11px] font-bold leading-none">
                {dbCartCount}
              </span>
            )}

            Cart
          </button>

          <div className="ml-4 hidden h-[56px] items-center gap-2 bg-[#168533] px-4 text-[14px] font-extrabold italic leading-[16px] lg:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-[#26a541]">
              F
            </div>

            <span>
              Flipkart
              <br />
              Home
            </span>
          </div>
        </div>
      </header>
    </>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[52px] w-full items-center gap-4 border-b border-[#f0f0f0] px-5 text-left text-[14px] hover:bg-[#f5faff] ${
        danger ? "text-[#ff6161]" : "text-[#212121]"
      }`}
    >
      <span className={danger ? "text-[#ff6161]" : "text-[#2874f0]"}>
        {icon}
      </span>
      {label}
    </button>
  );
}