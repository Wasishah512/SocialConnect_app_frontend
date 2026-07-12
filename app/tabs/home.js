import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addComment, subscribeToComments } from "../../services/commentService";
import {
  followUser,
  subscribeToFollowStatus,
  unfollowUser,
} from "../../services/followService";
import {
  sendCommentNotification,
  sendLikeNotification,
} from "../../services/notificationService";
import { sendSocketNotification } from "../../services/socketService";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";
import usePostStore from "../../store/usePostStore";

export default function FeedScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuthStore();
  const { posts, loading, createPost, toggleLike, toggleDislike } =
    usePostStore();
  const { unreadCount } = useNotificationStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [posting, setPosting] = useState(false);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // ✅ Search state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Follow state
  const [followingMap, setFollowingMap] = useState({}); // { [userId]: boolean }
  const [followLoadingMap, setFollowLoadingMap] = useState({}); // { [userId]: boolean }
  const followListeners = useRef({}); // { [userId]: unsubscribeFn }

  // ✅ Animation refs per post
  const likeAnim = useRef({});
  const dislikeAnim = useRef({});
  const likeParticles = useRef({});

  const getAnim = (ref, id) => {
    if (!ref.current[id]) ref.current[id] = new Animated.Value(1);
    return ref.current[id];
  };

  // ✅ FB/Insta style: pop → bounce → settle
  const animateLike = (anim) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1.4,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ✅ Particle burst animation (like floating hearts)
  const getParticleAnim = (id) => {
    if (!likeParticles.current[id]) {
      likeParticles.current[id] = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        scale: new Animated.Value(0),
      };
    }
    return likeParticles.current[id];
  };

  const animateParticle = (id) => {
    const p = getParticleAnim(id);
    p.opacity.setValue(1);
    p.translateY.setValue(0);
    p.scale.setValue(0);

    Animated.parallel([
      Animated.timing(p.scale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(p.translateY, {
        toValue: -30,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
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

  useEffect(() => {
    if (!selectedPostId) return;
    setCommentsLoading(true);
    const unsubscribe = subscribeToComments(selectedPostId, (data) => {
      setComments(data);
      setCommentsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedPostId]);

  // ✅ Subscribe to real-time follow status for every unique post author
  useEffect(() => {
    if (!user?.uid) return;

    const authorIds = [
      ...new Set(
        posts.map((p) => p.userId).filter((id) => id && id !== user.uid),
      ),
    ];

    // Remove listeners for authors no longer in the list
    Object.keys(followListeners.current).forEach((id) => {
      if (!authorIds.includes(id)) {
        followListeners.current[id]();
        delete followListeners.current[id];
      }
    });

    // Add listeners for new authors
    authorIds.forEach((authorId) => {
      if (followListeners.current[authorId]) return; // already subscribed
      followListeners.current[authorId] = subscribeToFollowStatus(
        user.uid,
        authorId,
        (isFollowing) => {
          setFollowingMap((prev) => ({ ...prev, [authorId]: isFollowing }));
        },
      );
    });

    return () => {
      Object.values(followListeners.current).forEach((unsub) => unsub());
      followListeners.current = {};
    };
  }, [posts, user?.uid]);

  const handleOpenComments = (postId) => {
    setSelectedPostId(postId);
    setCommentsVisible(true);
  };

  const handleCloseComments = () => {
    setCommentsVisible(false);
    setSelectedPostId(null);
    setComments([]);
    setCommentText("");
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await addComment(selectedPostId, commentText.trim());
      const post = posts.find((p) => p.id === selectedPostId);
      if (post) {
        const commenterName =
          userProfile?.displayName || user?.displayName || "Someone";
        await sendCommentNotification(
          post.userId,
          selectedPostId,
          commenterName,
        );
        sendSocketNotification({
          toUserId: post.userId,
          fromUserId: user.uid,
          fromUserName: commenterName,
          type: "comment",
          postId: selectedPostId,
          message: `${commenterName} commented on your post`,
        });
      }
      setCommentText("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !selectedImage) {
      Alert.alert("Required", "Please enter text or add an image.");
      return;
    }
    setPosting(true);
    try {
      await createPost(postText, selectedImage);
      setPostText("");
      setSelectedImage(null);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setPosting(false);
    }
  };

  const handleViewProfile = (userId) => {
    router.push({
      pathname: "/stackScreens/profile",
      params: { userId },
    });
  };

  // ✅ Like with full animation + particle + socket
  const handleToggleLike = async (item) => {
    const alreadyLiked = item.likes?.includes(user?.uid);
    const anim = getAnim(likeAnim, item.id);

    animateLike(anim);
    if (!alreadyLiked) animateParticle(item.id); // only burst when liking

    await toggleLike(item.id, item.likes);

    if (!alreadyLiked) {
      const likerName =
        userProfile?.displayName || user?.displayName || "Someone";
      await sendLikeNotification(item.userId, item.id, likerName);
      sendSocketNotification({
        toUserId: item.userId,
        fromUserId: user.uid,
        fromUserName: likerName,
        type: "like",
        postId: item.id,
        message: `${likerName} liked your post`,
      });
    }
  };

  // ✅ Dislike with same animation style
  const handleToggleDislike = async (item) => {
    const anim = getAnim(dislikeAnim, item.id);
    animateLike(anim); // same bounce feel
    await toggleDislike(item.id, item.Dislikes || []);
  };

  // ✅ Follow / Unfollow toggle
  const handleToggleFollow = async (authorId) => {
    if (!user?.uid || authorId === user.uid) return;
    const isFollowing = !!followingMap[authorId];

    setFollowLoadingMap((prev) => ({ ...prev, [authorId]: true }));
    try {
      if (isFollowing) {
        await unfollowUser(user.uid, authorId);
      } else {
        await followUser(user.uid, authorId);
      }
      // followingMap updates automatically via the real-time listener,
      // no need to setFollowingMap manually here
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [authorId]: false }));
    }
  };

  // ✅ Filter posts by username
  const filteredPosts = searchQuery.trim()
    ? posts.filter((p) =>
        p.userName?.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : posts;

  const handleToggleSearch = () => {
    if (searchVisible) {
      setSearchQuery("");
    }
    setSearchVisible((prev) => !prev);
  };

  const renderComment = ({ item }) => {
    const isMe = item.userId === user?.uid;
    return (
      <View style={[styles.commentRow, isMe && styles.commentRowMe]}>
        {!isMe && (
          <Image
            source={{
              uri: item.userPhoto || "https://i.pravatar.cc/150?img=12",
            }}
            style={styles.commentAvatar}
          />
        )}
        <View style={[styles.bubble, isMe && styles.bubbleMe]}>
          {!isMe && <Text style={styles.commentName}>{item.userName}</Text>}
          <Text style={[styles.commentText, isMe && styles.commentTextMe]}>
            {item.text}
          </Text>
          <Text style={[styles.commentTime, isMe && styles.commentTimeMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {isMe && (
          <Image
            source={{
              uri: item.userPhoto || "https://i.pravatar.cc/150?img=12",
            }}
            style={styles.commentAvatar}
          />
        )}
      </View>
    );
  };

  const renderPost = ({ item }) => {
    const liked = item.likes?.includes(user?.uid);
    const disliked = item.Dislikes?.includes(user?.uid);
    const likeScale = getAnim(likeAnim, item.id);
    const dislikeScale = getAnim(dislikeAnim, item.id);
    const particle = getParticleAnim(item.id);

    const isOwnPost = item.userId === user?.uid;
    const isFollowing = !!followingMap[item.userId];
    const followLoading = !!followLoadingMap[item.userId];

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Image
            source={{
              uri: item.userPhoto || "https://i.pravatar.cc/150?img=12",
            }}
            style={styles.profilePic}
          />
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => handleViewProfile(item.userId)}
          >
            <Text style={styles.userName}>{item.userName}</Text>
          </TouchableOpacity>

          {/* ✅ Follow / Unfollow button */}
          {!isOwnPost && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={() => handleToggleFollow(item.userId)}
              disabled={followLoading}
              activeOpacity={0.7}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? "#4F46E5" : "#fff"}
                />
              ) : (
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followingBtnText,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}

        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.postImage}
            resizeMode="contain"
          />
        ) : null}

        <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>

        <View style={styles.actions}>
          {/* ✅ Like button with particle burst */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggleLike(item)}
            activeOpacity={0.7}
          >
            <View style={{ position: "relative" }}>
              {/* Floating heart particle */}
              <Animated.Text
                style={{
                  position: "absolute",
                  top: -10,
                  left: 0,
                  fontSize: 14,
                  opacity: particle.opacity,
                  transform: [
                    { translateY: particle.translateY },
                    { scale: particle.scale },
                  ],
                }}
              >
                ❤️
              </Animated.Text>

              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <Ionicons
                  name={liked ? "thumbs-up" : "thumbs-up-outline"}
                  size={22}
                  color={liked ? "#2563EB" : "#444"}
                />
              </Animated.View>
            </View>
            <Animated.Text
              style={[
                styles.actionText,
                liked && { color: "#2563EB" },
                { transform: [{ scale: likeScale }] },
              ]}
            >
              {item.likes?.length || 0}
            </Animated.Text>
          </TouchableOpacity>

          {/* ✅ Dislike button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggleDislike(item)}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: dislikeScale }] }}>
              <Ionicons
                name={disliked ? "thumbs-down" : "thumbs-down-outline"}
                size={22}
                color={disliked ? "#EF4444" : "#444"}
              />
            </Animated.View>
            <Animated.Text
              style={[
                styles.actionText,
                disliked && { color: "#EF4444" },
                { transform: [{ scale: dislikeScale }] },
              ]}
            >
              {item.Dislikes?.length || 0}
            </Animated.Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenComments(item.id)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#444" />
            <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Social Feed</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          {/* ✅ Search toggle */}
          <TouchableOpacity onPress={handleToggleSearch}>
            <Ionicons
              name={searchVisible ? "close" : "search-outline"}
              size={26}
              color="#111827"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/stackScreens/notificationScreen")}
            style={{ position: "relative" }}
          >
            <Ionicons name="notifications-outline" size={26} color="#111827" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <AntDesign name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Search bar */}
      {searchVisible && (
        <View style={styles.searchBarWrapper}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#9CA3AF"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#4F46E5" size="large" />
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `No posts found for "${searchQuery.trim()}"`
                : "No posts yet. Be the first! 🚀"}
            </Text>
          }
        />
      )}

      {/* Comments Modal */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseComments}
      >
        <View style={styles.commentsOverlay}>
          <KeyboardAvoidingView
            style={styles.commentsContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={handleCloseComments}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator style={{ flex: 1 }} color="#4F46E5" />
            ) : (
              <FlatList
                ref={flatListRef}
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                contentContainerStyle={styles.commentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.emptyComments}>
                    No comments yet. Be the first! 💬
                  </Text>
                }
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
              />
            )}

            <View style={styles.commentInputRow}>
              <Image
                source={{
                  uri:
                    userProfile?.photoURL || "https://i.pravatar.cc/150?img=12",
                }}
                style={styles.inputAvatar}
              />
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!commentText.trim() || sending) && { opacity: 0.5 },
                ]}
                onPress={handleSendComment}
                disabled={!commentText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Create Post Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TextInput
              placeholder="What's on your mind?"
              value={postText}
              onChangeText={setPostText}
              multiline
              style={styles.input}
            />
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>Add Image (Optional)</Text>
            </TouchableOpacity>
            {selectedImage && (
              <View>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    ✕ Remove
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.postButton, posting && { opacity: 0.6 }]}
              onPress={handleCreatePost}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>Create Post</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", paddingTop: 50 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  // ✅ Search bar styles
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  // ✅ Follow button styles
  followBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  followingBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  followBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  followingBtnText: {
    color: "#4F46E5",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  profilePic: { width: 50, height: 50, borderRadius: 25 },
  userName: { marginLeft: 10, fontWeight: "bold", fontSize: 16 },
  postText: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  postImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 4 / 3,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#f3f4f6",
  },
  timestamp: { color: "#666", fontSize: 12, marginBottom: 10 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 10,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontWeight: "600", color: "#444", fontSize: 14 },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#9CA3AF",
    fontSize: 15,
  },
  commentsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  commentsContainer: {
    height: "75%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  commentsTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  commentsList: { padding: 16, paddingBottom: 10, flexGrow: 1 },
  emptyComments: {
    textAlign: "center",
    marginTop: 40,
    color: "#9CA3AF",
    fontSize: 15,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  commentRowMe: { flexDirection: "row-reverse" },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginHorizontal: 8,
  },
  bubble: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 10,
    maxWidth: "75%",
  },
  bubbleMe: {
    backgroundColor: "#4F46E5",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  commentName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
    marginBottom: 3,
  },
  commentText: { fontSize: 14, color: "#111827", lineHeight: 20 },
  commentTextMe: { color: "#fff" },
  commentTime: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "right",
  },
  commentTimeMe: { color: "#C7D2FE" },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  inputAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 8 },
  commentInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#4F46E5",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
  },
  imageButton: {
    backgroundColor: "#4F46E5",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  imageButtonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  previewImage: { width: "100%", height: 180, marginTop: 15, borderRadius: 12 },
  removeImage: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  postButton: {
    backgroundColor: "#22C55E",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  postButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  cancelText: {
    textAlign: "center",
    marginTop: 15,
    color: "red",
    fontWeight: "600",
  },
});
