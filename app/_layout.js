import { Stack } from "expo-router";
import { useEffect } from "react";
import {
  connectSocket,
  disconnectSocket,
  offReceiveNotification,
  onReceiveNotification,
} from "../services/socketService";
import useAuthStore from "../store/useAuthStore";
import useNotificationStore from "../store/useNotificationStore";
import usePostStore from "../store/usePostStore";
import NotificationToast from "./stackScreens/NotificationToast";

export default function Layout() {
  const startAuthListener = useAuthStore((state) => state.startAuthListener);
  const startListening = usePostStore((state) => state.startListening);
  const stopListening = usePostStore((state) => state.stopListening);
  const user = useAuthStore((state) => state.user);
  const {
    startListening: startNotifications,
    stopListening: stopNotifications,
    addLiveNotification,
  } = useNotificationStore();

  useEffect(() => {
    startAuthListener();
    startListening();
    return () => stopListening();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    // ✅ Start Firestore listener (notification screen history)
    startNotifications(user.uid);

    // ✅ Connect socket
    connectSocket(user.uid);

    // ✅ Listen for live socket notifications → show toast
    onReceiveNotification((notification) => {
      addLiveNotification(notification);
    });

    return () => {
      stopNotifications();
      disconnectSocket();
      offReceiveNotification();
    };
  }, [user?.uid]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <NotificationToast />
    </>
  );
}
