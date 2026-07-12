import { Outlet } from "react-router-dom";
import MerchantSidebar from "../components/merchant/MerchantSidebar";
import MerchantNavbar from "../components/merchant/MerchantNavbar";

export default function MerchantLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_30%),linear-gradient(135deg,#020617,#031C12,#052E16)] text-white">
      <MerchantSidebar />

      <div className="min-h-screen lg:pl-72">
        <MerchantNavbar />

        <main className="p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}