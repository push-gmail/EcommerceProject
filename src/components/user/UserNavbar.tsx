import { useEffect, useState } from "react";
import { LogOut, Menu, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

interface UserInfo {
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  wallet: {
    balance: number;
  };
}

export default function UserNavbar() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<UserInfo | null>(null);

  const fetchMe = async () => {
    try {
      const res = await backendApi.get("/user/me");
      setInfo(res.data.data);
    } catch {
      navigate("/user/login", { replace: true });
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      await backendApi.post("/user/logout");
    } catch {
      // ignore
    }

    navigate("/user/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-400/20 bg-[#020b08]/75 px-4 py-4 text-white backdrop-blur-2xl lg:px-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-white/10 text-emerald-100 lg:hidden">
            <Menu size={18} />
          </button>

          <div>
            <h2 className="text-xl font-black tracking-tight">User Panel</h2>
            <p className="text-sm text-slate-400">
              Buy products using wallet balance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-2xl border border-emerald-400/20 bg-white/10 px-4 py-2 backdrop-blur-xl md:flex md:items-center md:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
              <Wallet size={18} />
            </div>

            <div>
              <p className="text-sm font-black text-white">
                ₹{info?.wallet?.balance || 0}
              </p>
              <p className="text-xs text-slate-400">
                {info?.user?.email || "user@email.com"}
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