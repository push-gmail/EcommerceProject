import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

interface MasterUser {
  id: string;
  name: string;
  email: string;
  role: "master";
}

export default function MasterNavbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MasterUser | null>(null);

  const fetchMe = async () => {
    try {
      const res = await backendApi.get("/auth/master/me");
      setUser(res.data.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      await backendApi.post("/auth/master/logout");
    } finally {
      navigate("/master/login", { replace: true });
    }
  };

  return (
    <header className="border-b border-emerald-400/20 bg-black/20 px-6 py-4 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Master Panel</h2>
          <p className="text-sm text-slate-400">
            Manage grocery catalog and platform control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-400/20 bg-white/10 px-4 py-2">
            <p className="text-sm font-semibold text-emerald-100">
              {user?.name || "Master Admin"}
            </p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}