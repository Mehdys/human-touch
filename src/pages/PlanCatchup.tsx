import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, Send, Check, Users, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useCalendarAvailability } from "@/hooks/useCalendar";
import { format } from "date-fns";

const timeSlots = [
  { id: "1", label: "This Friday", time: "6:30 PM" },
  { id: "2", label: "Saturday", time: "11:00 AM" },
  { id: "3", label: "Next Tuesday", time: "7:00 PM" },
];

const placeTypes = [
  { id: "cafe", label: "Café", emoji: "☕" },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { id: "bar", label: "Drinks", emoji: "🍷" },
  { id: "walk", label: "Walk", emoji: "🚶" },
];

const places: Record<string, Array<{ id: string; name: string; note: string }>> = {
  cafe: [
    { id: "c1", name: "The Coffee Club", note: "8 min walk" },
    { id: "c2", name: "Morning Glory", note: "Quiet spot" },
  ],
  restaurant: [
    { id: "r1", name: "Bella Italia", note: "12 min walk" },
    { id: "r2", name: "The Local Kitchen", note: "Great reviews" },
  ],
  bar: [
    { id: "b1", name: "The Local Brew", note: "5 min walk" },
    { id: "b2", name: "Sunset Lounge", note: "Rooftop" },
  ],
  walk: [
    { id: "w1", name: "Central Park", note: "15 min" },
    { id: "w2", name: "Riverside Trail", note: "Scenic" },
  ],
};

type Step = "time" | "type" | "place" | "ready";

export default function PlanCatchup() {
  const navigate = useNavigate();
  const location = useLocation();
  const contact = location.state?.contact;
  const contacts = location.state?.contacts;
  const isGroup = location.state?.isGroup;

  const names = useMemo(() => {
    if (isGroup && contacts?.length) {
      if (contacts.length === 2) {
        return contacts.map((c: { name: string }) => c.name.split(" ")[0]).join(" & ");
      }
      return `${contacts[0].name.split(" ")[0]} and ${contacts.length - 1} others`;
    }
    return contact?.name || "Friend";
  }, [contact, contacts, isGroup]);

  const firstName = useMemo(() => {
    if (isGroup && contacts?.length) {
      return contacts[0].name.split(" ")[0];
    }
    return contact?.name?.split(" ")[0] || "Friend";
  }, [contact, contacts, isGroup]);

  // Fetch calendar availability
  const { data: calendarData, isLoading: loadingCalendar } = useCalendarAvailability();
  const hasCalendar = calendarData?.calendarConnected && calendarData.freeSlots.length > 0;

  const [step, setStep] = useState<Step>("time");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const selectedTimeData = timeSlots.find((t) => t.id === selectedTime);
  const selectedPlaceData = selectedType
    ? places[selectedType]?.find((p) => p.id === selectedPlace)
    : null;

  const message = useMemo(() => {
    const timeStr = selectedTimeData
      ? `${selectedTimeData.label} at ${selectedTimeData.time}`
      : "";
    const placeStr = selectedPlaceData?.name || "";

    if (isGroup) {
      return `Hey everyone! Let's catch up ${timeStr}${placeStr ? ` at ${placeStr}` : ""}. Works for you? 😊`;
    }
    return `Hey ${firstName}! Would love to catch up ${timeStr}${placeStr ? ` at ${placeStr}` : ""}. Works for you? 😊`;
  }, [firstName, selectedTimeData, selectedPlaceData, isGroup]);

  const handleBack = () => {
    if (step === "type") setStep("time");
    else if (step === "place") setStep("type");
    else if (step === "ready") setStep("place");
    else navigate(-1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success("Copied!");
  };

  const handleSend = async () => {
    setIsSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1200));
    setIsSending(false);
    setIsSent(true);
  };

  const handleDone = () => {
    navigate("/home");
  };

  const stepIndex = { time: 0, type: 1, place: 2, ready: 3 }[step];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isGroup && <Users className="w-4 h-4 text-muted-foreground" />}
              <p className="text-sm text-muted-foreground">Planning with</p>
            </div>
            <h1 className="font-semibold text-foreground truncate">{names}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Time */}
          {step === "time" && (
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">When works?</h2>
                {hasCalendar && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>From your calendar</span>
                  </div>
                )}
              </div>

              {loadingCalendar ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Checking your calendar...</span>
                </div>
              ) : hasCalendar ? (
                <>
                  {calendarData!.calendarSummary && (
                    <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        🤖 {calendarData!.calendarSummary}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {calendarData!.freeSlots.map((slot, index) => {
                      const startDate = new Date(slot.start);
                      const endDate = new Date(slot.end);
                      const isToday = startDate.toDateString() === new Date().toDateString();
                      const isTomorrow = startDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                      let dayLabel = format(startDate, "EEEE, MMM d");
                      if (isToday) dayLabel = "Today";
                      if (isTomorrow) dayLabel = "Tomorrow";

                      return (
                        <button
                          key={slot.start}
                          onClick={() => {
                            setSelectedTime(slot.start);
                            setStep("type");
                          }}
                          className={`w-full p-4 rounded-xl text-left transition-all border flex flex-col ${selectedTime === slot.start
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="font-medium">{dayLabel}</span>
                              <span className={`text-sm ${selectedTime === slot.start ? "opacity-90" : "text-muted-foreground"}`}>
                                {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                              </span>
                            </div>
                            <span className={`text-xs ${selectedTime === slot.start ? "opacity-75" : "text-muted-foreground"}`}>
                              {Math.round(slot.duration / 60)}h {Math.round(slot.duration % 60)}m
                            </span>
                          </div>
                          {
                            slot.reasoning && (
                              <p className={`text-xs mt-2 italic ${selectedTime === slot.start ? "opacity-80" : "text-muted-foreground/80"}`}>
                                {slot.reasoning}
                              </p>
                            )
                          }
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Showing {calendarData!.freeSlots.length} free slot{calendarData!.freeSlots.length !== 1 ? "s" : ""} from your calendar
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setSelectedTime(slot.id);
                          setStep("type");
                        }}
                        className={`w-full p-4 rounded-xl text-left transition-all border flex justify-between items-center ${selectedTime === slot.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50"
                          }`}
                      >
                        <span className="font-medium">{slot.label}</span>
                        <span className="opacity-70">{slot.time}</span>
                      </button>
                    ))}
                  </div>
                  {!loadingCalendar && (
                    <div className="text-center">
                      <button
                        onClick={() => {
                          toast.info("Connect your calendar in Settings to see your real availability!");
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Connect calendar for smart suggestions →
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Type */}
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-bold text-foreground">What sounds good?</h2>

              <div className="grid grid-cols-2 gap-3">
                {placeTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setStep("place");
                    }}
                    className="p-5 rounded-xl text-center transition-all border bg-card border-border hover:border-primary/50 hover:bg-card/80"
                  >
                    <span className="text-3xl mb-2 block">{type.emoji}</span>
                    <span className="font-medium text-foreground">{type.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Place */}
          {step === "place" && selectedType && (
            <motion.div
              key="place"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-bold text-foreground">Pick a spot</h2>

              <div className="space-y-2">
                {places[selectedType].map((place) => (
                  <button
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place.id);
                      setStep("ready");
                    }}
                    className="w-full p-4 rounded-xl text-left transition-all border bg-card border-border hover:border-primary/50 flex justify-between items-center"
                  >
                    <span className="font-medium text-foreground">{place.name}</span>
                    <span className="text-sm text-muted-foreground">{place.note}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep("ready")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip – I'll decide later
              </button>
            </motion.div>
          )}

          {/* Step 4: Ready to send */}
          {step === "ready" && !isSent && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-xl font-bold text-foreground">Ready to send</h2>

              {/* Message preview */}
              <div className="relative">
                <div className="bg-primary/10 rounded-2xl p-4 text-foreground">
                  <p className="leading-relaxed">{message}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-lg hover:bg-background/50 transition-colors"
                >
                  <Copy className="w-4 h-4 text-primary" />
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={handleSend}
                disabled={isSending}
                className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] shadow-soft flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send invite
                  </>
                )}
              </button>

              <p className="text-sm text-muted-foreground text-center">
                We'll copy the message so you can share it your way
              </p>
            </motion.div>
          )}

          {/* Sent confirmation */}
          {isSent && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6"
              >
                <Check className="w-8 h-8 text-success" />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                You're all set! 🎉
              </h2>
              <p className="text-muted-foreground">
                We'll let you know when {firstName} responds.
              </p>

              <button
                onClick={handleDone}
                className="mt-8 bg-primary text-primary-foreground font-medium py-3 px-8 rounded-xl transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Progress indicator */}
      {
        !isSent && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === stepIndex
                  ? "w-6 bg-primary"
                  : i < stepIndex
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-border"
                  }`}
              />
            ))}
          </div>
        )
      }
    </div >
  );
}
