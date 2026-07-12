import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL = "http://localhost:3000";

export const getSupportSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  return socket;
};

export const joinSupportTicketRoom = (ticketId: string) => {
  if (!ticketId) return;

  const activeSocket = getSupportSocket();
  activeSocket.emit("join-support-ticket", ticketId);
};

export const leaveSupportTicketRoom = (ticketId: string) => {
  if (!ticketId) return;

  const activeSocket = getSupportSocket();
  activeSocket.emit("leave-support-ticket", ticketId);
};

export default getSupportSocket;