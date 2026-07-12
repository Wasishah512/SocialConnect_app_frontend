import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore"; // ✅ changed

const firebaseConfig = {
  apiKey: "AIzaSyAxauH3Dgorvw8pXrInG6qRdos8Z3v1xHo",
  authDomain: "socialconnect-f423b.firebaseapp.com",
  projectId: "socialconnect-f423b",
  storageBucket: "socialconnect-f423b.firebasestorage.app",
  messagingSenderId: "720511212427",
  appId: "1:720511212727:web:cc1fa41e0d0df1a48f6d8e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Auth
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

// ✅ Firestore — use experimentalForceLongPolling for React Native
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// ✅ Storage
//const storage = getStorage(app);

export { auth, db };
