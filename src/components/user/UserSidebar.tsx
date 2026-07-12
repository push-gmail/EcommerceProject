import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Wallet,
  ShoppingBag,
  UserRound,
  ClipboardList,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/user/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Shop",
    path: "/user/shop",
    icon: ShoppingBag,
  },
  {
    name: "Create Account",
    path: "/user/accounts",
    icon: UserRound,
  },
  {
    name: "Deposit",
    path: "/user/deposit",
    icon: Wallet,
  },
  {
    name: "Orders",
    path: "/user/orders",
    icon: ClipboardList,
  },
  {
    name: "Settings",
    path: "/user/settings",
    icon: Settings,
  },
];

export default function UserSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-emerald-400/20 bg-[#020b08]/90 p-5 text-white shadow-[0_0_45px_rgba(16,185,129,0.12)] backdrop-blur-2xl lg:block">
      <div className="mb-9">
        <h1 className="text-2xl font-black tracking-tight">
          User<span className="text-emerald-300">Panel</span>
        </h1>

        <p className="mt-1 text-sm text-slate-400">Grocery Shopping Control</p>
      </div>

      <nav className="space-y-2">
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
    </aside>
  );
}