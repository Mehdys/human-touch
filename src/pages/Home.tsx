import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { ContactCard } from "@/components/ui/ContactCard";

interface Contact {
  id: string;
  name: string;
  context: string;
  timeAgo: string;
  suggestion: string;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    context: "Met at IAx Hackathon",
    timeAgo: "3 days ago",
    suggestion: "Want to grab a coffee this week?",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    context: "Product Hunt meetup",
    timeAgo: "1 week ago",
    suggestion: "Time for a lunch catch-up?",
  },
  {
    id: "3",
    name: "Emma Wilson",
    context: "Friend's birthday party",
    timeAgo: "2 weeks ago",
    suggestion: "Maybe a weekend brunch?",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);

  const handleLater = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handlePlan = (contact: Contact) => {
    navigate("/plan", { state: { contact } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">CatchUp</h1>
          <button
            onClick={() => navigate("/add")}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-soft hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-6 py-6">
        <AnimatePresence mode="popLayout">
          {contacts.length > 0 ? (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ContactCard
                    name={contact.name}
                    context={contact.context}
                    timeAgo={contact.timeAgo}
                    suggestion={contact.suggestion}
                    onPlan={() => handlePlan(contact)}
                    onLater={() => handleLater(contact.id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                You're all caught up ✨
              </h2>
              <p className="text-muted-foreground max-w-xs">
                We'll let you know when it's a good time to reconnect.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
