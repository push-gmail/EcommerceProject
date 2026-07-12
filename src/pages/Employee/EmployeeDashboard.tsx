import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Headphones, Loader2 } from "lucide-react";
import backendApi from "../../api/backendApi";

type Ticket = {
  _id: string;
  status: string;
};

export default function EmployeeDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const res = await backendApi.get("/employee/support/tickets");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      active: tickets.filter((item) =>
        ["assigned_to_employee", "in_progress"].includes(item.status)
      ).length,
      resolved: tickets.filter((item) => item.status === "resolved").length,
    };
  }, [tickets]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
          Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-black text-white">
          Support Overview
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Track assigned support tickets and resolved queries.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/10 text-white">
          <Loader2 className="animate-spin" size={20} />
          Loading dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Total Assigned"
            value={stats.total}
            icon={<Headphones size={24} />}
          />

          <StatCard
            title="Active Tickets"
            value={stats.active}
            icon={<Clock size={24} />}
          />

          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={<CheckCircle2 size={24} />}
          />
        </div>
      )}
    </section>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-300">{title}</p>
          <h2 className="mt-3 text-4xl font-black text-white">{value}</h2>
        </div>

        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-200">
          {icon}
        </div>
      </div>
    </div>
  );
}