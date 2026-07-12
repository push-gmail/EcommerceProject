import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import backendApi from "../api/backendApi";
import EmployeeSidebar from "../components/employee/EmployeeSidebar";

type Employee = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);

  const fetchMe = async () => {
    try {
      const res = await backendApi.get("/employee/me");
      const data = res.data?.data || null;

      if (!data) {
        navigate("/employee/login", { replace: true });
        return;
      }

      setEmployee(data);
      localStorage.setItem("employee", JSON.stringify(data));
    } catch {
      setEmployee(null);
      navigate("/employee/login", { replace: true });
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      await backendApi.post("/employee/logout", undefined, {
        skipAuthRefresh: true,
      } as any);
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("employee");
      navigate("/employee/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_30%),linear-gradient(135deg,#020617,#031C12,#052E16)] text-white">
      <EmployeeSidebar employee={employee} />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020b08]/80 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                Employee Panel
              </p>

              <h1 className="text-xl font-black">
                Welcome {employee?.name || "Employee"}
              </h1>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-100 hover:bg-red-400/20"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-7">
          <Outlet context={{ employee, refreshEmployee: fetchMe }} />
        </main>
      </div>
    </div>
  );
}