import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const getUserById = async (userId) => {
  try {
    console.log("Fetching user with ID:", userId);
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    console.log("Firestore document snapshot:", docRef, docSnap);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error getting user:", error.message);
    throw error;
  }
};
