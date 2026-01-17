import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export default function AddContact() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [context, setContext] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    // In a real app, this would save to a database
    toast.success("Got it! We'll remind you to catch up soon.", {
      icon: <Check className="w-4 h-4" />,
    });
    navigate("/");
  };

  const canSave = name.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`font-medium px-4 py-2 rounded-xl transition-all ${
              canSave
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Save
          </button>
        </div>
      </header>

      {/* Form - Super Simple */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-5 py-6"
      >
        <div className="space-y-6">
          {/* Name - Primary focus */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              autoFocus
              className="w-full text-2xl font-semibold bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b-2 border-transparent focus:border-primary pb-2 transition-colors"
            />
          </div>

          {/* Context - Optional but helpful */}
          <div>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Where did you meet? (optional)"
              className="w-full text-lg bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b border-border focus:border-primary/50 pb-2 transition-colors"
            />
          </div>
        </div>

        {/* Helpful hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground mt-8"
        >
          We'll remind you to catch up at the right time.
        </motion.p>
      </motion.main>
    </div>
  );
}
