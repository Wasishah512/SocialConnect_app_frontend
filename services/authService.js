import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

//cloudinary details
const CLOUD_NAME = "drunior0e"; // 🔁 from Cloudinary Dashboard
const UPLOAD_PRESET = "SocialConnectApp_Preset"; // 🔁 from Settings → Upload → Upload Presets

// ✅ Upload image to Cloudinary
const uploadToCloudinary = async (imageUri) => {
  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "profile.jpg",
  });
  data.append("upload_preset", UPLOAD_PRESET);
  data.append("cloud_name", CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: data },
  );

  const result = await response.json();
  console.log("Cloudinary response:", result);

  if (result.secure_url) return result.secure_url;
  throw new Error("Image upload failed");
};

// ✅ Register User
export const registerUser = async (name, email, password, bio, imageUri) => {
  try {
    // 1. Create auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // 2. Upload image to Cloudinary if selected
    let photoURL = "";
    if (imageUri) {
      photoURL = await uploadToCloudinary(imageUri);
    }

    // 3. Save user data + Cloudinary URL to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email,
      bio: bio || "",
      photoURL, // ✅ Cloudinary URL
      createdAt: Timestamp.now(),
    });

    return user;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

// ✅ Login User
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

//for reset password we can use sendPasswordResetEmail from firebase/auth
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Password reset email sent!" };
  } catch (error) {
    let message = "Something went wrong";
    if (error.code === "auth/user-not-found") {
      message = "No account found with this email";
    } else if (error.code === "auth/invalid-email") {
      message = "Invalid email address";
    }
    throw new Error(message);
  }
};
