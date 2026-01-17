import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Nfc, Copy, Check, ArrowLeft, QrCode, Smartphone, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ShareProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [profile, setProfile] = useState<{
    name: string | null;
    linkedin_url: string | null;
    phone: string | null;
  } | null>(null);

  useEffect(() => {
    // Check NFC support
    if ("NDEFReader" in window) {
      setNfcSupported(true);
    }

    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("name, linkedin_url, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const createShare = async () => {
    if (!user || !profile) return;

    // Generate unique share code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { error } = await supabase.from("user_shares").insert({
      user_id: user.id,
      share_code: code,
      name: profile.name || "Anonymous",
      linkedin_url: profile.linkedin_url,
      phone: profile.phone,
      context: "Met via CatchUp",
    });

    if (error) {
      console.error("Error creating share:", error);
      toast.error("Failed to create share link");
      return;
    }

    setShareCode(code);
    const url = `${window.location.origin}/receive/${code}`;
    setShareUrl(url);

    return { code, url };
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      const result = await createShare();
      if (!result) return;
    }

    await navigator.clipboard.writeText(shareUrl || "");
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNfcShare = async () => {
    if (!("NDEFReader" in window)) {
      toast.error("NFC not supported on this device");
      return;
    }

    setNfcWriting(true);

    try {
      const result = await createShare();
      if (!result) {
        setNfcWriting(false);
        return;
      }

      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          { recordType: "url", data: result.url },
        ],
      });

      toast.success("Ready to tap! Bring another phone close.");
    } catch (error: any) {
      console.error("NFC error:", error);
      if (error.name === "NotAllowedError") {
        toast.error("NFC permission denied. Please enable NFC.");
      } else {
        toast.error("Failed to write NFC. Try the link instead.");
      }
    } finally {
      setNfcWriting(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Share Your Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Profile Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {(profile.name || "A")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-lg text-foreground">
                {profile.name || "Your Name"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Met via CatchUp
              </p>
            </div>
          </div>

          {(profile.linkedin_url || profile.phone) && (
            <div className="space-y-2 pt-4 border-t border-border">
              {profile.linkedin_url && (
                <p className="text-sm text-muted-foreground">
                  🔗 LinkedIn: {profile.linkedin_url}
                </p>
              )}
              {profile.phone && (
                <p className="text-sm text-muted-foreground">
                  📱 Phone: {profile.phone}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Share Options */}
        <div className="space-y-4">
          {nfcSupported && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleNfcShare}
              disabled={nfcWriting}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] shadow-soft disabled:opacity-50"
            >
              {nfcWriting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Nfc className="w-5 h-5" />
              )}
              {nfcWriting ? "Preparing NFC..." : "Tap phones to share"}
            </motion.button>
          )}

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleCopyLink}
            className="w-full bg-secondary text-secondary-foreground font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98]"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            {copied ? "Copied!" : "Copy share link"}
          </motion.button>

          {!nfcSupported && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-muted/50 rounded-xl p-4 text-center"
            >
              <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                NFC sharing requires a native mobile app.{" "}
                <span className="text-primary">Use the share link instead!</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <h3 className="font-medium text-foreground mb-2">How it works</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Tap your phones together (or share the link)</p>
            <p>2. They'll get your name & contact info</p>
            <p>3. They can save you as a new connection</p>
          </div>
        </motion.div>

        {/* Edit Profile Link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate("/profile")}
          className="w-full mt-8 py-3 text-primary font-medium"
        >
          Edit your profile info →
        </motion.button>
      </main>
    </div>
  );
}
