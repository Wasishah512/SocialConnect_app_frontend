import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { sendCommentNotification } from "./notificationService";

export const addComment = async (postId, text) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  await addDoc(collection(db, "posts", postId, "comments"), {
    text,
    userId: user.uid,
    userName: userData.name,
    userPhoto: userData.photoURL || "",
    createdAt: Timestamp.now(),
  });

  await updateDoc(doc(db, "posts", postId), {
    commentsCount: increment(1),
  });

  // ✅ Send notification to post owner
  const postDoc = await getDoc(doc(db, "posts", postId));
  const postData = postDoc.data();
  if (postData?.userId) {
    const userName = userData?.name || "Someone";
    await sendCommentNotification(postData.userId, postId, userName);
  }
};

export const subscribeToComments = (postId, callback) => {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis(),
    }));
    callback(comments);
  });
};
