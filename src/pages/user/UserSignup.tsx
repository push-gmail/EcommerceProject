import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

export default function UserSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await backendApi.post("/user/signup", form);

      navigate("/user/login", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] p-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[2rem] border border-emerald-400/20 bg-white/10 p-7 backdrop-blur-2xl"
      >
        <h1 className="text-3xl font-black">User Signup</h1>

        <p className="mt-1 text-sm text-slate-400">
          Create your grocery user account.
        </p>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <input
            placeholder="Name"
            className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />

          <input
            placeholder="Phone"
            className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />
        </div>

        <button
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Signup"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already have account?{" "}
          <Link to="/user/login" className="font-bold text-emerald-300">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}