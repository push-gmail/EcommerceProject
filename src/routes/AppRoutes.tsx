import { Navigate, Route, Routes } from "react-router-dom";

import GroceryRoutes from "./GroceryRoutes";
import MasterRoutes from "./MasterRoutes";
import MerchantRoutes from "./MerchantRoutes";
import EmployeeRoutes from "./EmployeeRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/grocery" replace />} />

      {GroceryRoutes()}
      {MasterRoutes()}
      {MerchantRoutes()}
      {EmployeeRoutes()}

      <Route path="*" element={<Navigate to="/grocery" replace />} />
    </Routes>
  );
}