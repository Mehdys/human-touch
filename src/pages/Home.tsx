import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Users, LogOut, BookUser, Zap, Clock, ChevronDown } from "lucide-react";
import { ContactCard } from "@/components/ui/ContactCard";
import { useDbContacts } from "@/hooks/useDbContacts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MAX_VISIBLE = 3; // Only show top 3 most urgent

export default function Home() {
  const navigate = useNavigate();
  const { feedContacts, loading, snoozeContact, markAsCaughtUp, getFollowUpAnalytics } = useDbContacts();
  const { signOut } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Top 3 most urgent contacts
  const urgentContacts = feedContacts.slice(0, MAX_VISIBLE);
  const remainingContacts = feedContacts.slice(MAX_VISIBLE);
  const visibleContacts = showAll ? feedContacts : urgentContacts;

  const analytics = getFollowUpAnalytics();

  const handleLater = async (id: string) => {
    await snoozeContact(id, 7);
    toast.success("We'll remind you later");
  };

  const handlePlan = (contact: typeof feedContacts[0]) => {
    markAsCaughtUp(contact.id);
    navigate("/plan", { state: { contact } });
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
    navigate("/plan", { state: { contacts: selectedContacts, isGroup: true } });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getUrgencyBg = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 border-red-500/20';
      case 'high': return 'bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-muted';
    }
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
                className={`p-2.5 rounded-full transition-all ${
                  isSelectMode
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <Users className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-all"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
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
            <div className="space-y-4">
              {/* Urgency banner for critical contacts */}
              {urgentContacts.some(c => c.urgencyLevel === 'critical') && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-foreground">Don't let these connections fade</p>
                      <p className="text-sm text-muted-foreground">Follow up within 24h for best results</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Top 3 urgent contacts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Top priorities</span>
                </div>
                
                {visibleContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={isSelectMode ? () => toggleSelect(contact.id) : undefined}
                    className={`relative ${isSelectMode ? "cursor-pointer" : ""}`}
                  >
                    {/* Urgency indicator */}
                    {index < MAX_VISIBLE && (
                      <div className={`absolute -left-1 -top-1 px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyBg(contact.urgencyLevel)} ${getUrgencyColor(contact.urgencyLevel)}`}>
                        {contact.urgencyLevel === 'critical' ? '🔥 Now' : 
                         contact.urgencyLevel === 'high' ? '⏰ Today' :
                         contact.urgencyLevel === 'medium' ? '📅 Soon' : ''}
                      </div>
                    )}
                    
                    {isSelectMode && (
                      <div
                        className={`absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                          selectedIds.has(contact.id)
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
                    <div className={`${isSelectMode ? "ml-5" : ""} ${index < MAX_VISIBLE ? "mt-3" : ""}`}>
                      <ContactCard
                        name={contact.name}
                        context={contact.context || ""}
                        timeAgo={contact.timeAgo}
                        suggestion={contact.urgencyMessage}
                        placeHint={contact.placeDescription}
                        onPlan={() => !isSelectMode && handlePlan(contact)}
                        onLater={() => !isSelectMode && handleLater(contact.id)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Show more / less */}
              {remainingContacts.length > 0 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-3 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                  {showAll ? 'Show less' : `Show ${remainingContacts.length} more`}
                </motion.button>
              )}

              {/* Analytics hint */}
              {analytics.total > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-secondary/30 rounded-xl text-center"
                >
                  <p className="text-2xl font-bold text-foreground">{analytics.rate}%</p>
                  <p className="text-sm text-muted-foreground">
                    of contacts followed up within 72h
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Just left an event?
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Capture the people you met before the connection fades. Best time is now.
              </p>
              <button
                onClick={() => navigate("/event/new")}
                className="bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add event & contacts
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Primary FAB - Add new event */}
      {feedContacts.length > 0 && !isSelectMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-5"
        >
          <button
            onClick={() => navigate("/event/new")}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-elevated hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </motion.div>
      )}

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
