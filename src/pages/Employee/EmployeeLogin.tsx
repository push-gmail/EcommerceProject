import { useState } from "react";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

export default function EmployeeLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await backendApi.post(
        "/employee/login",
        {
          email,
          password,
        },
        {
          skipAuthRefresh: true,
        } as any
      );

      const employee = res.data?.data;

      if (!employee) {
        setError("Invalid employee response");
        return;
      }

      localStorage.setItem("employee", JSON.stringify(employee));

      navigate("/employee/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Employee login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#020617,#031C12,#052E16)] px-4 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-400/15 text-emerald-200">
            <Lock size={30} />
          </div>

          <h1 className="mt-5 text-3xl font-black">Employee Login</h1>

          <p className="mt-2 text-sm text-slate-300">
            Login with credentials sent by master.
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <label className="mt-6 block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Email
          </span>

          <div className="mt-2 flex h-12 items-center rounded-2xl border border-white/10 bg-white/10 px-4">
            <Mail size={18} className="text-slate-400" />

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="employee@gmail.com"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Password
          </span>

          <div className="mt-2 flex h-12 items-center rounded-2xl border border-white/10 bg-white/10 px-4">
            <Lock size={18} className="text-slate-400" />

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/25 disabled:opacity-60"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          Login
        </button>
      </form>
    </main>
  );
}