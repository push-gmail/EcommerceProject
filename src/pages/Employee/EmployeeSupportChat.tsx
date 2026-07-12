import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import backendApi from "../../api/backendApi";
import getSupportSocket, {
  joinSupportTicketRoom,
  leaveSupportTicketRoom,
} from "../../socket/supportSocket";

type Message = {
  _id: string;
  ticketId: string;
  senderId?: string | null;
  senderRole: "user" | "merchant" | "employee" | "ai";
  senderName?: string;
  message: string;
  messageType?: "text" | "image" | "file" | "rating_request" | "rating";
  createdAt?: string;
};

type Ticket = {
  _id: string;
  ticketNo: string;
  subject: string;
  status: string;
  aiAutoReplyEnabled?: boolean;
  aiSuggestions?: string[];
  ratingRequested?: boolean;
  rating?: number | null;
};

export default function EmployeeSupportChat() {
  const navigate = useNavigate();
  const { ticketId = "" } = useParams();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const res = await backendApi.get(
        `/employee/support/tickets/${ticketId}/messages`
      );

      const data = res.data?.data || {};

      setTicket(data.ticket || null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setAiSuggestions(
        Array.isArray(data.ticket?.aiSuggestions)
          ? data.ticket.aiSuggestions
          : []
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to load chat");
      navigate("/employee/support");
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

    const handleTicketResolved = (payload: any) => {
      if (String(payload?.ticketId) !== String(ticketId)) return;

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: payload?.status || "resolved",
            }
          : prev
      );
    };

    const handleAiSuggestions = (payload: any) => {
      if (String(payload?.ticketId) !== String(ticketId)) return;

      const suggestions = Array.isArray(payload?.suggestions)
        ? payload.suggestions
        : [];

      setAiSuggestions(suggestions);

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              aiSuggestions: suggestions,
            }
          : prev
      );
    };

    const handleAiAutoUpdated = (payload: any) => {
      if (String(payload?.ticketId) !== String(ticketId)) return;

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              aiAutoReplyEnabled: Boolean(payload?.aiAutoReplyEnabled),
            }
          : prev
      );
    };

    const handleRatingSubmitted = (payload: any) => {
      if (String(payload?.ticketId) !== String(ticketId)) return;

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              rating: payload?.rating || prev.rating,
              ratingRequested: false,
            }
          : prev
      );
    };

    socket.on("support-message-created", handleNewMessage);
    socket.on("support-ticket-assigned", handleTicketAssigned);
    socket.on("support-ticket-resolved", handleTicketResolved);
    socket.on("support-ai-suggestions", handleAiSuggestions);
    socket.on("support-ai-auto-updated", handleAiAutoUpdated);
    socket.on("support-rating-submitted", handleRatingSubmitted);

    return () => {
      socket.off("support-message-created", handleNewMessage);
      socket.off("support-ticket-assigned", handleTicketAssigned);
      socket.off("support-ticket-resolved", handleTicketResolved);
      socket.off("support-ai-suggestions", handleAiSuggestions);
      socket.off("support-ai-auto-updated", handleAiAutoUpdated);
      socket.off("support-rating-submitted", handleRatingSubmitted);
      leaveSupportTicketRoom(ticketId);
    };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (customMessage?: string) => {
    const cleanMessage = (customMessage || message).trim();

    if (!cleanMessage) return;

    try {
      setSending(true);

      const res = await backendApi.post(
        `/employee/support/tickets/${ticketId}/messages`,
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

  const toggleAutoReply = async () => {
    try {
      setAutoUpdating(true);

      const nextValue = !ticket?.aiAutoReplyEnabled;

      const res = await backendApi.patch(
        `/employee/support/tickets/${ticketId}/ai-auto-reply`,
        {
          enabled: nextValue,
        }
      );

      const updatedTicket = res.data?.data;

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              aiAutoReplyEnabled:
                updatedTicket?.aiAutoReplyEnabled ?? nextValue,
            }
          : prev
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update AI auto reply");
    } finally {
      setAutoUpdating(false);
    }
  };

  const generateSuggestions = async () => {
    try {
      setSuggestionLoading(true);

      const res = await backendApi.post(
        `/employee/support/tickets/${ticketId}/ai-suggestions`
      );

      const suggestions = Array.isArray(res.data?.data?.suggestions)
        ? res.data.data.suggestions
        : [];

      setAiSuggestions(suggestions);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate suggestions");
    } finally {
      setSuggestionLoading(false);
    }
  };

  const requestRating = async () => {
    try {
      setRatingLoading(true);

      const res = await backendApi.post(
        `/employee/support/tickets/${ticketId}/request-rating`
      );

      const newMessage = res.data?.data;

      if (newMessage?._id) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              ratingRequested: true,
            }
          : prev
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to request rating");
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <section className="flex h-[calc(100vh-118px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/employee/support")}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/15"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black text-white">
              {ticket?.subject || "Support Chat"}
            </h1>

            <p className="text-xs text-slate-400">
              {ticket?.ticketNo || "Ticket"} • {ticket?.status || "active"}
              {ticket?.rating ? ` • Rating ${ticket.rating} ⭐` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAutoReply}
            disabled={autoUpdating}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black text-white disabled:opacity-60 ${
              ticket?.aiAutoReplyEnabled
                ? "bg-emerald-500"
                : "bg-white/10 hover:bg-white/15"
            }`}
          >
            {autoUpdating ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Bot size={15} />
            )}
            Auto {ticket?.aiAutoReplyEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generateSuggestions}
            disabled={suggestionLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 disabled:opacity-60"
          >
            {suggestionLoading ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Sparkles size={15} />
            )}
            Generate Suggestions
          </button>

          <button
            type="button"
            onClick={requestRating}
            disabled={ratingLoading || Boolean(ticket?.rating)}
            className="inline-flex items-center gap-2 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-100 disabled:opacity-60"
          >
            {ratingLoading ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Star size={15} />
            )}
            Request Rating
          </button>
        </div>

        {aiSuggestions.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              <MessageSquareText size={14} />
              AI Suggestions
            </p>

            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="block w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm font-semibold leading-6 text-white hover:bg-white/15"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
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
              const isMine = item.senderRole === "employee";
              const isAi = item.senderRole === "ai";
              const isRating =
                item.messageType === "rating_request" ||
                item.messageType === "rating";

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
                        : isAi
                        ? "border border-cyan-300/20 bg-cyan-400/10 text-cyan-50"
                        : isRating
                        ? "border border-yellow-300/20 bg-yellow-400/10 text-yellow-50"
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
          onClick={() => sendMessage()}
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