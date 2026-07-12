import { NavLink } from "react-router-dom";
import { Headphones, LayoutDashboard, UserRound } from "lucide-react";

type Employee = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

const menuItems = [
  {
    name: "Dashboard",
    path: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Assigned Tickets",
    path: "/employee/support",
    icon: Headphones,
  },
];

export default function EmployeeSidebar({
  employee,
}: {
  employee: Employee | null;
}) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-emerald-400/20 bg-[#020b08]/90 p-5 text-white shadow-[0_0_45px_rgba(16,185,129,0.12)] backdrop-blur-2xl">
      <div className="flex h-full flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight">
            Employee<span className="text-emerald-300">Panel</span>
          </h1>

          <p className="mt-1 text-sm text-slate-400">Support Dashboard</p>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-200">
              <UserRound size={22} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black">
                {employee?.name || "Employee"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {employee?.email || "Support Team"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    isActive
                      ? "border border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-cyan-400/15 to-blue-500/20 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.22)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            Support Access
          </p>

          <p className="mt-2 text-sm leading-5 text-slate-300">
            Handle assigned user queries and resolve tickets.
          </p>
        </div>
      </div>
    </aside>
  );
}