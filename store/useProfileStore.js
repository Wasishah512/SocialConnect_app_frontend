import { create } from "zustand";
import { getUserById } from "../services/getUser";

const useProfileStore = create((set, get) => ({
  profiles: {}, // ✅ cache — { userId: userData }

  // ✅ Get profile — fetch only if not cached
  getProfile: async (userId) => {
    const cached = get().profiles[userId];
    if (cached) {
      console.log("Using cached profile for:", userId);
      return cached; // ✅ return cached, no Firestore call
    }

    console.log("Fetching fresh profile for:", userId);
    const data = await getUserById(userId);
    if (data) {
      set((state) => ({
        profiles: { ...state.profiles, [userId]: data }, // ✅ save to cache
      }));
    }
    return data;
  },

  // ✅ Clear cache for a user (call after profile update)
  clearProfile: (userId) => {
    set((state) => {
      const updated = { ...state.profiles };
      delete updated[userId];
      return { profiles: updated };
    });
  },
}));

export default useProfileStore;
