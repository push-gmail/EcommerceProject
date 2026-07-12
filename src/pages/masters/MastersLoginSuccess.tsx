import { useNavigate } from "react-router-dom";

interface MasterUser {
  id: string;
  name: string;
  email: string;
}

export default function MasterLoginSuccess() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("masterUser");
  const user: MasterUser | null = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("masterLogin");
    localStorage.removeItem("masterUser");
    navigate("/master/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.20),transparent_30%),linear-gradient(135deg,#020617,#031C12,#052E16)] px-4 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-emerald-400/25 bg-white/10 p-8 text-center shadow-[0_0_55px_rgba(16,185,129,0.22)] backdrop-blur-2xl">
        <h1 className="text-3xl font-black text-emerald-300">
          Login Successful
        </h1>

        <p className="mt-3 text-slate-300">
          Welcome {user?.name || "Master Admin"}
        </p>

        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>

        <button
          onClick={handleLogout}
          className="mt-7 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 font-semibold text-rose-100 transition hover:bg-rose-500/20"
        >
          Logout
        </button>
      </div>
    </div>
  );
}