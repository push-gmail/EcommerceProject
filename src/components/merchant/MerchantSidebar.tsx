import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  Settings,
  UserRound,
  BarChart3,
  Tags,
  Boxes,
  Warehouse,
  ClipboardList,
  ChevronDown,
  Headphones
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/merchant/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    path: "/merchant/products",
    icon: PackageSearch,
  },
  {
    name: "Stocks",
    path: "/merchant/stocks",
    icon: Warehouse,
  },
  {
    name: "Orders",
    path: "/merchant/orders",
    icon: ShoppingBag,
  },
  {
  name: "Support",
  path: "/merchant/support",
  icon: Headphones,
},
  {
    name: "Inventory",
    path: "/merchant/inventory",
    icon: Boxes,
  },
  {
    name: "Offers",
    path: "/merchant/offers",
    icon: Tags,
  },
  {
    name: "Reports",
    path: "/merchant/reports",
    icon: BarChart3,
  },
  {
    name: "Profile",
    path: "/merchant/profile",
    icon: UserRound,
  },
  {
    name: "Settings",
    path: "/merchant/settings",
    icon: Settings,
  },
];

const requestMenu = [
  {
    name: "Pending",
    path: "/merchant/requests/pending",
  },
  {
    name: "Approved",
    path: "/merchant/requests/approved",
  },
  {
    name: "Rejected",
    path: "/merchant/requests/rejected",
  },
  {
    name: "All",
    path: "/merchant/requests/all",
  },
];

export default function MerchantSidebar() {
  const [requestsOpen, setRequestsOpen] = useState(true);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-emerald-400/20 bg-[#020b08]/90 p-5 text-white shadow-[0_0_45px_rgba(16,185,129,0.12)] backdrop-blur-2xl">
      <div className="flex h-full flex-col">
        <div className="mb-9 shrink-0">
          <h1 className="text-2xl font-black tracking-tight">
            Merchant<span className="text-emerald-300">Panel</span>
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Grocery Seller Control
          </p>
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

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setRequestsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
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

        <div className="mt-5 shrink-0 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            Merchant Access
          </p>

          <p className="mt-2 text-sm leading-5 text-slate-300">
            Manage products, stock, pricing and approval requests.
          </p>
        </div>
      </div>
    </aside>
  );
}