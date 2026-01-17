import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";

interface ContactCardProps {
  name: string;
  context: string;
  timeAgo: string;
  suggestion: string;
  onPlan: () => void;
  onLater: () => void;
}

export function ContactCard({
  name,
  context,
  timeAgo,
  suggestion,
  onPlan,
  onLater,
}: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
    >
      <div className="space-y-4">
        {/* Name */}
        <h2 className="text-2xl font-semibold text-foreground">{name}</h2>

        {/* Context line */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4" />
          <span>{context}</span>
          <span className="text-border">·</span>
          <Clock className="w-4 h-4" />
          <span>{timeAgo}</span>
        </div>

        {/* Suggestion */}
        <p className="text-lg text-foreground/80">{suggestion}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onPlan}
            className="flex-1 bg-primary text-primary-foreground font-medium py-3.5 px-6 rounded-xl hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Plan
          </button>
          <button
            onClick={onLater}
            className="py-3.5 px-5 text-muted-foreground hover:text-foreground transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </motion.div>
  );
}
