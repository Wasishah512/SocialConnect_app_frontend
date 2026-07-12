import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// ✅ Upload image to Cloudinary
//cloudinary details
const CLOUD_NAME = "drunior0e"; // 🔁 from Cloudinary Dashboard
const UPLOAD_PRESET = "SocialConnectApp_Preset"; // 🔁 from Settings → Upload → Upload Presets

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
  if (result.secure_url) return result.secure_url;
  throw new Error("Image upload failed");
};

// ✅ Get User Profile
export const getUserProfile = async (uid) => {
  try {
    console.log("Fetching profile for UID:", uid);
    const docSnap = await getDoc(doc(db, "users", uid));
    console.log("Firestore document snapshot:", docSnap);
    if (docSnap.exists()) return docSnap.data();
    throw new Error("User not found");
  } catch (error) {
    console.error("Get profile error:", error);
    throw error;
  }
};

// ✅ Update User Profile
export const updateUserProfile = async (
  uid,
  name,
  bio,
  newImageUri,
  currentPhotoURL,
) => {
  try {
    let photoURL = currentPhotoURL;

    // Upload new image only if user picked one
    if (newImageUri) {
      photoURL = await uploadToCloudinary(newImageUri);
    }

    await updateDoc(doc(db, "users", uid), {
      name: name.trim(),
      bio: bio.trim(),
      photoURL,
    });

    return photoURL;
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};
