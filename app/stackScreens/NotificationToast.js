import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";

export default function NotificationToast() {
  const { notifications } = useNotificationStore();
  const { user } = useAuthStore();
  const [toast, setToast] = useState(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const prevCountRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Skip on first load
    if (prevCountRef.current === null) {
      prevCountRef.current = notifications.length;
      return;
    }

    // New notification arrived
    if (notifications.length > prevCountRef.current) {
      const newest = notifications[0];
      if (newest.fromUserId !== user?.uid) {
        showToast(newest);
      }
    }

    prevCountRef.current = notifications.length;
  }, [notifications.length]);

  const showToast = (notification) => {
    setToast(notification);
    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    timerRef.current = setTimeout(() => dismissToast(), 3500);
  };

  const dismissToast = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setToast(null));
  };

  if (!toast) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <TouchableOpacity
        style={styles.toast}
        onPress={dismissToast}
        activeOpacity={0.9}
      >
        <View style={styles.iconBox}>
          <Ionicons
            name={toast.type === "like" ? "thumbs-up" : "chatbubble"}
            size={20}
            color="#fff"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {toast.type === "like" ? "New Like" : "New Comment"}
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {toast.message}
          </Text>
        </View>
        <Ionicons name="close" size={18} color="#fff" onPress={dismissToast} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 55,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontWeight: "700", fontSize: 13 },
  message: { color: "#C7D2FE", fontSize: 12, marginTop: 2 },
});
