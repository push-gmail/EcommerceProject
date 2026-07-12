import { useEffect, useState } from "react";
import {
  AlertCircle,
  Headphones,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCcw,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import backendApi from "../../api/backendApi";

type Order = {
  _id: string;
  orderNo: string;
  status: string;
  grandTotal: number;
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
  assignedEmployeeId?: {
    name?: string;
    email?: string;
  } | null;
};

const emptyForm = {
  orderId: "",
  subject: "",
  category: "general",
  priority: "normal",
  message: "",
};

export default function UserSupportTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(emptyForm);

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [raising, setRaising] = useState(false);
  const [manualRaising, setManualRaising] = useState(false);
  const [error, setError] = useState("");
  const [manualError, setManualError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const res = await backendApi.get("/user/support/tickets");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await backendApi.get("/user/orders/my-orders");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setOrders(data);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchOrders();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const raiseTicket = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setRaising(true);
      setError("");
      setSuccessMessage("");

      if (!form.orderId) {
        setError("Please select order");
        return;
      }

      if (!form.subject.trim()) {
        setError("Subject is required");
        return;
      }

      if (!form.message.trim()) {
        setError("Message is required");
        return;
      }

      await backendApi.post("/user/support/tickets", {
        orderId: form.orderId,
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        message: form.message,
      });

      setForm(emptyForm);
      setSuccessMessage("Order query submitted successfully");
      await fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to raise query");
    } finally {
      setRaising(false);
    }
  };

  const raiseManualQuery = async () => {
    try {
      setManualRaising(true);
      setManualError("");
      setSuccessMessage("");

      const cleanQuery = manualQuery.trim();

      if (!cleanQuery) {
        setManualError("Please enter your query");
        return;
      }

      await backendApi.post("/user/support/tickets", {
        queryType: "manual",
        subject: "Manual Query",
        category: "general",
        priority: "normal",
        message: cleanQuery,
      });

      setManualQuery("");
      setManualModalOpen(false);
      setSuccessMessage("Manual query submitted successfully");
      await fetchTickets();
    } catch (err: any) {
      setManualError(
        err.response?.data?.message || "Failed to submit manual query"
      );
    } finally {
      setManualRaising(false);
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#212121]">
                Customer Support
              </h1>

              <p className="mt-1 text-sm text-[#878787]">
                Raise query for your orders or submit a manual query.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setManualError("");
                setManualQuery("");
                setManualModalOpen(true);
              }}
              className="flex h-11 items-center justify-center gap-2 rounded bg-[#26a541] px-5 text-sm font-bold text-white"
            >
              <Plus size={17} />
              Manual Query
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 bg-green-50 p-4 text-sm font-semibold text-green-700 shadow-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={raiseTicket} className="bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-[#2874f0]" />

            <h2 className="text-lg font-bold text-[#212121]">
              Raise Order Query
            </h2>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded bg-red-50 p-3 text-sm font-semibold text-red-600">
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-[#424242]">
                Order
              </span>

              <select
                name="orderId"
                value={form.orderId}
                onChange={handleChange}
                className="mt-2 h-11 w-full border border-[#d7d7d7] px-3 text-sm outline-none focus:border-[#2874f0]"
              >
                <option value="">Select order</option>

                {orders.map((order) => (
                  <option key={order._id} value={order._id}>
                    {order.orderNo} - ₹{order.grandTotal} - {order.status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#424242]">
                Subject
              </span>

              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="mt-2 h-11 w-full border border-[#d7d7d7] px-3 text-sm outline-none focus:border-[#2874f0]"
                placeholder="Example: Delivery issue"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#424242]">
                Category
              </span>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="mt-2 h-11 w-full border border-[#d7d7d7] px-3 text-sm outline-none focus:border-[#2874f0]"
              >
                <option value="general">General</option>
                <option value="order">Order</option>
                <option value="product">Product</option>
                <option value="payment">Payment</option>
                <option value="delivery">Delivery</option>
                <option value="refund">Refund</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#424242]">
                Priority
              </span>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="mt-2 h-11 w-full border border-[#d7d7d7] px-3 text-sm outline-none focus:border-[#2874f0]"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-[#424242]">
              Message
            </span>

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              className="mt-2 w-full resize-none border border-[#d7d7d7] p-3 text-sm outline-none focus:border-[#2874f0]"
              placeholder="Explain your issue..."
            />
          </label>

          <button
            type="submit"
            disabled={raising}
            className="mt-5 flex h-11 items-center justify-center gap-2 rounded bg-[#2874f0] px-6 text-sm font-bold text-white disabled:opacity-60"
          >
            {raising && <Loader2 className="animate-spin" size={17} />}
            Submit Order Query
          </button>
        </form>

        <div className="bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#212121]">My Queries</h2>

            <button
              type="button"
              onClick={fetchTickets}
              className="flex items-center gap-2 rounded bg-[#26a541] px-4 py-2 text-sm font-bold text-white"
            >
              <RefreshCcw size={15} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-5 flex min-h-[180px] items-center justify-center gap-2 text-sm font-semibold text-[#424242]">
              <Loader2 className="animate-spin" size={18} />
              Loading queries...
            </div>
          ) : tickets.length === 0 ? (
            <div className="mt-5 flex min-h-[180px] flex-col items-center justify-center text-center">
              <Headphones size={42} className="text-[#878787]" />

              <h3 className="mt-3 text-lg font-bold text-[#212121]">
                No queries yet
              </h3>

              <p className="mt-1 text-sm text-[#878787]">
                Your support queries will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket._id} className="border border-[#eeeeee] p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{ticket.ticketNo}</Badge>
                        <Badge>
                          {ticket.queryType === "manual"
                            ? "manual"
                            : ticket.status}
                        </Badge>
                        <Badge>{ticket.priority}</Badge>
                        <Badge>{ticket.category}</Badge>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-[#212121]">
                        {ticket.subject}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[#616161]">
                        {ticket.userMessage}
                      </p>

                      {ticket.assignedEmployeeId?.name && (
                        <p className="mt-2 text-sm font-semibold text-[#26a541]">
                          Assigned to: {ticket.assignedEmployeeId.name}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/grocery/myprofile/support/${ticket._id}/chat`
                        )
                      }
                      className="flex h-10 items-center justify-center gap-2 rounded bg-[#2874f0] px-4 text-sm font-bold text-white"
                    >
                      <MessageCircle size={16} />
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {manualModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-[#212121] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Manual Query</h2>
                <p className="mt-1 text-sm text-[#878787]">
                  Enter your query below. No order selection is required.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f5f5f5]"
              >
                <X size={20} />
              </button>
            </div>

            {manualError && (
              <div className="mt-4 flex items-center gap-2 rounded bg-red-50 p-3 text-sm font-semibold text-red-600">
                <AlertCircle size={17} />
                {manualError}
              </div>
            )}

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[#424242]">
                What is your query?
              </span>

              <textarea
                value={manualQuery}
                onChange={(event) => {
                  setManualError("");
                  setManualQuery(event.target.value);
                }}
                rows={6}
                className="mt-2 w-full resize-none border border-[#d7d7d7] p-3 text-sm outline-none focus:border-[#2874f0]"
                placeholder="Write your query here..."
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="h-10 rounded border border-[#d7d7d7] px-5 text-sm font-bold text-[#424242]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={raiseManualQuery}
                disabled={manualRaising}
                className="flex h-10 items-center justify-center gap-2 rounded bg-[#2874f0] px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {manualRaising && (
                  <Loader2 className="animate-spin" size={17} />
                )}
                Submit Manual Query
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#f1f3f6] px-3 py-1 text-xs font-bold text-[#424242]">
      {children}
    </span>
  );
}