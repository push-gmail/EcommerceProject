import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Store, Menu } from "lucide-react";
import backendApi from "../../api/backendApi";

interface MerchantData {
  id: string;
  _id: string;
  merchantId: string;
  name: string;
  email: string;
  shopName: string;
  status: string;
  isPasswordChanged: boolean;
  role: "merchant";
}

export default function MerchantNavbar() {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);

  const fetchMe = async () => {
    try {
      const res = await backendApi.get("/merchant/merchant/me");
      setMerchant(res.data.data);
    } catch {
      setMerchant(null);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      await backendApi.post("/merchant/merchant/logout");
    } finally {
      navigate("/merchant/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-400/20 bg-[#020b08]/75 px-4 py-4 text-white backdrop-blur-2xl lg:px-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-white/10 text-emerald-100 lg:hidden">
            <Menu size={18} />
          </button>

          <div>
            <h2 className="text-xl font-black tracking-tight">
              Merchant Panel
            </h2>
            <p className="text-sm text-slate-400">
              Manage your grocery store products and operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-2xl border border-emerald-400/20 bg-white/10 px-4 py-2 backdrop-blur-xl md:flex md:items-center md:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
              <Store size={18} />
            </div>

            <div>
              <p className="text-sm font-black text-white">
                {merchant?.shopName || "Merchant Shop"}
              </p>
              <p className="text-xs text-slate-400">
                {merchant?.email || "merchant@email.com"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-500/20"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}