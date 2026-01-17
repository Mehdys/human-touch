import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";

interface PlaceCardProps {
  name: string;
  type: string;
  distance: string;
  selected?: boolean;
  onClick?: () => void;
}

export function PlaceCard({
  name,
  type,
  distance,
  selected = false,
  onClick,
}: PlaceCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all border",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-soft"
          : "bg-card text-foreground border-border hover:border-primary/50"
      )}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{name}</h3>
        <div className="flex items-center gap-3 text-sm opacity-80">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{distance}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
