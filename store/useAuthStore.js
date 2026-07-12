import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { auth } from "../firebaseConfig";
import { getUserProfile } from "../services/updateUser";

const useAuthStore = create((set) => ({
  user: null,
  userProfile: null,
  loading: true,

  // ✅ Start auth listener
  startAuthListener: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        set({ user: firebaseUser });
        const profile = await getUserProfile(firebaseUser.uid);
        set({ userProfile: profile });
      } else {
        set({ user: null, userProfile: null });
      }
      set({ loading: false });
    });
  },

  // ✅ Update profile locally after edit
  setUserProfile: (updatedData) => {
    set((state) => ({
      userProfile: { ...state.userProfile, ...updatedData },
    }));
  },

  // ✅ Clear on logout
  clearAuth: () => set({ user: null, userProfile: null }),
}));

export default useAuthStore;
