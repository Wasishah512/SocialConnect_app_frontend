import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ensureChatExists,
  markChatAsRead,
  sendMessage,
  subscribeToMessages,
} from "../../services/chatService";
import {
  offReceiveTyping,
  onReceiveTyping,
  sendSocketMessage,
  sendTypingStatus,
} from "../../services/socketService";
import useAuthStore from "../../store/useAuthStore";

export default function ChatScreen() {
  const router = useRouter();
  const { otherUserId, otherUserName, otherUserPhoto } = useLocalSearchParams();
  const { user, userProfile } = useAuthStore();

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const myName = userProfile?.displayName || user?.displayName || "You";

  // ✅ Ensure chat doc exists, then subscribe to messages
  // In chatScreen.js, update the useEffect for initialization:

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      if (!user?.uid || !otherUserId) return;
      console.log("Opening chat with:", otherUserId);
      console.log("Current user:", user.uid);

      const id = await ensureChatExists(
        user.uid,
        myName,
        userProfile?.photoURL || "",
        otherUserId,
        otherUserName,
        otherUserPhoto,
      );

      console.log("Chat ID:", id);
      setChatId(id);

      // ✅ Mark chat as read when opening
      await markChatAsRead(id, user.uid);

      unsubscribe = subscribeToMessages(id, (msgs) => {
        setMessages(msgs);
        setLoading(false);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    };

    init();
    return () => unsubscribe();
  }, [user?.uid, otherUserId]);

  //chk
  useEffect(() => {
    if (!otherUserId) {
      console.error("No otherUserId provided!");
      Alert.alert("Error", "Invalid chat parameters");
      router.back();
      return;
    }

    if (otherUserId.includes(" ") || otherUserId.length < 10) {
      console.error("Invalid otherUserId format:", otherUserId);
      console.error("This looks like a name, not a Firebase UID!");
      // Alert.alert("Error", "Invalid user ID format");
      // router.back();
    }
  }, [otherUserId]);
  // ✅ Listen for typing indicator from the other user
  useEffect(() => {
    onReceiveTyping((data) => {
      if (data.chatId === chatId && data.fromUserId === otherUserId) {
        setOtherTyping(data.isTyping);
      }
    });
    return () => offReceiveTyping();
  }, [chatId, otherUserId]);

  // ✅ Notify other user when I start/stop typing (debounced)
  const handleInputChange = (text) => {
    setInputText(text);
    if (!chatId) return;

    sendTypingStatus({
      toUserId: otherUserId,
      fromUserId: user.uid,
      chatId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus({
        toUserId: otherUserId,
        fromUserId: user.uid,
        chatId,
        isTyping: false,
      });
    }, 1500);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);

    // Stop typing indicator immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus({
      toUserId: otherUserId,
      fromUserId: user.uid,
      chatId,
      isTyping: false,
    });

    try {
      await sendMessage(chatId, user.uid, otherUserId, text);

      sendSocketMessage({
        toUserId: otherUserId,
        fromUserId: user.uid,
        fromUserName: myName,
        chatId,
        text,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.log("Error sending message:", error.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ms) => {
    if (!ms) return "";
    const date = new Date(ms);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.uid;

    // ✅ Get sender name from the chat document or use "You" for current user
    const senderName = isMe ? "You" : otherUserName || "User";

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {/* Show sender name for group clarity */}
        {!isMe && <Text style={styles.senderName}>{senderName}</Text>}
        <View style={[styles.bubble, isMe && styles.bubbleMe]}>
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Image
          source={{
            uri: otherUserPhoto || "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.headerAvatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{otherUserName || "User"}</Text>
          {otherTyping && <Text style={styles.typingText}>typing...</Text>}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
          )
        }
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={handleInputChange}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { marginRight: 8, padding: 4 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  typingText: { fontSize: 12, color: "#4F46E5", marginTop: 2 },
  messagesList: { padding: 16, paddingBottom: 10, flexGrow: 1 },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#9CA3AF",
    fontSize: 15,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "flex-start",
  },
  messageRowMe: { justifyContent: "flex-end" },
  bubble: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "78%",
  },
  bubbleMe: {
    backgroundColor: "#4F46E5",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: { fontSize: 15, color: "#111827", lineHeight: 20 },
  messageTextMe: { color: "#fff" },
  messageTime: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "right",
  },
  messageTimeMe: { color: "#C7D2FE" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#4F46E5",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  senderName: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
    marginLeft: 8,
  },
});
