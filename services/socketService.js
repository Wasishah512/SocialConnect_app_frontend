import { io } from "socket.io-client";

const SERVER_URL =
  "https://humanitarian-jeans-melissa-pharmaceuticals.trycloudflare.com";

let socket = null;
let notificationCallback = null;

export const connectSocket = (userId) => {
  if (socket?.connected) {
    socket.emit("register", userId);
    return;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SERVER_URL, {
    transports: ["polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    socket.emit("register", userId);
    if (notificationCallback) {
      socket.off("receive_notification");
      socket.on("receive_notification", notificationCallback);
    }
  });

  socket.on("receive_notification", (data) => {
    console.log("🔔 Notification received:", data);
    if (notificationCallback) notificationCallback(data);
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  socket.on("reconnect", (attempt) => {
    console.log("🔄 Reconnected after", attempt, "attempts");
    socket.emit("register", userId);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  notificationCallback = null;
};

export const sendSocketNotification = (data) => {
  if (socket?.connected) {
    socket.emit("send_notification", data);
    console.log("📤 Notification sent via socket");
  } else {
    console.log("❌ Socket not connected");
  }
};

export const onReceiveNotification = (callback) => {
  notificationCallback = callback;
  if (socket) {
    socket.off("receive_notification");
    socket.on("receive_notification", callback);
  }
};

export const offReceiveNotification = () => {
  notificationCallback = null;
  if (socket) socket.off("receive_notification");
};
