import { getAuth } from "firebase/auth";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
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

  // ✅ Upload image to Cloudinary (same preset/cloud you already use in createPost)
  uploadImageToCloudinary: async (imageUri) => {
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `post_${Date.now()}.jpg`,
    });
    formData.append("upload_preset", "SocialConnectApp_Preset");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/drunior0e/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );
    const data = await response.json();
    if (!data.secure_url) {
      throw new Error("Image upload failed");
    }
    return data.secure_url;
  },

  // ✅ Update post — uploads new image to Cloudinary ONLY if it's a new local file
  updatePost: async (postId, newText, newImageUri, existingImageUrl) => {
    try {
      let finalImageUrl = existingImageUrl || null;

      // If the image is a local file (user picked a new one), upload it.
      // If it's already an https:// Cloudinary URL, it means it wasn't changed — skip upload.
      const isNewLocalImage =
        newImageUri && !newImageUri.startsWith("https://");

      if (isNewLocalImage) {
        finalImageUrl = await get().uploadImageToCloudinary(newImageUri);
      } else if (newImageUri === null) {
        finalImageUrl = null; // user removed the image
      } else {
        finalImageUrl = newImageUri; // unchanged existing URL
      }

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        text: newText || "",
        imageUrl: finalImageUrl,
        updatedAt: Date.now(),
      });
      // onSnapshot listener updates local `posts` state automatically
    } catch (error) {
      console.log("Error updating post:", error.message);
      throw error;
    }
  },

  // ✅ Delete post — Firestore only, Cloudinary image left as-is (optional cleanup skipped)
  deletePost: async (postId) => {
    try {
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);
      // onSnapshot listener removes it from local `posts` state automatically
    } catch (error) {
      console.log("Error deleting post:", error.message);
      throw error;
    }
  },
}));

export default usePostStore;
