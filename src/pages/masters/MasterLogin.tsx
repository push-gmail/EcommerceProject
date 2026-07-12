import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import backendApi from "../../api/backendApi";

interface MasterLoginResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: "master";
  };
}

interface LoginForm {
  email: string;
  password: string;
}

export default function MasterLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await backendApi.post<MasterLoginResponse>("/auth/master/login", form);

      navigate("/master/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.20),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.14),transparent_36%),linear-gradient(135deg,#020617,#031C12,#052E16)] px-4 text-white">
      <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -right-20 top-28 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-black/10" />

      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-md rounded-[2rem] border border-emerald-400/25 bg-white/10 p-8 shadow-[0_0_55px_rgba(16,185,129,0.22)] backdrop-blur-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_35px_rgba(16,185,129,0.28)]">
            <ShieldCheck className="text-emerald-300" size={32} />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">
            Emerald Command
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-400">
            Grocery Master Panel Login
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Master Email
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 transition focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-300/20">
              <Mail size={18} className="text-emerald-300" />

              <input
                type="email"
                placeholder="master@grocery.com"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Password
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-black/35 px-4 py-3 transition focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-300/20">
              <LockKeyhole size={18} className="text-emerald-300" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 transition hover:text-cyan-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-5 py-3 font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] hover:shadow-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          Secure access with masterAccessToken
        </div>
      </form>
    </div>
  );
}