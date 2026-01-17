import { motion } from "framer-motion";
import { useState } from "react";
import { MapPin, Check } from "lucide-react";

interface OnboardingStep3Props {
  onDone: (city?: string, preferences?: string[]) => void;
}

export function OnboardingStep3({ onDone }: OnboardingStep3Props) {
  const [city, setCity] = useState("");
  const [selectedPreferences, setSelectedPreferences] = useState<Set<string>>(new Set());

  const preferences = [
    { id: "coffee", emoji: "☕", label: "Coffee shops" },
    { id: "bars", emoji: "🍻", label: "Bars" },
    { id: "restaurants", emoji: "🍽", label: "Restaurants" },
    { id: "coworking", emoji: "💼", label: "Co-working" },
  ];

  const togglePreference = (id: string) => {
    setSelectedPreferences((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
        Where do you like to hang out?
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-muted-foreground mt-2 max-w-xs"
      >
        Select all that apply – we'll suggest matching places
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 w-full max-w-sm space-y-6"
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

        <div className="grid grid-cols-2 gap-3">
          {preferences.map((pref) => {
            const isSelected = selectedPreferences.has(pref.id);
            return (
              <button
                key={pref.id}
                onClick={() => togglePreference(pref.id)}
                className={`relative px-4 py-4 rounded-xl text-left font-medium border transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-primary/10 text-primary border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl block mb-1">{pref.emoji}</span>
                <span className="text-sm">{pref.label}</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 w-full max-w-xs"
      >
        <button
          onClick={() => onDone(city || undefined, Array.from(selectedPreferences))}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-soft"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}
