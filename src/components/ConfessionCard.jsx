import { Heart, User } from "lucide-react";

export default function ConfessionCard({
  message,
  senderName = "Anonymous",
  index = 0,
}) {
  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md flex-shrink-0">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
            {senderName}
          </p>
          <p className="text-[10px] sm:text-xs text-pink-400">Secret Admirer</p>
        </div>
        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 fill-current flex-shrink-0" />
      </div>

      {/* Message */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-pink-100">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
          {message}
        </p>
      </div>

      {/* Decorative footer */}
      <div className="mt-3 sm:mt-4 flex justify-center gap-1">
        {[...Array(3)].map((_, i) => (
          <Heart
            key={i}
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-300 fill-current"
            style={{ opacity: 1 - i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
