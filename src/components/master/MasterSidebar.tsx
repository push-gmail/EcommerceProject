import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  PackageSearch,
  Tags,
  Users,
  Boxes,
  ClipboardList,
  ChevronDown,
  Wallet,
  UserCog
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    path: "/master/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Categories",
    path: "/master/categories",
    icon: Layers,
  },
  {
    name: "Sub Categories",
    path: "/master/sub-categories",
    icon: Layers,
  },
  {
    name: "Sub-Sub Categories",
    path: "/master/sub-sub-categories",
    icon: Layers,
  },
  {
    name: "Items",
    path: "/master/items",
    icon: PackageSearch,
  },
  {
    name: "Brands",
    path: "/master/brands",
    icon: Tags,
  },
  {
    name: "Merchants",
    path: "/master/merchants",
    icon: Users,
  },
  {
    name: "My Stocks",
    path: "/master/my-stocks",
    icon: Boxes,
  },
  {
    name:"Product Details",
    path:"/master/product-details",
    icon:Boxes,
  },
  {
  name: "Employees",
  path: "/master/employees",
  icon: UserCog,
},
];

const requestMenu = [
  {
    name: "Pending",
    path: "/master/requests/pending",
  },
  {
    name: "Approved",
    path: "/master/requests/approved",
  },
  {
    name: "Rejected",
    path: "/master/requests/rejected",
  },
  {
    name: "All",
    path: "/master/requests/all",
  },

  {
  name: "User Deposits",
  path: "/master/user-deposits",
  icon: Wallet,
}
];

export default function MasterSidebar() {
  const [requestsOpen, setRequestsOpen] = useState(true);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-emerald-400/20 bg-[#020b08]/90 p-5 text-white shadow-[0_0_45px_rgba(16,185,129,0.12)] backdrop-blur-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight">
          Emerald<span className="text-emerald-300">Panel</span>
        </h1>

        <p className="mt-1 text-sm text-slate-400">Grocery Master Control</p>
      </div>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-cyan-400/15 to-blue-500/20 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setRequestsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="flex items-center gap-3">
              <ClipboardList size={18} />
              Requests
            </span>

            <ChevronDown
              size={16}
              className={`transition ${requestsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {requestsOpen && (
            <div className="mt-2 space-y-1 pl-5">
              {requestMenu.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}