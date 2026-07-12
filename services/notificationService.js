import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

// ✅ Save like notification to Firestore
export const sendLikeNotification = async (postOwnerId, postId, likerName) => {
  try {
    console.log("Post Owner:", postOwnerId);
    console.log("Post Id:", postId);
    console.log("Commenter:", likerName);
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === postOwnerId) return;

    await addDoc(collection(db, "notifications"), {
      toUserId: postOwnerId,
      fromUserId: currentUser.uid,
      fromUserName: likerName,
      type: "like",
      postId,
      message: `${likerName} liked your post`,
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.log("Like notification error:", error.message);
  }
};

// ✅ Save comment notification to Firestore
export const sendCommentNotification = async (
  postOwnerId,
  postId,
  commenterName,
) => {
  try {
    console.log("Post Owner:", postOwnerId);
    console.log("Post Id:", postId);
    console.log("Commenter:", commenterName);
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === postOwnerId) return;

    await addDoc(collection(db, "notifications"), {
      toUserId: postOwnerId,
      fromUserId: currentUser.uid,
      fromUserName: commenterName || "Unknown User",
      type: "comment",
      postId,
      message: `${commenterName || "Someone"} commented on your post`,
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.log("Comment notification error:", error.message);
  }
};

// ✅ Real-time notifications listener
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, "notifications"),
    where("toUserId", "==", userId),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis(),
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(notifications);
    },
    (error) => {
      console.error("Notifications listener failed:", error);
    },
  );
};

// ✅ Mark all notifications as read
export const markAllAsRead = async (userId) => {
  const q = query(
    collection(db, "notifications"),
    where("toUserId", "==", userId),
    where("read", "==", false),
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });
  await batch.commit();
};
