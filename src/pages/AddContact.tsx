import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, MapPin, Calendar } from "lucide-react";
import { TagChip } from "@/components/ui/TagChip";
import { toast } from "sonner";

type TagType = "friend" | "business" | "event" | "family";

export default function AddContact() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);

  const toggleTag = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    // In a real app, this would save to a database
    toast.success("Nice. We'll remind you when it's a good moment to catch up.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">New Contact</h1>
        </div>
      </header>

      {/* Form */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-6 py-8"
      >
        <div className="space-y-5">
          {/* Name input */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Who did you meet?"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg"
            />
          </div>

          {/* Context input */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Where did you meet?"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg"
            />
          </div>

          {/* Date input */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-2">
              {(["friend", "business", "event", "family"] as TagType[]).map(
                (tag) => (
                  <TagChip
                    key={tag}
                    type={tag}
                    selected={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Save button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <button
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-soft"
          >
            Save
          </button>
        </motion.div>
      </motion.main>
    </div>
  );
}
