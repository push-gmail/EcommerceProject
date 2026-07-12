import { useEffect, useMemo, useState } from "react";
import {
  Crosshair,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";
import backendApi from "../../api/backendApi";

type AddressType = "home" | "work";

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
  addressType: AddressType;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
};

type AddressForm = {
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  addressLine: string;
  city: string;
  state: string;
  landmark: string;
  alternatePhone: string;
  addressType: AddressType;
  latitude: number | null;
  longitude: number | null;
};

type FoundLocation = {
  pincode: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
};

const emptyForm: AddressForm = {
  name: "",
  phone: "",
  pincode: "",
  locality: "",
  addressLine: "",
  city: "",
  state: "",
  landmark: "",
  alternatePhone: "",
  addressType: "home",
  latitude: null,
  longitude: null,
};

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function UserAddresses() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [foundLocation, setFoundLocation] = useState<FoundLocation | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const formTitle = editingAddressId ? "EDIT ADDRESS" : "ADD A NEW ADDRESS";

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await backendApi.get("/user/addresses");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setAddresses(data);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const updateField = (field: keyof AddressForm, value: string) => {
    setError("");
    setMessage("");

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddNew = () => {
    setForm(emptyForm);
    setEditingAddressId("");
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const handleEdit = (address: UserAddress) => {
    setForm({
      name: address.name || "",
      phone: address.phone || "",
      pincode: address.pincode || "",
      locality: address.locality || "",
      addressLine: address.addressLine || "",
      city: address.city || "",
      state: address.state || "",
      landmark: address.landmark || "",
      alternatePhone: address.alternatePhone || "",
      addressType: address.addressType || "home",
      latitude: address.latitude || null,
      longitude: address.longitude || null,
    });

    setEditingAddressId(address._id);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingAddressId("");
    setShowForm(false);
    setError("");
    setMessage("");
  };

  const validateForm = () => {
    const phone = form.phone.replace(/\D/g, "");
    const pincode = form.pincode.replace(/\D/g, "");

    if (!form.name.trim()) return "Name is required";
    if (!/^[0-9]{10}$/.test(phone)) return "Enter valid 10 digit mobile number";
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return "Enter valid 6 digit pincode";
    if (!form.addressLine.trim()) return "Address is required";
    if (!form.city.trim()) return "City/District/Town is required";
    if (!form.state.trim()) return "State is required";

    return "";
  };

  const handleSave = async () => {
    try {
      setError("");
      setMessage("");

      const validationError = validateForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      setSaving(true);

      const payload = {
        ...form,
        phone: form.phone.replace(/\D/g, "").slice(0, 10),
        pincode: form.pincode.replace(/\D/g, "").slice(0, 6),
        alternatePhone: form.alternatePhone.replace(/\D/g, "").slice(0, 10),
      };

      if (editingAddressId) {
        await backendApi.put(`/user/addresses/${editingAddressId}`, payload);
        setMessage("Address updated successfully");
      } else {
        await backendApi.post("/user/addresses", payload);
        setMessage("Address saved successfully");
      }

      setForm(emptyForm);
      setEditingAddressId("");
      setShowForm(false);
      await fetchAddresses();

      window.dispatchEvent(new CustomEvent("user-addresses-changed"));
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    const ok = window.confirm("Delete this address?");
    if (!ok) return;

    try {
      await backendApi.delete(`/user/addresses/${addressId}`);
      setMessage("Address deleted successfully");
      await fetchAddresses();

      window.dispatchEvent(new CustomEvent("user-addresses-changed"));
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete address");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Current location is not supported in this browser");
      return;
    }

    setDetectingLocation(true);
    setError("");
    setMessage("");

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

          setFoundLocation({
            pincode: data.pincode || "",
            addressLine:
              data.addressLine ||
              data.address?.addressLine ||
              data.displayAddress ||
              data.address?.displayAddress ||
              "",
            city: data.city || data.address?.city || "",
            state: data.state || data.address?.state || "",
            country: data.country || data.address?.country || "",
            latitude,
            longitude,
          });
        } catch (error: any) {
          setError(
            error.response?.data?.message || "Failed to detect location"
          );
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          setError("Please allow location permission");
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setError("Location unavailable. Please enter address manually");
          return;
        }

        if (error.code === error.TIMEOUT) {
          setError("Location request timed out");
          return;
        }

        setError("Failed to get current location");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleConfirmFoundLocation = () => {
    if (!foundLocation) return;

    setForm((prev) => ({
      ...prev,
      pincode: foundLocation.pincode,
      locality: foundLocation.city,
      addressLine: foundLocation.addressLine,
      city: foundLocation.city,
      state: foundLocation.state,
      latitude: foundLocation.latitude,
      longitude: foundLocation.longitude,
    }));

    setFoundLocation(null);
    setShowForm(true);
  };

  const locationTitle = useMemo(() => {
    if (!foundLocation) return "";

    return (
      foundLocation.city ||
      foundLocation.addressLine?.split(",")[0] ||
      "Location found"
    );
  }, [foundLocation]);

  return (
    <div className="min-h-[650px] bg-white px-8 py-7 shadow-sm">
      <h1 className="text-[20px] font-semibold text-[#212121]">
        Manage Addresses
      </h1>

      {message && (
        <div className="mt-4 border border-green-200 bg-green-50 px-4 py-3 text-[14px] font-semibold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-600">
          {error}
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={handleAddNew}
          className="mt-6 flex h-[52px] w-full items-center gap-4 border border-[#e0e0e0] bg-white px-5 text-[14px] font-semibold uppercase text-[#2874f0]"
        >
          <Plus size={19} />
          Add a new address
        </button>
      )}

      {showForm && (
        <div className="mt-6 border border-[#e0e0e0] bg-[#f5faff] px-5 py-5">
          <h2 className="text-[14px] font-semibold uppercase text-[#2874f0]">
            {formTitle}
          </h2>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={detectingLocation}
            className="mt-5 flex h-[44px] min-w-[220px] items-center justify-center gap-2 rounded-sm bg-[#2874f0] px-5 text-[14px] font-semibold text-white shadow-sm disabled:opacity-70"
          >
            {detectingLocation ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Crosshair size={17} />
            )}
            Use my current location
          </button>

          <div className="mt-5 grid max-w-[590px] grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              value={form.name}
              onChange={(value) => updateField("name", value)}
              placeholder="Name"
              autoFocus
            />

            <Input
              value={form.phone}
              onChange={(value) =>
                updateField("phone", value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile number"
            />

            <Input
              value={form.pincode}
              onChange={(value) =>
                updateField("pincode", value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Pincode"
            />

            <Input
              value={form.locality}
              onChange={(value) => updateField("locality", value)}
              placeholder="Locality"
            />
          </div>

          <div className="mt-3 max-w-[590px]">
            <textarea
              value={form.addressLine}
              onChange={(event) =>
                updateField("addressLine", event.target.value)
              }
              placeholder="Address (Area and Street)"
              className="h-[90px] w-full resize-none border border-[#e0e0e0] bg-white px-5 py-4 text-[14px] text-[#212121] outline-none placeholder:text-[#878787] focus:border-[#2874f0]"
            />
          </div>

          <div className="mt-3 grid max-w-[590px] grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              value={form.city}
              onChange={(value) => updateField("city", value)}
              placeholder="City/District/Town"
            />

            <select
              value={form.state}
              onChange={(event) => updateField("state", event.target.value)}
              className="h-[50px] border border-[#e0e0e0] bg-white px-4 text-[14px] text-[#212121] outline-none focus:border-[#2874f0]"
            >
              <option value="">--Select State--</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <Input
              value={form.landmark}
              onChange={(value) => updateField("landmark", value)}
              placeholder="Landmark (Optional)"
            />

            <Input
              value={form.alternatePhone}
              onChange={(value) =>
                updateField(
                  "alternatePhone",
                  value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="Alternate Phone (Optional)"
            />
          </div>

          <div className="mt-5">
            <p className="text-[12px] text-[#878787]">Address Type</p>

            <div className="mt-4 flex items-center gap-10">
              <Radio
                checked={form.addressType === "home"}
                label="Home"
                onClick={() =>
                  setForm((prev) => ({ ...prev, addressType: "home" }))
                }
              />

              <Radio
                checked={form.addressType === "work"}
                label="Work"
                onClick={() =>
                  setForm((prev) => ({ ...prev, addressType: "work" }))
                }
              />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-7">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-[48px] w-[230px] rounded-sm bg-[#2874f0] text-[14px] font-semibold uppercase text-white disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="h-[48px] px-4 text-[14px] font-semibold uppercase text-[#2874f0]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {loading && (
          <div className="border border-[#e0e0e0] bg-white p-5 text-[14px] text-[#878787]">
            Loading addresses...
          </div>
        )}

        {!loading && addresses.length === 0 && (
          <div className="border border-[#e0e0e0] bg-white p-5 text-[14px] text-[#878787]">
            No address saved yet.
          </div>
        )}

        {!loading &&
          addresses.map((address) => (
            <AddressCard
              key={address._id}
              address={address}
              onEdit={() => handleEdit(address)}
              onDelete={() => handleDelete(address._id)}
            />
          ))}
      </div>

      {foundLocation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-[420px] rounded bg-white px-8 py-9 text-center shadow-xl">
            <button
              type="button"
              onClick={() => setFoundLocation(null)}
              className="absolute -right-12 top-0 text-white"
            >
              <X size={34} strokeWidth={2} />
            </button>

            <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#2874f0] text-white">
              <MapPin size={42} fill="white" />
            </div>

            <h2 className="mt-7 text-[22px] font-semibold text-[#212121]">
              Location found
            </h2>

            <p className="mt-5 text-[14px] leading-6 text-[#212121]">
              {locationTitle}
              <br />
              <span className="font-semibold">
                {foundLocation.city && `${foundLocation.city}, `}
                {foundLocation.state}
                {foundLocation.pincode && ` - ${foundLocation.pincode}`}
              </span>
            </p>

            <button
              type="button"
              onClick={handleConfirmFoundLocation}
              className="mt-8 h-[48px] w-[270px] rounded-sm bg-[#fb641b] text-[15px] font-semibold uppercase text-white"
            >
              Confirm Address
            </button>

            <button
              type="button"
              onClick={() => setFoundLocation(null)}
              className="mt-5 block w-full text-[15px] font-semibold text-[#2874f0]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="h-[50px] border border-[#e0e0e0] bg-white px-5 text-[14px] text-[#212121] outline-none placeholder:text-[#878787] focus:border-[#2874f0]"
    />
  );
}

function Radio({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 text-[14px] text-[#212121]"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
          checked ? "border-[#2874f0]" : "border-[#c2c2c2]"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-[#2874f0]" />}
      </span>
      {label}
    </button>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative border border-[#e0e0e0] bg-white px-5 py-5">
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="absolute right-5 top-5 text-[#878787]"
      >
        <MoreVertical size={22} />
      </button>

      {menuOpen && (
        <div className="absolute right-8 top-10 z-10 w-[120px] bg-white py-1 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onEdit();
            }}
            className="block w-full px-4 py-2 text-left text-[14px] hover:bg-[#f5faff]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="block w-full px-4 py-2 text-left text-[14px] hover:bg-[#f5faff]"
          >
            Delete
          </button>
        </div>
      )}

      <div className="inline-flex bg-[#f0f0f0] px-2 py-1 text-[11px] font-semibold uppercase text-[#878787]">
        {address.addressType || "home"}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-5 text-[14px] text-[#212121]">
        <span className="font-semibold">{address.name}</span>
        <span className="font-semibold">{address.phone}</span>
      </div>

      <p className="mt-3 max-w-[760px] text-[14px] leading-6 text-[#212121]">
        {address.addressLine}
        {address.locality ? `, ${address.locality}` : ""}
        {address.landmark ? `, ${address.landmark}` : ""}, {address.city},{" "}
        {address.state} -{" "}
        <span className="font-semibold">{address.pincode}</span>
      </p>
    </div>
  );
}