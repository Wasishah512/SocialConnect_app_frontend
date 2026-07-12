import { getUserById } from "@/services/getUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        console.log("User ID from AsyncStorage:", userId);
        const data = await getUserById(userId);
        console.log("User Data:", data);
        setUserData(data);
      } catch (error) {
        console.log("Error fetching user data:", error.message);
      }
    };
    fetchUserData();
  }, []);

  // 🔥 LOGOUT FUNCTION
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

  // Format Firestore timestamp
  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "—";
    return new Date(timestamp.seconds * 1000).toDateString();
  };

  //handle update profile
  const handleEditProfile = () => {
    router.push("/stackScreens/updateProfile");
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />

      {/* DECORATIVE BLOBS */}
      <View style={styles.blobTop} />
      <View style={styles.blobTopRight} />

      {/* PROFILE IMAGE */}
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: userData?.photoURL || "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.avatar}
        />
        <View style={styles.onlineBadge} />
      </View>

      {/* NAME */}
      <Text style={styles.name}>{userData?.name || "Loading..."}</Text>

      {/* EMAIL */}
      <Text style={styles.email}>{userData?.email || ""}</Text>

      {/* MEMBER SINCE */}
      <Text style={styles.memberSince}>
        Member since {formatDate(userData?.createdAt)}
      </Text>

      {/* BIO BOX */}
      <View style={styles.bioBox}>
        <Text style={styles.bioLabel}>BIO</Text>
        <Text style={styles.bio}>
          {userData?.bio ? userData.bio : "No bio added yet"}
        </Text>
      </View>

      {/* EDIT PROFILE BUTTON */}
      <TouchableOpacity
        style={styles.editBtn}
        activeOpacity={0.8}
        onPress={handleEditProfile}
      >
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#F8F7FF",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#F8F7FF",
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 24,
    position: "relative",
    overflow: "hidden",
  },

  // ── DECORATIVE ──
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

  // ── AVATAR ──
  avatarContainer: {
    position: "relative",
    marginBottom: 18,
  },
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

  // ── TEXT ──
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E1B4B",
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  memberSince: {
    fontSize: 12,
    color: "#A5B4FC",
    marginBottom: 24,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // ── BIO BOX ──
  bioBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bioLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A5B4FC",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  bio: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    lineHeight: 22,
  },

  // ── BUTTONS ──
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
});
