import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  Send,
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";
import { getUserProfile, submitConfession } from "../services/firestore";
import { importPublicKey, encryptMessage } from "../utils/crypto";
import Layout from "../components/Layout";

export default function ConfessPage() {
  const { userId } = useParams();
  const [recipient, setRecipient] = useState(null);
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecipient() {
      try {
        const profile = await getUserProfile(userId);
        if (profile) {
          setRecipient(profile);
        } else {
          setError(
            "This confession link is invalid or the user doesn't exist.",
          );
        }
      } catch (err) {
        console.error("Failed to fetch recipient:", err);
        setError("Failed to load. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecipient();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Import the recipient's public key
      const publicKey = await importPublicKey(recipient.publicKey);

      // Encrypt the message
      const encryptedMessage = await encryptMessage(publicKey, message.trim());

      // Submit to Firestore
      await submitConfession(
        userId,
        encryptedMessage,
        senderName.trim() || "Anonymous",
      );

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit confession:", err);
      setError("Failed to send your confession. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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

  if (error && !recipient) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-pink-400 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Oops!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to homepage
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg animate-bounce">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Confession Sent! 💕
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Your message has been encrypted and sealed.
            </p>
            <p className="text-pink-500 font-medium mb-4 sm:mb-6 text-sm sm:text-base">
              {recipient.displayName} will be able to read it on Valentine's
              Day!
            </p>

            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md border border-pink-100 mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 text-pink-400 text-xs sm:text-sm">
                <Lock className="w-4 h-4" />
                End-to-end encrypted
              </div>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setMessage("");
                setSenderName("");
              }}
              className="text-pink-500 hover:text-pink-600 underline text-sm sm:text-base"
            >
              Send another confession
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-6 sm:py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              {recipient.photoURL ? (
                <img
                  src={recipient.photoURL}
                  alt={recipient.displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-white shadow-lg">
                  {recipient.displayName?.[0] || "?"}
                </div>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
              Send a confession to
            </h1>
            <p className="text-lg sm:text-xl text-pink-500 font-semibold">
              {recipient.displayName} 💕
            </p>
          </div>

          {/* Confession Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-100">
              {/* Optional sender name */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  Your name (optional)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Stay anonymous or leave a hint..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-pink-50/50 text-sm sm:text-base"
                  maxLength={50}
                />
              </div>

              {/* Message */}
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                  <Heart
                    className="w-4 h-4 text-pink-500"
                    fill="currentColor"
                  />
                  Your confession
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write something sweet, funny, or heartfelt... 💌"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition-all resize-none bg-pink-50/50 text-sm sm:text-base"
                  rows={5}
                  maxLength={1000}
                  required
                />
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 text-right">
                  {message.length}/1000
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-red-600 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-pink-300 disabled:to-rose-300 text-white font-semibold py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  Send Confession
                </>
              )}
            </button>

            {/* Security note */}
            <div className="text-center text-[10px] sm:text-sm text-gray-400 flex items-center justify-center gap-1 sm:gap-2">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
              End-to-end encrypted • Sealed until Feb 14
            </div>
          </form>

          {/* Create your own link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm mb-2">
              Want to receive confessions too?
            </p>
            <Link
              to="/"
              className="text-pink-500 hover:text-pink-600 font-medium underline text-sm"
            >
              Create your own link →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
