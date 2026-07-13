import { auth } from "@/firebaseConfig"; // adjust path to your firebase init
import { getUserById } from "@/services/getUser";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import useAuthStore from "../../store/useAuthStore";
import usePostStore from "../../store/usePostStore";

export default function MyProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const resolvedId = user?.uid;

  const { posts, toggleLike, toggleDislike, deletePost, updatePost } =
    usePostStore();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Filter posts of this user from Zustand store — no extra Firestore call
  const userPosts = posts.filter((p) => p.userId === resolvedId);

  // ✅ Post menu (three-dot) state
  const [menuVisiblePostId, setMenuVisiblePostId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Edit post modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [updating, setUpdating] = useState(false);

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

  // ✅ Navigate to edit profile
  const handleEditProfile = () => {
    router.push("/stackScreens/updateProfile");
  };

  // 🔥 Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "Logged out successfully");
      router.replace("/auth/login");
    } catch (error) {
      console.log(error.message);
      Alert.alert("Error", error.message);
    }
  };

  // ✅ Three-dot menu handlers
  const handleOpenMenu = (postId) => setMenuVisiblePostId(postId);
  const handleCloseMenu = () => setMenuVisiblePostId(null);

  // ✅ Open edit modal, prefilled with existing post data
  const handleEditPost = (item) => {
    setEditingPost(item);
    setEditText(item.text || "");
    setEditImage(item.imageUrl || null);
    handleCloseMenu();
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingPost(null);
    setEditText("");
    setEditImage(null);
  };

  const pickEditImage = async () => {
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
    if (!result.canceled) setEditImage(result.assets[0].uri);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() && !editImage) {
      Alert.alert("Required", "Please enter text or add an image.");
      return;
    }
    setUpdating(true);
    try {
      await updatePost(
        editingPost.id,
        editText,
        editImage,
        editingPost.imageUrl,
      );
      handleCloseEditModal();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Delete with confirmation
  const handleDeletePost = (item) => {
    handleCloseMenu();
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(item.id);
            try {
              await deletePost(item.id);
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
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

      {/* ✅ Edit Profile / Logout buttons */}
      <View style={styles.actionButtonsWrapper}>
        <TouchableOpacity
          style={styles.editBtn}
          activeOpacity={0.8}
          onPress={handleEditProfile}
        >
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.card}>
        {/* ✅ Three-dot menu button */}
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => handleOpenMenu(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>

        {isDeleting && (
          <View style={styles.deletingOverlay}>
            <ActivityIndicator color="#EF4444" />
          </View>
        )}

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

        {/* ✅ Dropdown menu for THIS post */}
        {menuVisiblePostId === item.id && (
          <>
            {/* Invisible backdrop to close on outside tap */}
            <TouchableOpacity
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={handleCloseMenu}
            />
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleEditPost(item)}
              >
                <Ionicons name="create-outline" size={18} color="#4F46E5" />
                <Text style={styles.dropdownText}>Edit Post</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleDeletePost(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={[styles.dropdownText, { color: "#EF4444" }]}>
                  Delete Post
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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

      {/* ✅ Edit Post Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Post</Text>
            <TextInput
              placeholder="What's on your mind?"
              value={editText}
              onChangeText={setEditText}
              multiline
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickEditImage}
            >
              <Text style={styles.imageButtonText}>
                {editImage ? "Change Image" : "Add Image (Optional)"}
              </Text>
            </TouchableOpacity>
            {editImage && (
              <View>
                <Image
                  source={{ uri: editImage }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setEditImage(null)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    ✕ Remove
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.postButton, updating && { opacity: 0.6 }]}
              onPress={handleSaveEdit}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCloseEditModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7FF" },
  profileHeader: {
    alignItems: "center",
    paddingTop: 60,
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
  actionButtonsWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  editBtn: {
    width: "100%",
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  editText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  logoutBtn: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    shadowColor: "#EF4444",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
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
    position: "relative", // ✅ needed for menu positioning
  },
  // ✅ Three-dot menu styles
  menuBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 5,
    padding: 4,
  },
  menuBackdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 9,
  },
  dropdownMenu: {
    position: "absolute",
    top: 38,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  deletingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
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
  // ✅ Edit modal styles (same as create-post modal)
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
