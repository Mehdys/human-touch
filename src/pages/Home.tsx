import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Users, BookUser, Nfc, MapPin, Coffee } from "lucide-react";
import { ContactCard } from "@/components/ui/ContactCard";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { useDbContacts } from "@/hooks/useDbContacts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const { feedContacts, loading, snoozeContact, markAsCaughtUp } = useDbContacts();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const handleLater = async (id: string) => {
    await snoozeContact(id, 7);
    toast.success("We'll remind you later");
  };

  const handlePlan = (contact: typeof feedContacts[0]) => {
    markAsCaughtUp(contact.id);
    navigate(`/plan/${contact.id}`, { state: { contact } });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleGroupPlan = () => {
    const selectedContacts = feedContacts.filter((c) => selectedIds.has(c.id));
    selectedContacts.forEach((c) => markAsCaughtUp(c.id));
    // For group catchups, use the first contact's ID in URL
    navigate(`/plan/${selectedContacts[0].id}`, { state: { contacts: selectedContacts, isGroup: true } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">CatchUp</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/share")}
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-all"
              title="Share your profile via NFC"
            >
              <Nfc className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/contacts")}
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-all"
              title="All contacts"
            >
              <BookUser className="w-5 h-5" />
            </button>
            {feedContacts.length > 1 && (
              <button
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedIds(new Set());
                }}
                className={`p-2.5 rounded-full transition-all ${isSelectMode
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <Users className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate("/add")}
              className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-soft hover:opacity-90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Select mode hint */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-lg mx-auto px-5"
          >
            <div className="bg-secondary/50 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-secondary-foreground">
                Tap contacts to plan a group catch-up
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-5">
        <AnimatePresence mode="popLayout">
          {feedContacts.length > 0 ? (
            <div className="space-y-3">
              {feedContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={isSelectMode ? () => toggleSelect(contact.id) : undefined}
                  className={`relative ${isSelectMode ? "cursor-pointer" : ""}`}
                >
                  {isSelectMode && (
                    <div
                      className={`absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${selectedIds.has(contact.id)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30 bg-background"
                        }`}
                    >
                      {selectedIds.has(contact.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-primary-foreground rounded-full"
                        />
                      )}
                    </div>
                  )}
                  <div className={isSelectMode ? "ml-5" : ""}>
                    <ContactCard
                      name={contact.name}
                      context={contact.context || ""}
                      timeAgo={contact.timeAgo}
                      suggestion={contact.suggestion}
                      placeHint={contact.placeDescription}
                      placeName={contact.placeName}
                      googleMapsLink={contact.googleMapsLink}
                      onPlan={() => !isSelectMode && handlePlan(contact)}
                      onLater={() => !isSelectMode && handleLater(contact.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                You're all caught up ✨
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Add someone you've met to start building meaningful connections.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/add")}
                  className="bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
                >
                  Add someone new
                </button>
                <button
                  onClick={() => navigate("/share")}
                  className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-medium py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
                >
                  <Nfc className="w-4 h-4" />
                  Share your profile via NFC
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Group plan FAB */}
      <AnimatePresence>
        {isSelectMode && selectedIds.size > 1 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-5 right-5 max-w-lg mx-auto"
          >
            <button
              onClick={handleGroupPlan}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-xl shadow-elevated flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Plan with {selectedIds.size} people
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
