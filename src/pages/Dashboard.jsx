import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Mail, LogOut, Sparkles, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getConfessionCount } from "../services/firestore";
import Layout from "../components/Layout";
import Countdown, { isValentinesDay } from "../components/Countdown";
import ShareLink from "../components/ShareLink";

export default function Dashboard() {
  const { user, loading, logout, hasPrivateKey } = useAuth();
  const navigate = useNavigate();
  const [confessionCount, setConfessionCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchCount() {
      if (user) {
        try {
          const count = await getConfessionCount(user.uid);
          setConfessionCount(count);
        } catch (error) {
          console.error("Failed to fetch confession count:", error);
        } finally {
          setLoadingCount(false);
        }
      }
    }
    fetchCount();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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

  const valentinesDay = isValentinesDay();

  return (
    <Layout>
      <div className="min-h-screen py-6 sm:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-pink-200 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                  {user.displayName?.[0] || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                  {user.displayName}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Welcome back! 💕
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Private key warning */}
          {!hasPrivateKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 text-amber-700">
                <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium">
                  Private key not found. You won't be able to decrypt
                  confessions sent to this account.
                </p>
              </div>
            </div>
          )}

          {/* Share Link Card */}
          <div className="mb-4 sm:mb-8">
            <ShareLink userId={user.uid} userName={user.displayName} />
          </div>

          {/* Confession Count Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-100 mb-4 sm:mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {loadingCount ? "..." : confessionCount}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {confessionCount === 1 ? "Confession" : "Confessions"}{" "}
                    received
                  </p>
                </div>
              </div>
              <div className="text-3xl sm:text-4xl">💌</div>
            </div>

            {confessionCount > 0 && !valentinesDay && (
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-pink-400 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Sealed until Valentine's Day
              </p>
            )}
          </div>

          {/* Countdown or Reveal Button */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-100">
            {valentinesDay ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-pink-500 mb-3 sm:mb-4">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="font-semibold text-base sm:text-lg">
                    It's Time!
                  </span>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Your confessions are ready to be revealed!
                </p>
                <Link
                  to="/reveal"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  <Heart
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                  />
                  Reveal Confessions
                </Link>
              </div>
            ) : (
              <Countdown />
            )}
          </div>

          {/* How it works */}
          <div className="mt-6 sm:mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-pink-100">
            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
              How it works
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-pink-500 font-medium">1.</span>
                <span>
                  Share your unique link with friends or on social media
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 font-medium">2.</span>
                <span>
                  Anyone can send you anonymous, encrypted confessions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 font-medium">3.</span>
                <span>All messages stay sealed until February 14th</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 font-medium">4.</span>
                <span>
                  On Valentine's Day, reveal all your love letters! 💕
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
