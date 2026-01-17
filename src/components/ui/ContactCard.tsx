import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface ContactCardProps {
  name: string;
  context: string;
  timeAgo: string;
  suggestion: string;
  placeHint?: string;
  onPlan: () => void;
  onLater: () => void;
}

export function ContactCard({
  name,
  context,
  timeAgo,
  suggestion,
  placeHint,
  onPlan,
  onLater,
}: ContactCardProps) {
  // Get initials for avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-card rounded-2xl p-5 shadow-card border border-border/30"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-secondary-foreground font-semibold text-sm">
            {initials}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {name}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {context} · {timeAgo}
          </p>
          <p className="text-foreground/80 mt-2 text-[15px]">{suggestion}</p>
          
          {placeHint && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{placeHint}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions - simplified */}
      <div className="flex items-center gap-2 mt-4 ml-16">
        <button
          onClick={onPlan}
          className="flex-1 bg-primary text-primary-foreground font-medium py-3 px-5 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] text-sm"
        >
          Let's do it
        </button>
        <button
          onClick={onLater}
          className="py-3 px-4 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all text-sm"
        >
          Later
        </button>
      </div>
    </motion.div>
  );
}
