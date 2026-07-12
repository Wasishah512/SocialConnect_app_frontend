import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registerUser } from "../../services/authService";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 📸 Pick Image — fixed deprecated API
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Allow photo access to select a profile image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ replaces deprecated MediaTypeOptions.Images
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🚀 Register User
  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser(name, email, password, bio, imageUrl);
      console.log("Registered:", user);
      Alert.alert("Success 🎉", "Account created successfully!", [
        { text: "OK", onPress: () => router.push("/auth/login") },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create Account 🚀</Text>

      {/* IMAGE PICKER */}
      <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
        <Image
          source={{ uri: imageUrl || "https://i.pravatar.cc/150?img=12" }}
          style={styles.avatar}
        />
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraIcon}>📷</Text>
        </View>
        <Text style={styles.imageText}>Tap to select profile image</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#6B7280"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#6B7280"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#6B7280"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Bio (optional)"
        placeholderTextColor="#6B7280"
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/login")}>
        <Text style={styles.bottomText}>
          Already have an account?{" "}
          <Text style={{ color: "#4F46E5" }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 25,
    textAlign: "center",
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 22,
    right: "30%",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cameraIcon: { fontSize: 13 },
  imageText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    color: "#111827",
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#4F46E5",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#A5B4FC",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  bottomText: {
    textAlign: "center",
    marginTop: 20,
    color: "#6B7280",
  },
});
