import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // adjust to your actual firebase init path

// ✅ Deterministic chat ID for any pair of users
export const getChatId = (uid1, uid2) => {
  return [uid1, uid2].sort().join("_");
};

// ✅ Create chat doc if it doesn't exist yet (call this when opening a chat screen)
// In chatService.js
export const ensureChatExists = async (
  currentUserId,
  currentUserName,
  currentUserPhoto,
  otherUserId,
  otherUserName,
  otherUserPhoto,
) => {
  const chatId = getChatId(currentUserId, otherUserId);
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUserId, otherUserId],
      participantNames: {
        [currentUserId]: currentUserName || "User",
        [otherUserId]: otherUserName || "User",
      },
      participantPhotos: {
        [currentUserId]: currentUserPhoto || "",
        [otherUserId]: otherUserPhoto || "",
      },
      lastMessage: "",
      lastMessageAt: Date.now(),
      lastMessageSenderId: null,
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
    });
  } else {
    // ✅ IMPORTANT: Always update names in case they changed
    await setDoc(
      chatRef,
      {
        participantNames: {
          [currentUserId]: currentUserName || "User",
          [otherUserId]: otherUserName || "User",
        },
        participantPhotos: {
          [currentUserId]: currentUserPhoto || "",
          [otherUserId]: otherUserPhoto || "",
        },
      },
      { merge: true },
    );
  }
  return chatId;
};

// ✅ Send a text message + bump unread count for the recipient
// Update sendMessage function
export const sendMessage = async (chatId, senderId, recipientId, text) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text: text.trim(),
    createdAt: Date.now(),
    read: false,
  });

  const chatRef = doc(db, "chats", chatId);

  // ✅ Fix: Update unread count properly for BOTH users
  await setDoc(
    chatRef,
    {
      lastMessage: text.trim(),
      lastMessageAt: Date.now(),
      lastMessageSenderId: senderId,
      [`unreadCount.${recipientId}`]: increment(1),
    },
    { merge: true },
  );
};

// ✅ Reset unread count for a user when they open a chat
export const markChatAsRead = async (chatId, userId) => {
  const chatRef = doc(db, "chats", chatId);
  await setDoc(
    chatRef,
    {
      unreadCount: {
        [userId]: 0,
      },
    },
    { merge: true },
  );
};

// ✅ Real-time subscribe to messages in a chat, oldest to newest
export const subscribeToMessages = (chatId, callback) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });
};

// ✅ Real-time subscribe to all chats a user is part of, newest first
// In chatService.js, verify this function works correctly
export const subscribeToUserChats = (userId, callback) => {
  const chatsRef = collection(db, "chats");

  // ✅ Make sure we're querying correctly
  const q = query(
    chatsRef,
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Chats updated:", chats); // Debug log
      callback(chats);
    },
    (error) => {
      console.error("Error listening to chats:", error);
    },
  );
};
