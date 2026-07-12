import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

//cloudinary details
const CLOUD_NAME = "drunior0e"; // 🔁 from Cloudinary Dashboard
const UPLOAD_PRESET = "SocialConnectApp_Preset"; // 🔁 from Settings → Upload → Upload Presets

// ✅ Upload post image to Cloudinary
const uploadToCloudinary = async (imageUri) => {
  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "post.jpg",
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

// ✅ Create post
export const createPost = async (text, imageUri) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  let imageUrl = "";
  if (imageUri) imageUrl = await uploadToCloudinary(imageUri);

  await addDoc(collection(db, "posts"), {
    text,
    imageUrl,
    userId: user.uid,
    userName: userData.name,
    userPhoto: userData.photoURL || "",
    likes: [],
    Dislikes: [],
    commentsCount: 0,
    createdAt: Timestamp.now(),
  });
};

// ✅ Real-time posts listener
export const subscribeToPosts = (callback) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis(),
    }));
    callback(posts);
  });
};

export const likePost = async (postId, userId) => {
  await updateDoc(doc(db, "posts", postId), {
    likes: arrayUnion(userId),
    Dislikes: arrayRemove(userId),
  });
};

// ✅ Unlike post
export const dislikePost = async (postId, userId) => {
  await updateDoc(doc(db, "posts", postId), {
    Dislikes: arrayUnion(userId),
    likes: arrayRemove(userId),
  });
};
