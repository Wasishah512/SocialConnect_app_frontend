import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const SERVER_URL = "http://172.21.80.1:1627";

export const registerForPushNotifications = async (userId) => {
  try {
    if (!Device.isDevice) return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // ✅ Skip push token in Expo Go — only works in dev build
    const isExpoGo =
      typeof expo !== "undefined" &&
      require("expo-constants").default?.appOwnership === "expo";

    if (isExpoGo) {
      console.log("⚠️ Expo Go — skipping push token registration");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("✅ Push token:", token);

    await fetch(`${SERVER_URL}/api/save-push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token }),
    });
  } catch (err) {
    console.log("⚠️ Push token skipped:", err.message);
  }
};
