import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Check, Zap } from "lucide-react";
import { useDbContacts } from "@/hooks/useDbContacts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Event } from "@/hooks/useEvents";

interface QuickContact {
  id: string;
  name: string;
  context: string;
}

export default function EventAddContacts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { refetch } = useDbContacts();
  
  const event = location.state?.event as Event | undefined;
  
  const [contacts, setContacts] = useState<QuickContact[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentContext, setCurrentContext] = useState("");
  const [saving, setSaving] = useState(false);

  const addContact = () => {
    if (!currentName.trim()) return;
    
    setContacts(prev => [...prev, {
      id: crypto.randomUUID(),
      name: currentName.trim(),
      context: currentContext.trim(),
    }]);
    
    setCurrentName("");
    setCurrentContext("");
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentName.trim()) {
      e.preventDefault();
      addContact();
    }
  };

  const handleDone = async () => {
    if (!user || contacts.length === 0) {
      navigate("/home");
      return;
    }

    setSaving(true);
    
    try {
      // Batch insert all contacts
      const contactsToInsert = contacts.map(c => ({
        user_id: user.id,
        name: c.name,
        context: c.context || `Met at ${event?.name || 'event'}`,
        event_id: event?.id || null,
        met_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("contacts")
        .insert(contactsToInsert);

      if (error) throw error;

      await refetch();
      toast.success(`${contacts.length} contacts added! Let's follow up.`);
      navigate("/home");
    } catch (error) {
      console.error("Error saving contacts:", error);
      toast.error("Failed to save some contacts");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-foreground">Add Contacts</h1>
            {event && (
              <p className="text-xs text-muted-foreground">{event.name}</p>
            )}
          </div>
          <button
            onClick={handleDone}
            disabled={contacts.length === 0 || saving}
            className={`font-semibold py-2 px-4 rounded-lg transition-all ${
              contacts.length > 0 && !saving
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground cursor-not-allowed"
            }`}
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>
      </header>

      <motion.main 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-lg mx-auto px-5 py-6"
      >
        {/* Speed hint */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span>Quick add: Name + context, press Enter. Repeat.</span>
        </div>

        {/* Quick input form */}
        <div className="space-y-3 mb-6">
          <input 
            type="text" 
            value={currentName} 
            onChange={(e) => setCurrentName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name" 
            autoFocus 
            className="w-full px-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg" 
          />
          <div className="flex gap-2">
            <input 
              type="text" 
              value={currentContext} 
              onChange={(e) => setCurrentContext(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Context (startup idea, investor, designer...)" 
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
            />
            <button
              onClick={addContact}
              disabled={!currentName.trim()}
              className={`px-4 rounded-xl transition-all ${
                currentName.trim()
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Added contacts list */}
        <AnimatePresence mode="popLayout">
          {contacts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {contacts.length} {contacts.length === 1 ? "person" : "people"} added
              </p>
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{contact.name}</p>
                    {contact.context && (
                      <p className="text-sm text-muted-foreground truncate">{contact.context}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {contacts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-secondary-foreground" />
            </div>
            <p className="text-muted-foreground">
              Start adding people you met
            </p>
          </motion.div>
        )}
      </motion.main>

      {/* Bottom CTA when contacts added */}
      <AnimatePresence>
        {contacts.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-5 right-5 max-w-lg mx-auto"
          >
            <button
              onClick={handleDone}
              disabled={saving}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-xl shadow-elevated flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {saving ? "Saving..." : `Done - See follow-up suggestions`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
