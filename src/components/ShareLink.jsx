import { useState } from "react";
import { Link2, Copy, Check, Share2 } from "lucide-react";

export default function ShareLink({ userId, userName }) {
  const [copied, setCopied] = useState(false);

  const confessionUrl = `${window.location.origin}/confess/${userId}${
    userName ? `?name=${encodeURIComponent(userName)}` : ""
  }`;

  // Shortened display URL for mobile
  const displayUrl =
    confessionUrl.length > 40
      ? `${window.location.host}/confess/${userId.slice(0, 8)}...`
      : confessionUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(confessionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "💌 Send me a Valentine confession!",
          text: "Send me an anonymous confession for Valentine's Day!",
          url: confessionUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-100">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Link2 className="w-5 h-5 text-pink-500 flex-shrink-0" />
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
          Your Confession Link
        </h3>
      </div>

      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
        Share this link to receive anonymous confessions!
      </p>

      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 bg-pink-50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-600 border border-pink-100 overflow-hidden">
          <span className="block truncate sm:hidden">{displayUrl}</span>
          <span className="hidden sm:block truncate">{confessionUrl}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-3 bg-pink-100 hover:bg-pink-200 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            title="Copy link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span className="sm:hidden">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                <span className="sm:hidden text-pink-600">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            title="Share link"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sm:hidden">Share</span>
          </button>
        </div>
      </div>

      {copied && (
        <p className="text-xs sm:text-sm text-green-500 mt-2 animate-fade-in">
          ✓ Link copied to clipboard!
        </p>
      )}
    </div>
  );
}
