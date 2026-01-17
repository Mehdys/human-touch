import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Sparkles } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { toast } from "sonner";

const EVENT_TYPES = [
  { id: "conference", label: "Conference", emoji: "🎤" },
  { id: "hackathon", label: "Hackathon", emoji: "💻" },
  { id: "networking", label: "Networking Event", emoji: "🤝" },
  { id: "meetup", label: "Meetup", emoji: "👥" },
  { id: "party", label: "Party", emoji: "🎉" },
  { id: "other", label: "Other", emoji: "✨" },
];

export default function AddEvent() {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("networking");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    
    // Event just happened (now)
    const result = await createEvent(
      name.trim(), 
      new Date(), 
      location.trim() || undefined, 
      eventType
    );
    
    setSaving(false);
    if (result) {
      toast.success("Event created! Now add the people you met.");
      navigate("/event/add-contacts", { state: { event: result } });
    } else {
      toast.error("Failed to create event");
    }
  };

  const canSave = name.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-foreground">Just left an event?</h1>
          <div className="w-10" />
        </div>
      </header>

      <motion.main 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-lg mx-auto px-5 py-8"
      >
        {/* Urgency message */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Best time to follow up is NOW</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connections fade fast. Capture them while they're fresh.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Event name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Event name *
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="TechCrunch Disrupt, Founder Meetup..." 
              autoFocus 
              className="w-full px-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg" 
            />
          </div>

          {/* Event type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              What kind of event?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setEventType(type.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    eventType === type.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="text-xl block mb-1">{type.emoji}</span>
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="San Francisco, CA" 
              className="w-full px-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
            />
          </div>
        </div>

        {/* Continue button */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              canSave && !saving
                ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {saving ? "Creating..." : "Add people I met →"}
          </button>
        </motion.div>
      </motion.main>
    </div>
  );
}
