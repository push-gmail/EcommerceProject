import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

// const clearMerchantBrowserCookiesFallback = () => {
//   ["merchantAccessToken", "merchantRefreshToken"].forEach((cookieName) => {
//     document.cookie = `${cookieName}=; Max-Age=0; path=/`;
//     document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
//   });
// };

export default function MerchantLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // useEffect(() => {
  //   const clearOldMerchantSession = async () => {
  //     try {
  //       await backendApi.post(
  //         "/merchant/merchant/logout-public",
  //         {},
  //         {
  //           withCredentials: true,
  //           skipAuthRefresh: true,
  //         } as any
  //       );
  //     } catch {
  //       clearMerchantBrowserCookiesFallback();
  //     }
  //   };
  //
  //   clearOldMerchantSession();
  // }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError("Email is required");
      return;
    }

    if (!cleanPassword) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await backendApi.post(
        "/merchant/merchant-login",
        {
          email: cleanEmail,
          password: cleanPassword,
        },
        {
          withCredentials: true,
          skipAuthRefresh: true,
        } as any
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Merchant login failed");
      }

      console.log("LOGIN SUCCESS RESPONSE:", res.data);
      console.log("NOW NAVIGATING TO /merchant/dashboard");

      navigate("/merchant/dashboard", { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Merchant login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_35%),linear-gradient(135deg,#020617,#031C12,#052E16)] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-36 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-emerald-400/20 bg-white/10 p-7 shadow-[0_0_60px_rgba(16,185,129,0.20)] backdrop-blur-2xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
            <span className="text-2xl font-black text-emerald-200">M</span>
          </div>

          <div className="mb-3 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
            Merchant Access
          </div>

          <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
            Merchant Login
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Login using the email and temporary password sent by Master Admin.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@gmail.com"
              autoComplete="email"
              className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 pr-20 text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-200 hover:text-cyan-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login to Merchant Panel"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-xs leading-5 text-amber-100">
            Use the temporary password sent to your email. After first login,
            change your password for security.
          </p>
        </div>
      </div>
    </div>
  );
}