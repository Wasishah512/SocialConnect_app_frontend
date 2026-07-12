import { create } from "zustand";
import {
  markAllAsRead,
  subscribeToNotifications,
} from "./../services/notificationService";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  unsubscribe: null,

  // ✅ Start listening
  startListening: (userId) => {
    const unsubscribe = subscribeToNotifications(userId, (data) => {
      const unread = data.filter((n) => !n.read).length;
      set({ notifications: data, unreadCount: unread });
    });
    set({ unsubscribe });
  },

  // ✅ Stop listening
  stopListening: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
  },

  ddLiveNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // ✅ Mark all read
  markAllRead: async (userId) => {
    await markAllAsRead(userId);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));

export default useNotificationStore;
