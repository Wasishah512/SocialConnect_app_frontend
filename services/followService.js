import {
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // adjust to your actual firebase init path

const getFollowDocId = (followerId, followingId) =>
  `${followerId}_${followingId}`;

// ✅ Follow a user (creates follow doc + increments counts atomically)
export const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw new Error("You can't follow yourself.");
  }

  const followRef = doc(db, "follows", getFollowDocId(followerId, followingId));
  const followerUserRef = doc(db, "users", followerId);
  const followingUserRef = doc(db, "users", followingId);

  await runTransaction(db, async (transaction) => {
    const followSnap = await transaction.get(followRef);
    if (followSnap.exists()) return; // already following, no-op

    transaction.set(followRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });

    transaction.set(
      followerUserRef,
      { followingCount: increment(1) },
      { merge: true },
    );
    transaction.set(
      followingUserRef,
      { followersCount: increment(1) },
      { merge: true },
    );
  });
};

// ✅ Unfollow a user
export const unfollowUser = async (followerId, followingId) => {
  const followRef = doc(db, "follows", getFollowDocId(followerId, followingId));
  const followerUserRef = doc(db, "users", followerId);
  const followingUserRef = doc(db, "users", followingId);

  await runTransaction(db, async (transaction) => {
    const followSnap = await transaction.get(followRef);
    if (!followSnap.exists()) return; // not following, no-op

    transaction.delete(followRef);

    transaction.set(
      followerUserRef,
      { followingCount: increment(-1) },
      { merge: true },
    );
    transaction.set(
      followingUserRef,
      { followersCount: increment(-1) },
      { merge: true },
    );
  });
};

// ✅ Real-time listener: is `followerId` following `followingId`?
export const subscribeToFollowStatus = (followerId, followingId, callback) => {
  const followRef = doc(db, "follows", getFollowDocId(followerId, followingId));
  return onSnapshot(followRef, (snap) => {
    callback(snap.exists());
  });
};

// ✅ Real-time listener: list of userIds that `userId` is following
// (useful later for filtering the main feed to "following only")
export const subscribeToFollowingList = (userId, callback) => {
  const q = query(collection(db, "follows"), where("followerId", "==", userId));
  return onSnapshot(q, (snap) => {
    const followingIds = snap.docs.map((d) => d.data().followingId);
    callback(followingIds);
  });
};
