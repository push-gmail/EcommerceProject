import { configureStore } from "@reduxjs/toolkit";

import groceryLocationReducer from "./slices/groceryLocationSlice";
import cartReducer from "./cartSlice";


export const store = configureStore({
  reducer: {
    groceryLocation: groceryLocationReducer,
    cart: cartReducer,

    // your other reducers here
    // auth: authReducer,
    // user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;