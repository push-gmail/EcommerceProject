import { Navigate, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import MerchantLogin from "../pages/merchant/MerchantLogin";
import MerchantLayout from "../Layout/MerchantLayout";
import MerchantDashboard from "../pages/merchant/MerchantDashboard";
import MerchantProducts from "../pages/merchant/MerchantProducts";
import MerchantStocks from "../pages/merchant/MerchantStocks";
import MerchantRequests from "../pages/merchant/MerchantRequests";
import MerchantOrders from "../pages/merchant/MerchantOrders";
import MerchantSupportTickets from "../pages/merchant/MerchantSupportTickets";
import MerchantSupportChat from "../pages/merchant/MerchantSupportChat";

export default function MerchantRoutes() {
  return (
    <>
      <Route path="/merchant/login" element={<MerchantLogin />} />

      <Route element={<ProtectedRoute role="merchant" redirectTo="/merchant/login" />}>
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<Navigate to="/merchant/dashboard" replace />} />
          <Route path="dashboard" element={<MerchantDashboard />} />
          <Route path="products" element={<MerchantProducts />} />
          <Route path="stocks" element={<MerchantStocks />} />
          <Route path="requests/:status" element={<MerchantRequests />} />
          <Route path="orders" element={<MerchantOrders />} />
          <Route path="support" element={<MerchantSupportTickets />} />
          <Route path="support/:ticketId/chat" element={<MerchantSupportChat />} />
        </Route>
      </Route>
    </>
  );
}
