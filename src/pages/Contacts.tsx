import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, User } from "lucide-react";
import { useDbContacts } from "@/hooks/useDbContacts";
import { toast } from "sonner";

export default function Contacts() {
  const navigate = useNavigate();
  const { contacts, loading, deleteContact } = useDbContacts();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    await deleteContact(id);
    toast.success(`${name} removed`);
    setDeletingId(null);
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
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">All Contacts</h1>
          </div>
          <button
            onClick={() => navigate("/add")}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-soft hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-5 py-4">
        <AnimatePresence mode="popLayout">
          {contacts.length > 0 ? (
            <div className="space-y-2">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/contact/${contact.id}`, { state: { contact } })}
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {contact.name}
                    </h3>
                    {contact.context && (
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.context}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(contact.id, contact.name);
                    }}
                    disabled={deletingId === contact.id}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    {deletingId === contact.id ? (
                      <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
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
                <User className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No contacts yet
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Add someone you've met to start building your network.
              </p>
              <button
                onClick={() => navigate("/add")}
                className="bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
              >
                Add your first contact
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
