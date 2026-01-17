import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TimeSlotButton } from "@/components/ui/TimeSlotButton";
import { PlaceCard } from "@/components/ui/PlaceCard";
import { Check, Sparkles } from "lucide-react";

const timeSlots = [
  "Fri 18:30 – 19:30",
  "Sat 11:00 – 12:00",
  "Next Tue 19:00 – 20:00",
];

const places = [
  { id: "1", name: "The Coffee Club", type: "Café", distance: "8 min walk" },
  { id: "2", name: "Bella Italia", type: "Restaurant", distance: "12 min walk" },
];

export default function Booking() {
  const { name = "Friend" } = useParams();
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
            className="max-w-lg mx-auto px-6 py-12"
          >
            {/* Header */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-10"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">☕</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Catch up with {decodeURIComponent(name)}
              </h1>
              <p className="text-muted-foreground">Choose a time and place.</p>
            </motion.div>

            {/* Time selection */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Pick a time
              </h2>
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <TimeSlotButton
                    key={slot}
                    time={slot}
                    selected={selectedTime === slot}
                    onClick={() => setSelectedTime(slot)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Place selection */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-10"
            >
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Pick a place
              </h2>
              <div className="space-y-2">
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    name={place.name}
                    type={place.type}
                    distance={place.distance}
                    selected={selectedPlace === place.id}
                    onClick={() => setSelectedPlace(place.id)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Confirm button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl transition-all active:scale-[0.98] shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6"
            >
              <Check className="w-10 h-10 text-success" />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              You're all set 🎉
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground"
            >
              See you soon.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Sparkles className="w-4 h-4" />
              <span>Powered by CatchUp</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
