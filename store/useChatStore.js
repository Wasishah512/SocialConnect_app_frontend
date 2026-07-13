// store/useChatStore.js
import { create } from "zustand";
import { subscribeToUserChats } from "../services/chatService";

const useChatStore = create((set, get) => ({
  chats: [],
  loading: true,
  unsubscribe: null,

  startListeningChats: (userId) => {
    // Stop previous listener if exists
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();

    set({ loading: true });

    const newUnsubscribe = subscribeToUserChats(userId, (chats) => {
      set({ chats, loading: false });
    });

    set({ unsubscribe: newUnsubscribe });
  },

  stopListeningChats: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },
}));

export default useChatStore;
