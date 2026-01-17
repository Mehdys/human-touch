import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const timeSlots = [
  { id: "1", label: "This Friday", time: "6:30 PM" },
  { id: "2", label: "Saturday", time: "11:00 AM" },
];

const places = [
  { id: "1", name: "The Coffee Club", note: "8 min walk" },
  { id: "2", name: "Bella Italia", note: "12 min walk" },
];

export default function Booking() {
  const { name = "Friend" } = useParams();
  const decodedName = decodeURIComponent(name);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const canConfirm = selectedTime && selectedPlace;

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {!confirmed ? (
          <motion.div
            key="booking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto px-5 py-10"
          >
            {/* Header */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-10"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">☕</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Catch up with {decodedName}
              </h1>
              <p className="text-muted-foreground text-sm">
                Pick what works for you
              </p>
            </motion.div>

            {/* Time selection */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                When
              </h2>
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedTime(slot.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all border flex justify-between items-center ${
                      selectedTime === slot.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium">{slot.label}</span>
                    <span className="opacity-70">{slot.time}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Place selection */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Where
              </h2>
              <div className="space-y-2">
                {places.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => setSelectedPlace(place.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all border flex justify-between items-center ${
                      selectedPlace === place.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium">{place.name}</span>
                    <span className="opacity-70 text-sm">{place.note}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Confirm button */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] shadow-soft disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
              className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6"
            >
              <Check className="w-8 h-8 text-success" />
            </motion.div>

            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              See you soon! 🎉
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              {decodedName} will get a confirmation.
            </motion.p>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by CatchUp</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
