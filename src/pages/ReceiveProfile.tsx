import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Linkedin, Phone, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ShareData {
  name: string;
  linkedin_url: string | null;
  phone: string | null;
  context: string | null;
}

export default function ReceiveProfile() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadShareData();
  }, [code]);

  const loadShareData = async () => {
    if (!code) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    // Use secure RPC function that requires share_code parameter
    const { data, error: fetchError } = await supabase
      .rpc("get_share_by_code", { p_share_code: code });

    if (fetchError) {
      console.error("Error fetching share:", fetchError);
      setError("Share link not found or expired");
      setLoading(false);
      return;
    }

    // The function returns an array, get first result
    const shareRecord = Array.isArray(data) ? data[0] : data;
    
    if (!shareRecord) {
      setError("Share link not found or expired");
      setLoading(false);
      return;
    }

    setShareData({
      name: shareRecord.name,
      linkedin_url: shareRecord.linkedin_url,
      phone: shareRecord.phone,
      context: shareRecord.context,
    });
    setLoading(false);
  };

  const handleSaveContact = async () => {
    if (!shareData) return;

    if (!user) {
      // Redirect to auth with return URL
      navigate(`/auth?returnTo=/receive/${code}`);
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from("contacts").insert({
      user_id: user.id,
      name: shareData.name,
      linkedin_url: shareData.linkedin_url,
      phone: shareData.phone,
      context: shareData.context || "Met via CatchUp",
      met_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error saving contact:", insertError);
      toast.error("Failed to save contact");
      setSaving(false);
      return;
    }

    setSaved(true);
    toast.success(`${shareData.name} added to your contacts!`);

    setTimeout(() => {
      navigate("/home");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4"
        >
          <AlertCircle className="w-8 h-8 text-destructive" />
        </motion.div>
        <h1 className="text-xl font-bold text-foreground mb-2">{error}</h1>
        <p className="text-muted-foreground mb-6">
          Ask them to share a new link
        </p>
        <button
          onClick={() => navigate("/")}
          className="text-primary font-medium"
        >
          Go to CatchUp
        </button>
      </div>
    );
  }

  if (!shareData) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">New Connection</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-3xl font-bold text-primary">
              {shareData.name[0].toUpperCase()}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-1"
          >
            {shareData.name}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground mb-4"
          >
            wants to connect with you
          </motion.p>

          {(shareData.linkedin_url || shareData.phone) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-3 pt-4 border-t border-border"
            >
              {shareData.linkedin_url && (
                <a
                  href={shareData.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm text-secondary-foreground hover:opacity-80 transition-opacity"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {shareData.phone && (
                <a
                  href={`tel:${shareData.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm text-secondary-foreground hover:opacity-80 transition-opacity"
                >
                  <Phone className="w-4 h-4" />
                  {shareData.phone}
                </a>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleSaveContact}
          disabled={saving || saved}
          className={`w-full font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-soft ${
            saved
              ? "bg-green-500 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          } disabled:opacity-70`}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : saving ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              {user ? "Save to my contacts" : "Sign in & save contact"}
            </>
          )}
        </motion.button>

        {!user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-muted-foreground mt-4"
          >
            You'll need to sign in to save this contact
          </motion.p>
        )}
      </main>
    </div>
  );
}
