import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../firebaseConfig";
import { sendLikeNotification } from "../services/notificationService";
import {
  createPost,
  dislikePost,
  likePost,
  subscribeToPosts,
  undislikePost,
  unlikePost,
} from "../services/postService";

const usePostStore = create((set, get) => ({
  posts: [],
  loading: true,
  unsubscribe: null,

  startListening: () => {
    const unsubscribe = subscribeToPosts((posts) => {
      set({ posts, loading: false });
    });
    set({ unsubscribe });
  },

  stopListening: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
  },

  createPost: async (text, imageUri) => {
    await createPost(text, imageUri);
  },

  // ✅ Toggle like + send notification
  toggleLike: async (postId, currentLikes) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const liked = currentLikes.includes(user.uid);
    const updatedLikes = liked
      ? currentLikes.filter((id) => id !== user.uid)
      : [...currentLikes, user.uid];

    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: updatedLikes } : p,
      ),
    }));

    if (liked) {
      await unlikePost(postId, user.uid);
    } else {
      await likePost(postId, user.uid);

      // ✅ Send notification only when liking (not unliking)
      const post = get().posts.find((p) => p.id === postId);
      if (post) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userName = userDoc.data()?.name || "Someone";
        await sendLikeNotification(post.userId, post.id, userName);
      }
    }
  },

  // ✅ Toggle dislike
  toggleDislike: async (postId, currentDislikes) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const disliked = currentDislikes.includes(user.uid);
    const updatedDislikes = disliked
      ? currentDislikes.filter((id) => id !== user.uid)
      : [...currentDislikes, user.uid];

    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, Dislikes: updatedDislikes } : p,
      ),
    }));

    if (disliked) {
      await undislikePost(postId, user.uid);
    } else {
      await dislikePost(postId, user.uid);
    }
  },
}));

export default usePostStore;
