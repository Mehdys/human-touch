import { motion } from "framer-motion";
import { useState } from "react";
import { MapPin } from "lucide-react";

interface OnboardingStep3Props {
  onDone: () => void;
}

export function OnboardingStep3({ onDone }: OnboardingStep3Props) {
  const [city, setCity] = useState("");
  const [preference, setPreference] = useState<string | null>(null);

  const preferences = [
    { id: "cafe", emoji: "☕", label: "Café" },
    { id: "restaurant", emoji: "🍽", label: "Restaurant" },
    { id: "bar", emoji: "🍻", label: "Bar" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col justify-center items-center px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-8 w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center"
      >
        <MapPin className="w-10 h-10 text-secondary-foreground" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-foreground leading-tight max-w-md"
      >
        Where do you usually hang out?
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 w-full max-w-xs space-y-6"
      >
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City or neighborhood"
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="flex justify-center gap-2">
          {preferences.map((pref) => (
            <button
              key={pref.id}
              onClick={() =>
                setPreference(preference === pref.id ? null : pref.id)
              }
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                preference === pref.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              <span className="mr-1">{pref.emoji}</span>
              {pref.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 w-full max-w-xs"
      >
        <button
          onClick={onDone}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-soft"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}
