import { Navigate, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import GroceryLayout from "../Layout/GroceryLayout";
import UserProfileLayout from "../Layout/UserProfile";

import UserSignup from "../pages/user/UserSignup";
import UserGroceryHome from "../pages/user/UserGroceryHome";
import UserProductDetails from "../pages/user/UserProductDetails";
import UserMyAccount from "../pages/user/UserMyAccount";
import UserDeposit from "../pages/user/UserDeposit";
import UserAddresses from "../pages/user/UserAddresses";
import UserCart from "../pages/user/UserCart";
import UserOrders from "../pages/user/UserOrders";
import UserSupportTickets from "../pages/user/UserSupportTickets";
import UserSupportChat from "../pages/user/UserSupportChat";



export default function GroceryRoutes() {
  return (
    <>
      <Route path="/signup" element={<UserSignup />} />

      {/* Old user URLs redirect only */}
      <Route path="/user/login" element={<Navigate to="/grocery" replace />} />
      <Route path="/user/signup" element={<Navigate to="/signup" replace />} />
      <Route path="/user" element={<Navigate to="/grocery" replace />} />
      <Route path="/user/grocery" element={<Navigate to="/grocery" replace />} />

      <Route path="/user/product/:id" element={<NavigateToNewProductRoute />} />

      {/* Common grocery layout: GroceryHeader + GroceryMenuHeader same rahega */}
      <Route element={<GroceryLayout />}>
        <Route path="/grocery" element={<UserGroceryHome />} />
        <Route path="/grocery/product/:id" element={<UserProductDetails />} />

        {/* Optional old product route */}
        {/* <Route path="/product/:id" element={<UserProductDetails />} /> */}
        <Route path="/grocery/cart" element={<UserCart />} />
        <Route path="/grocery/orders" element={<UserOrders />} />

        {/* Profile routes under /grocery */}
        <Route element={<ProtectedRoute role="user" redirectTo="/grocery" />}>
          <Route path="/grocery/myprofile" element={<UserProfileLayout />}>
            <Route index element={<UserMyAccount />} />
            <Route path="account" element={<UserMyAccount />} />
            <Route path="deposit" element={<UserDeposit />} />
            <Route path="support" element={<UserSupportTickets />} />
<Route path="support/:ticketId/chat" element={<UserSupportChat/>} />

            {/* Future pages */}
             {/* <Route path="orders" element={<UserOrders />} /> */} 
            {/* <Route path="wishlist" element={<UserWishlist />} /> */}
            {/* <Route path="coupons" element={<UserCoupons />} /> */}
            {/* <Route path="addresses" element={<UserAddresses />} /> */}
            <Route path="orders" element={<UserOrders />} />

            <Route path="addresses" element={<UserAddresses />} />
          </Route>
        </Route>
      </Route>
    </>
  );
}

function NavigateToNewProductRoute() {
  const productId = window.location.pathname.split("/").pop() || "";
  return <Navigate to={`/grocery/product/${productId}`} replace />;
}