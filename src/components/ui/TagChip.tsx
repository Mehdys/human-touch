import { cn } from "@/lib/utils";

type TagType = "friend" | "business" | "event" | "family";

interface TagChipProps {
  type: TagType;
  selected?: boolean;
  onClick?: () => void;
}

const tagConfig: Record<TagType, { label: string; emoji: string }> = {
  friend: { label: "Friend", emoji: "👋" },
  business: { label: "Business", emoji: "💼" },
  event: { label: "Event", emoji: "🎉" },
  family: { label: "Family", emoji: "❤️" },
};

export function TagChip({ type, selected = false, onClick }: TagChipProps) {
  const { label, emoji } = tagConfig[type];

  const colorClasses: Record<TagType, string> = {
    friend: selected
      ? "bg-tag-friend text-tag-friend-text border-tag-friend-text/30"
      : "bg-muted text-muted-foreground border-transparent",
    business: selected
      ? "bg-tag-business text-tag-business-text border-tag-business-text/30"
      : "bg-muted text-muted-foreground border-transparent",
    event: selected
      ? "bg-tag-event text-tag-event-text border-tag-event-text/30"
      : "bg-muted text-muted-foreground border-transparent",
    family: selected
      ? "bg-tag-family text-tag-family-text border-tag-family-text/30"
      : "bg-muted text-muted-foreground border-transparent",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium border transition-all",
        "active:scale-95",
        colorClasses[type]
      )}
    >
      <span className="mr-1.5">{emoji}</span>
      {label}
    </button>
  );
}
