import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, MessageSquare } from "lucide-react";
import { useDbContacts } from "@/hooks/useDbContacts";
import { toast } from "sonner";

export default function AddContact() {
  const navigate = useNavigate();
  const { addContact } = useDbContacts();
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const result = await addContact(name.trim(), context.trim() || undefined);
    setSaving(false);
    if (result) {
      toast.success(`${name} added!`);
      navigate("/home");
    } else {
      toast.error("Failed to add contact");
    }
  };

  const canSave = name.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-foreground">Add Contact</h1>
          <button onClick={handleSave} disabled={!canSave || saving} className={`font-semibold py-2 px-4 rounded-lg transition-all ${canSave && !saving ? "text-primary hover:bg-primary/10" : "text-muted-foreground cursor-not-allowed"}`}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>
      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto px-5 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2"><User className="w-4 h-4" />Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Their name" autoFocus className="w-full px-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4" />Context <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Where did you meet? What did you talk about?" rows={3} className="w-full px-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
            <p className="text-xs text-muted-foreground">This helps us suggest better catch-up ideas</p>
          </div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10 p-4 bg-secondary/30 rounded-xl">
          <p className="text-sm text-muted-foreground">💡 <span className="font-medium text-foreground">Tip:</span> The more context you add, the better our AI can suggest personalized catch-up ideas.</p>
        </motion.div>
      </motion.main>
    </div>
  );
}
