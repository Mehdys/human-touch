import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, MessageCircle, Mail, Link2 } from "lucide-react";
import { TimeSlotButton } from "@/components/ui/TimeSlotButton";
import { PlaceCard } from "@/components/ui/PlaceCard";
import { toast } from "sonner";

const timeSlots = [
  "Fri 18:30 – 19:30",
  "Sat 11:00 – 12:00",
  "Next Tue 19:00 – 20:00",
];

const places = [
  { id: "1", name: "The Coffee Club", type: "Café", distance: "8 min walk" },
  { id: "2", name: "Bella Italia", type: "Restaurant", distance: "12 min walk" },
  { id: "3", name: "The Local Brew", type: "Bar", distance: "5 min walk" },
  { id: "4", name: "Morning Glory", type: "Café", distance: "15 min walk" },
];

type Step = "time" | "place" | "message";

export default function PlanCatchup() {
  const navigate = useNavigate();
  const location = useLocation();
  const contact = location.state?.contact || { name: "Friend" };

  const [step, setStep] = useState<Step>("time");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [message, setMessage] = useState(
    `Hey! Would you be free to catch up ${timeSlots[0]} at The Coffee Club? Would love to see you! 😊`
  );

  const handleNext = () => {
    if (step === "time" && selectedTime) {
      setStep("place");
    } else if (step === "place" && selectedPlace) {
      const place = places.find((p) => p.id === selectedPlace);
      setMessage(
        `Hey! Would you be free to catch up ${selectedTime} at ${place?.name}? Would love to see you! 😊`
      );
      setStep("message");
    }
  };

  const handleBack = () => {
    if (step === "place") setStep("time");
    else if (step === "message") setStep("place");
    else navigate(-1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success("Message copied!");
  };

  const handleSend = () => {
    toast.success("Invite sent! 🎉");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-sm text-muted-foreground">Plan with</p>
            <h1 className="text-lg font-semibold text-foreground">
              {contact.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Time */}
          {step === "time" && (
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-foreground">
                When could you meet {contact.name}?
              </h2>

              <div className="space-y-3">
                {timeSlots.map((slot) => (
                  <TimeSlotButton
                    key={slot}
                    time={slot}
                    selected={selectedTime === slot}
                    onClick={() => setSelectedTime(slot)}
                  />
                ))}
              </div>

              <button className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Show other times
              </button>

              {selectedTime && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={handleNext}
                    className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-soft"
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Place */}
          {step === "place" && (
            <motion.div
              key="place"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-foreground">
                Where should you go?
              </h2>

              <div className="space-y-3">
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

              {selectedPlace && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={handleNext}
                    className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-soft"
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Message */}
          {step === "message" && (
            <motion.div
              key="message"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-foreground">
                Send the invite
              </h2>

              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Share options */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
                  <MessageCircle className="w-5 h-5 text-secondary-foreground" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Email</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
                  <Link2 className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Link</span>
                </button>
              </div>

              <button
                onClick={handleSend}
                className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-soft"
              >
                Send invite
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Step indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {(["time", "place", "message"] as Step[]).map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all ${
              s === step ? "bg-primary w-6" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
