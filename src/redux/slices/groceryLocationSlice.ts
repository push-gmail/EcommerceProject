import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type GroceryLocationPayload = {
  pincode: string;
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
};

type GroceryLocationState = {
  pincode: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
};

const STORAGE_KEY = "groceryLocation";

const getInitialLocation = (): GroceryLocationState => {
  if (typeof window === "undefined") {
    return {
      pincode: "",
      addressLine: "",
      city: "",
      state: "",
      country: "",
    };
  }

  try {
    const savedLocation = localStorage.getItem(STORAGE_KEY);

    if (savedLocation) {
      const parsed = JSON.parse(savedLocation);

      return {
        pincode: String(parsed?.pincode || "")
          .replace(/\D/g, "")
          .slice(0, 6),
        addressLine: String(parsed?.addressLine || ""),
        city: String(parsed?.city || ""),
        state: String(parsed?.state || ""),
        country: String(parsed?.country || ""),
      };
    }
  } catch {
    // ignore invalid localStorage data
  }

  return {
    pincode: localStorage.getItem("groceryPincode") || "",
    addressLine: "",
    city: "",
    state: "",
    country: "",
  };
};

const saveLocationToStorage = (state: GroceryLocationState) => {
  if (typeof window === "undefined") return;

  if (!state.pincode) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("groceryPincode");
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem("groceryPincode", state.pincode);
};

const initialState: GroceryLocationState = getInitialLocation();

const groceryLocationSlice = createSlice({
  name: "groceryLocation",
  initialState,
  reducers: {
    setGroceryLocation: (
      state,
      action: PayloadAction<GroceryLocationPayload>
    ) => {
      const cleanPincode = String(action.payload.pincode || "")
        .replace(/\D/g, "")
        .slice(0, 6);

      state.pincode = cleanPincode;
      state.addressLine = action.payload.addressLine || "";
      state.city = action.payload.city || "";
      state.state = action.payload.state || "";
      state.country = action.payload.country || "";

      saveLocationToStorage(state);
    },

    // Old action bhi rakha hai, taaki existing code break na ho.
    setGroceryPincode: (state, action: PayloadAction<string>) => {
      const cleanPincode = String(action.payload || "")
        .replace(/\D/g, "")
        .slice(0, 6);

      state.pincode = cleanPincode;
      state.addressLine = "";
      state.city = "";
      state.state = "";
      state.country = "";

      saveLocationToStorage(state);
    },

    clearGroceryLocation: (state) => {
      state.pincode = "";
      state.addressLine = "";
      state.city = "";
      state.state = "";
      state.country = "";

      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("groceryPincode");
      }
    },

    // Old action bhi rakha hai.
    clearGroceryPincode: (state) => {
      state.pincode = "";
      state.addressLine = "";
      state.city = "";
      state.state = "";
      state.country = "";

      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("groceryPincode");
      }
    },
  },
});

export const {
  setGroceryLocation,
  setGroceryPincode,
  clearGroceryLocation,
  clearGroceryPincode,
} = groceryLocationSlice.actions;

export default groceryLocationSlice.reducer;