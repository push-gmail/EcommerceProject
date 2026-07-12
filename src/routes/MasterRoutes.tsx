import { Navigate, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import MasterLogin from "../pages/masters/MasterLogin";
import MasterLayout from "../Layout/MasterLayout";
import Dashboard from "../pages/masters/Dashboard";
import Categories from "../pages/masters/Categories";
import SubCategories from "../pages/masters/SubCategories";
import SubSubCategories from "../pages/masters/SubSubCategories";
import Items from "../pages/masters/Items";
import Brands from "../pages/masters/Brands";
import Merchants from "../pages/masters/Merchants";
import MyStocks from "../components/master/MyStocks";
import ProductDetails from "../pages/masters/ProductDetails";
import ProductRequests from "../pages/masters/ProductRequests";
import MasterEmployees from "../components/master/MasterEmployees";



export default function MasterRoutes() {
  return (
    <>
      <Route path="/master/login" element={<MasterLogin />} />

      <Route
        element={<ProtectedRoute role="master" redirectTo="/master/login" />}
      >
        <Route path="/master" element={<MasterLayout />}>
          <Route index element={<Navigate to="/master/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sub-categories" element={<SubCategories />} />
          <Route path="sub-sub-categories" element={<SubSubCategories />} />
          <Route path="items" element={<Items />} />
          <Route path="brands" element={<Brands />} />
          <Route path="merchants" element={<Merchants />} />
          <Route path="my-stocks" element={<MyStocks />} />
          <Route path="product-details" element={<ProductDetails />} />
          <Route path="requests/:status" element={<ProductRequests />} />
          <Route path="employees" element={<MasterEmployees />} />
        </Route>
      </Route>
    </>
  );
}