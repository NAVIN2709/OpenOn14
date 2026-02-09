import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Create or update user profile with public key
 */
export async function createUserProfile(
  userId,
  publicKey,
  displayName,
  photoURL,
) {
  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      publicKey,
      displayName,
      photoURL,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
}

/**
 * Get user's public key
 */
export async function getUserPublicKey(userId) {
  const profile = await getUserProfile(userId);
  return profile?.publicKey || null;
}

/**
 * Submit an encrypted confession
 */
export async function submitConfession(
  recipientId,
  encryptedMessage,
  senderName = "Anonymous",
) {
  const confessionsRef = collection(db, "confessions");
  await addDoc(confessionsRef, {
    recipientId,
    encryptedMessage,
    senderName,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get all confessions for a user
 */
export async function getConfessions(userId) {
  const confessionsRef = collection(db, "confessions");
  const q = query(confessionsRef, where("recipientId", "==", userId));
  const querySnapshot = await getDocs(q);

  const confessions = [];
  querySnapshot.forEach((doc) => {
    confessions.push({ id: doc.id, ...doc.data() });
  });

  // Sort by creation time (newest first)
  confessions.sort((a, b) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });

  return confessions;
}

/**
 * Get confession count for a user
 */
export async function getConfessionCount(userId) {
  const confessions = await getConfessions(userId);
  return confessions.length;
}
