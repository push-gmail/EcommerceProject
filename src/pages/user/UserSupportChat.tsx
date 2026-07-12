import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import backendApi from "../../api/backendApi";
import getSupportSocket, {
  joinSupportTicketRoom,
  leaveSupportTicketRoom,
} from "../../socket/supportSocket";

type Message = {
  _id: string;
  ticketId: string;
  senderRole: "user" | "merchant" | "employee" | "ai";
  senderName?: string;
  message: string;
  messageType?: "text" | "image" | "file" | "rating_request" | "rating";
  meta?: {
    ratings?: number[];
    rating?: number;
    ratingMessage?: string;
  };
};

type Ticket = {
  _id: string;
  ticketNo: string;
  subject: string;
  status: string;
  ratingRequested?: boolean;
  rating?: number | null;
};

export default function UserSupportChat() {
  const navigate = useNavigate();
  const { ticketId = "" } = useParams();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [ratingOptions, setRatingOptions] = useState<number[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const res = await backendApi.get(
        `/user/support/tickets/${ticketId}/messages`
      );

      const data = res.data?.data || {};

      setTicket(data.ticket || null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);

      const hasRatingRequest = Array.isArray(data.messages)
        ? data.messages.some(
            (item: Message) => item.messageType === "rating_request"
          )
        : false;

      if (data.ticket?.rating) {
        setRatingOptions([]);
        setSelectedRating(data.ticket.rating);
      } else if (data.ticket?.ratingRequested || hasRatingRequest) {
        setRatingOptions([1, 2, 3, 4, 5]);
      } else {
        setRatingOptions([]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to load chat");
      navigate("/grocery/myprofile/support");
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

      if (newMessage?.messageType === "rating_request") {
        const ratings = Array.isArray(newMessage?.meta?.ratings)
          ? newMessage.meta.ratings
          : [1, 2, 3, 4, 5];

        setRatingOptions(ratings);
      }
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

    const handleTicketAccepted = (payload: any) => {
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

    const handleRatingRequested = (payload: any) => {
      if (String(payload?.ticketId) !== String(ticketId)) return;

      const ratings = Array.isArray(payload?.ratings)
        ? payload.ratings
        : [1, 2, 3, 4, 5];

      setRatingOptions(ratings);

      const ratingMessage = payload?.message;

      if (ratingMessage?._id) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === ratingMessage._id)) {
            return prev;
          }

          return [...prev, ratingMessage];
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
    };

    const handleRatingSubmitted = (payload: any) => {
      if (String(payload?.ticketId) !== String(ticketId)) return;

      setSelectedRating(payload?.rating || null);
      setRatingOptions([]);

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
    socket.on("support-ticket-accepted", handleTicketAccepted);
    socket.on("support-ticket-resolved", handleTicketResolved);
    socket.on("support-rating-requested", handleRatingRequested);
    socket.on("support-rating-submitted", handleRatingSubmitted);

    return () => {
      socket.off("support-message-created", handleNewMessage);
      socket.off("support-ticket-assigned", handleTicketAssigned);
      socket.off("support-ticket-accepted", handleTicketAccepted);
      socket.off("support-ticket-resolved", handleTicketResolved);
      socket.off("support-rating-requested", handleRatingRequested);
      socket.off("support-rating-submitted", handleRatingSubmitted);
      leaveSupportTicketRoom(ticketId);
    };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ratingOptions]);

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    try {
      setSending(true);

      const res = await backendApi.post(
        `/user/support/tickets/${ticketId}/messages`,
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

  const submitRating = async (rating: number) => {
    try {
      setRatingSubmitting(true);

      const res = await backendApi.post(
        `/user/support/tickets/${ticketId}/rating`,
        {
          rating,
        }
      );

      setSelectedRating(rating);
      setRatingOptions([]);

      const ratingMessage = res.data?.data?.message;

      if (ratingMessage?._id) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === ratingMessage._id)) return prev;
          return [...prev, ratingMessage];
        });
      }

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              rating,
              ratingRequested: false,
            }
          : prev
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <section className="flex h-[calc(100vh-150px)] flex-col overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#eeeeee] p-4">
        <button
          type="button"
          onClick={() => navigate("/grocery/myprofile/support")}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#f5f5f5]"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-[#212121]">
            {ticket?.subject || "Support Chat"}
          </h1>

          <p className="text-xs text-[#878787]">
            {ticket?.ticketNo || "Ticket"} • {ticket?.status || "active"}
            {ticket?.rating ? ` • Rated ${ticket.rating} ⭐` : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f1f3f6] p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-[#424242]">
            <Loader2 className="animate-spin" size={20} />
            Loading chat...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-[#878787]">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item) => {
              const isMine = item.senderRole === "user";
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
                    className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-[#2874f0] text-white"
                        : isAi
                        ? "border border-cyan-100 bg-cyan-50 text-[#0f172a]"
                        : isRating
                        ? "border border-yellow-100 bg-yellow-50 text-[#212121]"
                        : "bg-white text-[#212121]"
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

            {ratingOptions.length > 0 && !selectedRating && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl border border-yellow-100 bg-white p-4 shadow-sm">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#212121]">
                    <Star size={17} className="text-yellow-500" />
                    Rate your support experience
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ratingOptions.map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => submitRating(rating)}
                        disabled={ratingSubmitting}
                        className="flex h-10 min-w-10 items-center justify-center rounded bg-[#2874f0] px-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {ratingSubmitting ? (
                          <Loader2 className="animate-spin" size={15} />
                        ) : (
                          `${rating} ⭐`
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-[#eeeeee] p-4">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          className="h-11 min-w-0 flex-1 border border-[#d7d7d7] px-4 text-sm outline-none focus:border-[#2874f0]"
        />

        <button
          type="button"
          onClick={sendMessage}
          disabled={sending}
          className="grid h-11 w-11 place-items-center rounded bg-[#2874f0] text-white disabled:opacity-60"
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