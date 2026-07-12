import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

interface MerchantData {
  _id: string;
  id?: string;
  merchantId: string;
  name: string;
  email: string;
  phone?: string;
  shopName: string;
  status: string;
  isPasswordChanged: boolean;
  role?: string;
}

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMerchant = async () => {
      try {
        setLoading(true);

        const res = await backendApi.get("/merchant/merchant/me", {
          withCredentials: true,
          skipAuthRefresh: true,
        } as any);

        if (!res.data?.success || res.data?.data?.role !== "merchant") {
          throw new Error("Merchant session invalid");
        }

        if (isMounted) {
          setMerchant(res.data.data);
        }
      } catch (error) {
        console.log("MERCHANT DASHBOARD AUTH ERROR:", error);

        if (isMounted) {
          navigate("/merchant/login", { replace: true });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMerchant();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await backendApi.post(
        "/merchant/merchant/logout",
        {},
        {
          withCredentials: true,
          skipAuthRefresh: true,
        } as any
      );
    } catch (error) {
      console.log("MERCHANT LOGOUT ERROR:", error);
    } finally {
      navigate("/merchant/login", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white">
        Loading merchant dashboard...
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#020617,#031C12,#052E16)] p-6 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-400/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.16)] backdrop-blur-2xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
              Merchant Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-black">
              {merchant.shopName}
            </h1>

            <p className="mt-2 text-slate-400">
              Welcome, {merchant.name} · {merchant.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 font-bold text-rose-100 hover:bg-rose-500/20"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-black/30 p-5">
            <p className="text-sm text-slate-400">Merchant ID</p>
            <p className="mt-2 text-2xl font-black text-emerald-200">
              {merchant.merchantId}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-black/30 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-black text-cyan-200">
              {merchant.status}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-black/30 p-5">
            <p className="text-sm text-slate-400">Password</p>
            <p className="mt-2 text-2xl font-black text-amber-200">
              {merchant.isPasswordChanged ? "Changed" : "Temporary"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
          <h2 className="text-xl font-black">Next Steps</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Product upload, stock, price, discount and approval flow will be
            added here.
          </p>
        </div>
      </div>
    </div>
  );
}