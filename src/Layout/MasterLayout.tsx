import { Outlet } from "react-router-dom";
import MasterSidebar from "../components/master/MasterSidebar";
import MasterNavbar from "../components/master/MasterNavbar";

export default function MasterLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.13),transparent_35%),linear-gradient(135deg,#020617,#031C12,#052E16)] text-slate-50">
      <MasterSidebar />

      <div className="min-h-screen pl-72">
        <div className="flex min-h-screen flex-col">
          <MasterNavbar />

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}