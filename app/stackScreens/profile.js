import { getUserById } from "@/services/getUser";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  followUser,
  subscribeToFollowStatus,
  unfollowUser,
} from "../../services/followService";
import useAuthStore from "../../store/useAuthStore";
import usePostStore from "../../store/usePostStore";

export default function UserProfile() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const resolvedId = Array.isArray(userId) ? userId[0] : userId;

  const { user, userProfile } = useAuthStore();
  const { posts, toggleLike, toggleDislike } = usePostStore();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = resolvedId === user?.uid;

  // ✅ Filter posts of this user from Zustand store — no extra Firestore call
  const userPosts = posts.filter((p) => p.userId === resolvedId);

  // ✅ Fetch user profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!resolvedId) return;
        const data = await getUserById(resolvedId);
        setUserData(data);
      } catch (error) {
        console.log("Error fetching user data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [resolvedId]);

  // ✅ Real-time follow status (skip on own profile)
  useEffect(() => {
    if (!user?.uid || !resolvedId || isOwnProfile) return;
    const unsubscribe = subscribeToFollowStatus(
      user.uid,
      resolvedId,
      (following) => setIsFollowing(following),
    );
    return () => unsubscribe();
  }, [user?.uid, resolvedId, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!user?.uid || isOwnProfile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.uid, resolvedId);
      } else {
        await followUser(user.uid, resolvedId);
      }
      // isFollowing updates automatically via the real-time listener
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setFollowLoading(false);
    }
  };

  // ✅ Navigate to chat screen with this user
  const handleMessage = () => {
    router.push({
      pathname: "/stackScreens/chatScreen",
      params: {
        otherUserId: resolvedId,
        otherUserName: userData?.name || "User",
        otherUserPhoto: userData?.photoURL || "",
      },
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "—";
    return new Date(timestamp.seconds * 1000).toDateString();
  };

  const formatTime = (ms) => {
    if (!ms) return "";
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  // ✅ Profile header
  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <StatusBar barStyle="dark-content" />

      {/* Decorative blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobTopRight} />

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: userData?.photoURL || "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.avatar}
        />
        <View style={styles.onlineBadge} />
      </View>

      {/* Name */}
      <Text style={styles.name}>{userData?.name || "Unknown User"}</Text>

      {/* Email */}
      <Text style={styles.email}>{userData?.email || ""}</Text>

      {/* Member Since */}
      <Text style={styles.memberSince}>
        Member since {formatDate(userData?.createdAt)}
      </Text>

      {/* ✅ Follow / Message button row */}
      {!isOwnProfile && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing && styles.followingBtn,
              styles.actionRowBtn,
            ]}
            onPress={handleToggleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            {followLoading ? (
              <ActivityIndicator
                size="small"
                color={isFollowing ? "#4F46E5" : "#fff"}
              />
            ) : (
              <>
                <Ionicons
                  name={isFollowing ? "checkmark" : "person-add-outline"}
                  size={16}
                  color={isFollowing ? "#4F46E5" : "#fff"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followingBtnText,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.messageBtn, styles.actionRowBtn]}
            onPress={handleMessage}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color="#4F46E5"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ Followers / Following row */}
      <View style={styles.followRow}>
        <View style={styles.followItem}>
          <Text style={styles.followNumber}>
            {userData?.followersCount || 0}
          </Text>
          <Text style={styles.followLabel}>Followers</Text>
        </View>
        <View style={styles.followDivider} />
        <View style={styles.followItem}>
          <Text style={styles.followNumber}>
            {userData?.followingCount || 0}
          </Text>
          <Text style={styles.followLabel}>Following</Text>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioBox}>
        <Text style={styles.bioLabel}>BIO</Text>
        <Text style={styles.bio}>{userData?.bio || "No bio added yet"}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userPosts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {userPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {userPosts.reduce((acc, p) => acc + (p.Dislikes?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Dislikes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {userPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
      </View>

      {/* Posts label */}
      {userPosts.length > 0 && <Text style={styles.postsLabel}>Posts</Text>}
    </View>
  );

  // ✅ Render each post
  const renderPost = ({ item }) => {
    const liked = item.likes?.includes(user?.uid);
    const disliked = item.Dislikes?.includes(user?.uid);

    return (
      <View style={styles.card}>
        {/* Post Text */}
        {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}

        {/* Post Image */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.postImage}
            resizeMode="contain"
          />
        ) : null}

        {/* Timestamp */}
        <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleLike(item.id, item.likes)}
          >
            <Ionicons
              name={liked ? "thumbs-up" : "thumbs-up-outline"}
              size={20}
              color={liked ? "#2563EB" : "#444"}
            />
            <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleDislike(item.id, item.Dislikes || [])}
          >
            <Ionicons
              name={disliked ? "thumbs-down" : "thumbs-down-outline"}
              size={20}
              color={disliked ? "#EF4444" : "#444"}
            />
            <Text style={styles.actionText}>{item.Dislikes?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color="#444" />
            <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ActivityIndicator style={{ flex: 1 }} color="#4F46E5" size="large" />
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>

      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No posts yet 📭</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7FF" },
  backBtn: {
    position: "absolute",
    top: 55,
    left: 16,
    zIndex: 10,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 90,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#F8F7FF",
    position: "relative",
    overflow: "hidden",
  },
  blobTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#E0E7FF",
    top: -100,
    left: -80,
  },
  blobTopRight: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#EDE9FE",
    top: -40,
    right: -50,
  },
  avatarContainer: { position: "relative", marginBottom: 18 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  onlineBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#22C55E",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E1B4B",
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  email: { fontSize: 14, color: "#6B7280", marginBottom: 6 },
  memberSince: {
    fontSize: 12,
    color: "#A5B4FC",
    marginBottom: 16,
    fontWeight: "600",
  },
  // ✅ Follow + Message row
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    width: "100%",
    justifyContent: "center",
  },
  actionRowBtn: {
    flex: 1,
    maxWidth: 150,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  followingBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    shadowOpacity: 0,
    elevation: 0,
  },
  followBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  followingBtnText: { color: "#4F46E5" },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
  },
  messageBtnText: { color: "#4F46E5", fontWeight: "700", fontSize: 14 },
  // ✅ Followers/Following row
  followRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  followItem: { alignItems: "center", paddingHorizontal: 20 },
  followNumber: { fontSize: 18, fontWeight: "800", color: "#1E1B4B" },
  followLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  followDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E0E7FF",
  },
  bioBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    elevation: 2,
  },
  bioLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A5B4FC",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  bio: { fontSize: 15, color: "#374151", textAlign: "center", lineHeight: 22 },
  statsRow: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    elevation: 2,
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "800", color: "#1E1B4B" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  postsLabel: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "700",
    color: "#1E1B4B",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#1F2937",
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 4 / 3,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#F3F4F6",
  },
  timestamp: { color: "#9CA3AF", fontSize: 12, marginBottom: 8 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    paddingTop: 10,
  },
  actionBtn: { flexDirection: "row", alignItems: "center" },
  actionText: { marginLeft: 5, fontWeight: "600", color: "#374151" },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#9CA3AF",
    fontSize: 15,
  },
});
