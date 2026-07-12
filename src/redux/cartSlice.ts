import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type CartProduct = {
  _id: string;
  title: string;
  image: string;
  price: number;
  mrp: number;
  variant: string;
  merchantId?: string;
  shopName?: string;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

const CART_STORAGE_KEY = "grocery_cart";

const loadCartFromStorage = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore localStorage error
  }
};

const initialState: CartState = {
  items: loadCartFromStorage(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartProduct>) => {
      const existingItem = state.items.find(
        (item) => item.product._id === action.payload._id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          product: action.payload,
          quantity: 1,
        });
      }

      saveCartToStorage(state.items);
    },

    increaseQuantity: (state, action: PayloadAction<string>) => {
      const existingItem = state.items.find(
        (item) => item.product._id === action.payload
      );

      if (existingItem) {
        existingItem.quantity += 1;
      }

      saveCartToStorage(state.items);
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const existingItem = state.items.find(
        (item) => item.product._id === action.payload
      );

      if (!existingItem) return;

      if (existingItem.quantity <= 1) {
        state.items = state.items.filter(
          (item) => item.product._id !== action.payload
        );
      } else {
        existingItem.quantity -= 1;
      }

      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.product._id !== action.payload
      );

      saveCartToStorage(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items);
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;