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

type Employee = {
  _id: string;
  employeeId?: string;
  name: string;
  email: string;
  availability: string;
};

type Ticket = {
  _id: string;
  ticketNo: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  userMessage: string;
  queryType?: "order" | "product" | "merchant" | "manual";
  createdAt?: string;
  userId?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  assignedEmployeeId?: {
    _id: string;
    employeeId?: string;
    name: string;
    email: string;
  } | null;
};

export default function MerchantSupportTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const res = await backendApi.get("/merchant/support/tickets");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await backendApi.get(
        "/merchant/support/employees?status=active&availability=available"
      );
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setEmployees(data);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, []);

  const acceptTicket = async (ticketId: string) => {
    try {
      await backendApi.patch(`/merchant/support/tickets/${ticketId}/accept`);
      await fetchTickets();
      await fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to accept ticket");
    }
  };

  const assignEmployee = async (ticketId: string, employeeId: string) => {
    if (!employeeId) return;

    try {
      await backendApi.patch(`/merchant/support/tickets/${ticketId}/assign`, {
        employeeId,
      });

      await fetchTickets();
      await fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign employee");
      await fetchEmployees();
    }
  };

  const canAcceptTicket = (ticket: Ticket) => {
    return (
      ticket.status === "pending_merchant_acceptance" ||
      ticket.status === "pending_review"
    );
  };

  const canAssignEmployee = (ticket: Ticket) => {
    return ticket.status === "accepted_by_merchant";
  };

  const canOpenChat = (ticket: Ticket) => {
    return ["assigned_to_employee", "in_progress", "resolved"].includes(
      ticket.status
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
            Merchant Support
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            User Queries
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Accept user queries and assign them to available employees.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchTickets();
            fetchEmployees();
          }}
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

          <h3 className="mt-4 text-xl font-black">No support queries</h3>

          <p className="mt-2 text-sm text-slate-300">
            User support queries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <article
              key={ticket._id}
              className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{ticket.ticketNo}</Badge>
                    <Badge>{ticket.status}</Badge>
                    <Badge>{ticket.priority}</Badge>
                    <Badge>{ticket.category}</Badge>

                    {ticket.queryType === "manual" && (
                      <Badge>Manual Query</Badge>
                    )}
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
                  </p>

                  {ticket.assignedEmployeeId && (
                    <p className="mt-2 text-sm font-bold text-emerald-200">
                      Assigned to:{" "}
                      {ticket.assignedEmployeeId.employeeId
                        ? `${ticket.assignedEmployeeId.employeeId} - `
                        : ""}
                      {ticket.assignedEmployeeId.name}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                  {canAcceptTicket(ticket) && (
                    <button
                      type="button"
                      onClick={() => acceptTicket(ticket._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white"
                    >
                      <CheckCircle2 size={16} />
                      Accept
                    </button>
                  )}

                  {canAssignEmployee(ticket) && (
                    <>
                      {employees.length > 0 ? (
                        <select
                          defaultValue=""
                          onChange={(event) =>
                            assignEmployee(ticket._id, event.target.value)
                          }
                          className="h-11 rounded-2xl border border-white/10 bg-[#031C12] px-3 text-sm font-bold text-white outline-none"
                        >
                          <option value="">Assign Available Employee</option>

                          {employees.map((employee) => (
                            <option key={employee._id} value={employee._id}>
                              {employee.employeeId
                                ? `${employee.employeeId} - `
                                : ""}
                              {employee.name} - {employee.availability}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100">
                          No available employee
                        </div>
                      )}
                    </>
                  )}

                  {canOpenChat(ticket) && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/merchant/support/${ticket._id}/chat`)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
                    >
                      <MessageCircle size={16} />
                      Chat
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