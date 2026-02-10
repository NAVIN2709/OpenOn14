import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { createUserProfile, getUserProfile } from "../services/firestore";
import { ensureKeyPair, hasPrivateKey } from "../utils/crypto";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [privateKey, setPrivateKey] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Ensure we have a key pair, generating one if missing
        try {
          const { privateKey: key, publicKey, isNew } = await ensureKeyPair();
          setPrivateKey(key);

          if (isNew) {
            // If we generated a new key, update the public key in Firestore
            await createUserProfile(
              firebaseUser.uid,
              publicKey,
              firebaseUser.displayName,
              firebaseUser.photoURL,
            );
          }
        } catch (error) {
          console.error("Failed to ensure key pair:", error);
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
        const { privateKey: key, publicKey } = await ensureKeyPair();

        // Store public key in Firestore
        await createUserProfile(
          firebaseUser.uid,
          publicKey,
          firebaseUser.displayName,
          firebaseUser.photoURL,
        );

        setPrivateKey(key);
      } else {
        // Existing user: ensure we have keys (regenerate if missing)
        const { privateKey: key, publicKey, isNew } = await ensureKeyPair();
        setPrivateKey(key);

        if (isNew) {
          console.warn(
            "Private key was missing. Generated new pair and updating public key.",
          );
          await createUserProfile(
            firebaseUser.uid,
            publicKey,
            firebaseUser.displayName,
            firebaseUser.photoURL,
          );
        }
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
