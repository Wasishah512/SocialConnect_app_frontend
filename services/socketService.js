import { io } from "socket.io-client";

const SERVER_URL =
  "https://specific-listings-surf-sophisticated.trycloudflare.com";

let socket = null;
let notificationCallback = null;
let messageCallback = null;
let typingCallback = null;

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
    if (messageCallback) {
      socket.off("receive_message");
      socket.on("receive_message", messageCallback);
    }
    if (typingCallback) {
      socket.off("receive_typing");
      socket.on("receive_typing", typingCallback);
    }
  });

  socket.on("receive_notification", (data) => {
    console.log("🔔 Notification received:", data);
    if (notificationCallback) notificationCallback(data);
  });

  socket.on("receive_message", (data) => {
    console.log("💬 Message received:", data);
    if (messageCallback) messageCallback(data);
  });

  socket.on("receive_typing", (data) => {
    if (typingCallback) typingCallback(data);
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
  messageCallback = null;
  typingCallback = null;
};

// ── Notifications (existing) ──
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

// ── Chat messages (new) ──
export const sendSocketMessage = (data) => {
  if (socket?.connected) {
    socket.emit("send_message", data);
    console.log("📤 Message sent via socket");
  } else {
    console.log("❌ Socket not connected");
  }
};

export const onReceiveMessage = (callback) => {
  messageCallback = callback;
  if (socket) {
    socket.off("receive_message");
    socket.on("receive_message", callback);
  }
};

export const offReceiveMessage = () => {
  messageCallback = null;
  if (socket) socket.off("receive_message");
};

// ── Typing indicator (new) ──
export const sendTypingStatus = (data) => {
  if (socket?.connected) {
    socket.emit("typing", data);
  }
};

export const onReceiveTyping = (callback) => {
  typingCallback = callback;
  if (socket) {
    socket.off("receive_typing");
    socket.on("receive_typing", callback);
  }
};

export const offReceiveTyping = () => {
  typingCallback = null;
  if (socket) socket.off("receive_typing");
};
