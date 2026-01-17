import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TimeSlotButtonProps {
  time: string;
  selected?: boolean;
  onClick?: () => void;
}

export function TimeSlotButton({
  time,
  selected = false,
  onClick,
}: TimeSlotButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full py-4 px-6 rounded-xl text-left font-medium transition-all border",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-soft"
          : "bg-card text-foreground border-border hover:border-primary/50"
      )}
    >
      {time}
    </motion.button>
  );
}
