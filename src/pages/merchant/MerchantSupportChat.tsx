import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import backendApi from "../../api/backendApi";
import getSupportSocket, { joinSupportTicketRoom, leaveSupportTicketRoom } from "../../socket/supportSocket";

type Message = {
  _id: string;
  ticketId: string;
  senderRole: "user" | "merchant" | "employee" | "ai";
  senderName?: string;
  message: string;
};

type Ticket = {
  _id: string;
  ticketNo: string;
  subject: string;
  status: string;
};

export default function MerchantSupportChat() {
  const navigate = useNavigate();
  const { ticketId = "" } = useParams();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const res = await backendApi.get(
        `/merchant/support/tickets/${ticketId}/messages`
      );

      const data = res.data?.data || {};

      setTicket(data.ticket || null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to load chat");
      navigate("/merchant/support");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!ticketId) return;

  fetchMessages();

  joinSupportTicketRoom(ticketId);

  const socket = getSupportSocket();

  const handleNewMessage = (payload: any) => {
    if (String(payload?.ticketId) !== String(ticketId)) return;

    const newMessage = payload?.message;

    if (!newMessage?._id) return;

    setMessages((prev) => {
      if (prev.some((item) => item._id === newMessage._id)) {
        return prev;
      }

      return [...prev, newMessage];
    });
  };

  const handleTicketAssigned = (payload: any) => {
    if (String(payload?.ticketId) !== String(ticketId)) return;

    setTicket((prev) =>
      prev
        ? {
            ...prev,
            status: payload?.status || prev.status,
          }
        : prev
    );
  };

  socket.on("support-message-created", handleNewMessage);
  socket.on("support-ticket-assigned", handleTicketAssigned);

  return () => {
    socket.off("support-message-created", handleNewMessage);
    socket.off("support-ticket-assigned", handleTicketAssigned);
    leaveSupportTicketRoom(ticketId);
  };
}, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    try {
      setSending(true);

      const res = await backendApi.post(
        `/merchant/support/tickets/${ticketId}/messages`,
        {
          message: cleanMessage,
        }
      );

      setMessage("");

      const newMessage = res.data?.data;

      if (newMessage?._id) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex h-[calc(100vh-118px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <button
          type="button"
          onClick={() => navigate("/merchant/support")}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/15"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-black text-white">
            {ticket?.subject || "Support Chat"}
          </h1>

          <p className="text-xs text-slate-400">
            {ticket?.ticketNo || "Ticket"} • {ticket?.status || "active"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-white">
            <Loader2 className="animate-spin" size={20} />
            Loading chat...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-300">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item) => {
              const isMine = item.senderRole === "merchant";

              return (
                <div
                  key={item._id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[78%] rounded-3xl px-4 py-3 ${
                      isMine
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">
                      {item.senderName || item.senderRole}
                    </p>

                    <p className="text-sm leading-6">{item.message}</p>
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-white/10 p-4">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Type message..."
          className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500"
        />

        <button
          type="button"
          onClick={sendMessage}
          disabled={sending}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white disabled:opacity-60"
        >
          {sending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </section>
  );
}