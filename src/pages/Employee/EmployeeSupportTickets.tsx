import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Headphones,
  Loader2,
  MessageCircle,
  RefreshCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

type Ticket = {
  _id: string;
  ticketNo: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  userMessage: string;
  createdAt?: string;
  userId?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

const formatDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EmployeeSupportTickets() {
  const navigate = useNavigate();

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

  const resolveTicket = async (ticketId: string) => {
    const ok = window.confirm("Mark this ticket as resolved?");

    if (!ok) return;

    try {
      await backendApi.patch(`/employee/support/tickets/${ticketId}/resolve`);
      await fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to resolve ticket");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
            Assigned Tickets
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            Support Queries
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Handle assigned user queries and resolve them.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/10 text-white">
          <Loader2 className="animate-spin" size={20} />
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-center text-white">
          <Headphones size={48} className="text-emerald-300" />

          <h3 className="mt-4 text-xl font-black">No assigned tickets</h3>

          <p className="mt-2 text-sm text-slate-300">
            Assigned user queries will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tickets.map((ticket) => (
            <article
              key={ticket._id}
              className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{ticket.ticketNo}</Badge>
                    <Badge>{ticket.status}</Badge>
                    <Badge>{ticket.priority}</Badge>
                    <Badge>{ticket.category}</Badge>
                  </div>

                  <h2 className="mt-3 text-xl font-black text-white">
                    {ticket.subject}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {ticket.userMessage}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    User:{" "}
                    {ticket.userId?.name ||
                      ticket.userId?.email ||
                      ticket.userId?.phone ||
                      "User"}
                    {formatDate(ticket.createdAt) &&
                      ` • ${formatDate(ticket.createdAt)}`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/employee/support/${ticket._id}/chat`)
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white"
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>

                  {ticket.status !== "resolved" && (
                    <button
                      type="button"
                      onClick={() => resolveTicket(ticket._id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
                    >
                      <CheckCircle2 size={16} />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-black text-cyan-100">
      {children}
    </span>
  );
}