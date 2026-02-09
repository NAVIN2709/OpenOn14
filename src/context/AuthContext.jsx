import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { createUserProfile, getUserProfile } from "../services/firestore";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  storePrivateKey,
  getStoredPrivateKey,
  hasPrivateKey,
  importPrivateKey,
} from "../utils/crypto";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [privateKey, setPrivateKey] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Check if user has stored private key
        const storedKey = getStoredPrivateKey();
        if (storedKey) {
          try {
            const importedKey = await importPrivateKey(storedKey);
            setPrivateKey(importedKey);
          } catch (error) {
            console.error("Failed to import private key:", error);
          }
        }
      } else {
        setUser(null);
        setPrivateKey(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Check if user profile exists
      const existingProfile = await getUserProfile(firebaseUser.uid);

      if (!existingProfile) {
        // New user - generate key pair
        const keyPair = await generateKeyPair();
        const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
        const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);

        // Store public key in Firestore
        await createUserProfile(
          firebaseUser.uid,
          publicKeyBase64,
          firebaseUser.displayName,
          firebaseUser.photoURL,
        );

        // Store private key locally
        storePrivateKey(privateKeyBase64);
        setPrivateKey(keyPair.privateKey);
      } else if (!hasPrivateKey()) {
        // Existing user but no local private key - they've lost access
        console.warn(
          "User exists but private key is missing. Messages cannot be decrypted.",
        );
      } else {
        // Existing user with private key
        const storedKey = getStoredPrivateKey();
        const importedKey = await importPrivateKey(storedKey);
        setPrivateKey(importedKey);
      }

      return firebaseUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setPrivateKey(null);
      // Note: We don't clear the private key from localStorage on logout
      // so user can still decrypt on the same device after re-login
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    privateKey,
    hasPrivateKey: !!privateKey || hasPrivateKey(),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
