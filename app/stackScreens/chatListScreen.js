import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useAuthStore from "../../store/useAuthStore";
import useChatStore from "../../store/useChatStore";

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { chats, loading, startListeningChats } = useChatStore();

  // In ChatListScreen.js
  useEffect(() => {
    if (user?.uid) {
      startListeningChats(user.uid);
    }

    // ✅ Cleanup on unmount
    return () => {
      // Optional: stop listening when leaving the screen
      // stopListeningChats();
    };
  }, [user?.uid]);

  const formatTime = (ms) => {
    if (!ms) return "";
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${days}d`;
  };

  const handleOpenChat = (chat) => {
    const otherUserId = chat.participants.find((id) => id !== user.uid);
    router.push({
      pathname: "/stackScreens/chatScreen",
      params: {
        otherUserId,
        otherUserName: chat.participantNames?.[otherUserId] || "User",
        otherUserPhoto: chat.participantPhotos?.[otherUserId] || "",
      },
    });
  };

  const renderChat = ({ item }) => {
    const otherUserId = item.participants.find((id) => id !== user.uid);
    const otherUserName = item.participantNames?.[otherUserId] || "User";
    const otherUserPhoto = item.participantPhotos?.[otherUserId] || "";
    const unread = item.unreadCount?.[user.uid] || 0;
    const isLastFromMe = item.lastMessageSenderId === user.uid;

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: otherUserPhoto || "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {otherUserName}
            </Text>
            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text
              style={[styles.lastMessage, unread > 0 && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessage
                ? `${isLastFromMe ? "You" : otherUserName}: ${item.lastMessage}`
                : "Say hi! 👋"}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unread > 9 ? "9+" : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#4F46E5" size="large" />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No conversations yet. Message someone from their profile! 💬
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  time: { fontSize: 12, color: "#9CA3AF", marginLeft: 8 },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: { fontSize: 14, color: "#6B7280", flex: 1 },
  unreadText: { color: "#111827", fontWeight: "600" },
  unreadBadge: {
    backgroundColor: "#4F46E5",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#9CA3AF",
    fontSize: 15,
    paddingHorizontal: 30,
  },
});
