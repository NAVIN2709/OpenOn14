import { useState, useEffect } from "react";
import { Clock, Heart } from "lucide-react";

const VALENTINE_DATE = new Date("2026-02-14T00:00:00");

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const difference = VALENTINE_DATE - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isUnlocked: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isUnlocked: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isUnlocked) {
    return (
      <div className="text-center animate-pulse">
        <div className="flex items-center justify-center gap-2 text-pink-500">
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
          <span className="text-lg sm:text-2xl font-bold">
            It's Valentine's Day!
          </span>
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
        </div>
        <p className="text-pink-400 mt-2 text-sm sm:text-base">
          Your confessions are ready to be revealed 💕
        </p>
      </div>
    );
  }

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 text-pink-400 mb-3 sm:mb-4">
        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">
          Countdown to Valentine's
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xs sm:max-w-md mx-auto">
        {timeUnits.map((unit) => (
          <div
            key={unit.label}
            className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-lg border border-pink-100"
          >
            <div className="text-xl sm:text-3xl font-bold text-pink-500">
              {String(unit.value).padStart(2, "0")}
            </div>
            <div className="text-[10px] sm:text-xs text-pink-300 uppercase tracking-wider mt-0.5 sm:mt-1">
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 sm:mt-6 text-pink-400 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2">
        <span>🔒</span>
        <span>Sealed until Valentine's Day</span>
        <span>💌</span>
      </p>
    </div>
  );
}

export function isValentinesDay() {
  const now = new Date();
  return now >= VALENTINE_DATE;
}
