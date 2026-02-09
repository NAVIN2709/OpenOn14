import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Lock, ArrowLeft, AlertTriangle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getConfessions } from "../services/firestore";
import {
  decryptMessage,
  getStoredPrivateKey,
  importPrivateKey,
} from "../utils/crypto";
import { isValentinesDay } from "../components/Countdown";
import Layout from "../components/Layout";
import ConfessionCard from "../components/ConfessionCard";

export default function RevealPage() {
  const { user, loading, privateKey } = useAuth();
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState([]);
  const [decryptedMessages, setDecryptedMessages] = useState([]);
  const [loadingConfessions, setLoadingConfessions] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Check if it's Valentine's Day
  const isUnlocked = isValentinesDay();

  useEffect(() => {
    if (!isUnlocked && !loading && user) {
      navigate("/dashboard");
    }
  }, [isUnlocked, loading, user, navigate]);

  useEffect(() => {
    async function fetchAndDecrypt() {
      if (!user || !isUnlocked) return;

      try {
        // Fetch encrypted confessions
        const encryptedConfessions = await getConfessions(user.uid);
        setConfessions(encryptedConfessions);

        if (encryptedConfessions.length === 0) {
          setLoadingConfessions(false);
          return;
        }

        // Get private key
        let key = privateKey;
        if (!key) {
          const storedKey = getStoredPrivateKey();
          if (storedKey) {
            key = await importPrivateKey(storedKey);
          }
        }

        if (!key) {
          setError("Private key not found. Unable to decrypt confessions.");
          setLoadingConfessions(false);
          return;
        }

        // Decrypt all confessions
        setDecrypting(true);
        const decrypted = [];

        for (const confession of encryptedConfessions) {
          try {
            const message = await decryptMessage(
              key,
              confession.encryptedMessage,
            );
            decrypted.push({
              id: confession.id,
              message,
              senderName: confession.senderName || "Anonymous",
              createdAt: confession.createdAt,
            });
          } catch (err) {
            console.error("Failed to decrypt confession:", confession.id, err);
            decrypted.push({
              id: confession.id,
              message: "[Unable to decrypt this message]",
              senderName: confession.senderName || "Anonymous",
              createdAt: confession.createdAt,
              error: true,
            });
          }
        }

        setDecryptedMessages(decrypted);
      } catch (err) {
        console.error("Failed to fetch confessions:", err);
        setError("Failed to load confessions. Please try again.");
      } finally {
        setLoadingConfessions(false);
        setDecrypting(false);
      }
    }

    fetchAndDecrypt();
  }, [user, isUnlocked, privateKey]);

  if (loading || !user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Heart
            className="w-12 h-12 sm:w-16 sm:h-16 text-pink-400 animate-pulse"
            fill="currentColor"
          />
        </div>
      </Layout>
    );
  }

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-pink-400 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Still Sealed!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Your confessions are locked until Valentine's Day. Come back on
              February 14th!
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-6 sm:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              <Heart
                className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500 animate-pulse"
                fill="currentColor"
              />
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
              Happy Valentine's Day! 💕
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {decryptedMessages.length > 0
                ? `You have ${decryptedMessages.length} confession${
                    decryptedMessages.length === 1 ? "" : "s"
                  }!`
                : "Your confessions are being revealed..."}
            </p>
          </div>

          {/* Back to dashboard */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 mb-4 sm:mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>

          {/* Error state */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {(loadingConfessions || decrypting) && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">
                {decrypting
                  ? "Decrypting your confessions..."
                  : "Loading confessions..."}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loadingConfessions &&
            !decrypting &&
            decryptedMessages.length === 0 &&
            !error && (
              <div className="text-center py-8 sm:py-12 bg-white rounded-2xl shadow-lg border border-pink-100">
                <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-pink-200 mx-auto mb-4" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  No confessions yet
                </h2>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  Share your link to receive some love letters!
                </p>
                <Link
                  to="/dashboard"
                  className="text-pink-500 hover:text-pink-600 font-medium text-sm sm:text-base"
                >
                  Get your shareable link →
                </Link>
              </div>
            )}

          {/* Confessions grid */}
          {!loadingConfessions &&
            !decrypting &&
            decryptedMessages.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                {decryptedMessages.map((confession, index) => (
                  <div
                    key={confession.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ConfessionCard
                      message={confession.message}
                      senderName={confession.senderName}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            )}

          {/* Footer */}
          {decryptedMessages.length > 0 && (
            <div className="text-center mt-6 sm:mt-8 py-4 sm:py-6 border-t border-pink-100">
              <p className="text-pink-400 text-xs sm:text-sm">
                Made with 💕 for Valentine's Day
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </Layout>
  );
}
