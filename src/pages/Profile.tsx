import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Linkedin, Phone, MapPin, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  linkedin_url: string;
  phone: string;
  city: string;
  preferences: string[];
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    linkedin_url: "",
    phone: "",
    city: "",
    preferences: [],
  });

  const preferenceOptions = [
    { id: "coffee", emoji: "☕", label: "Coffee" },
    { id: "bars", emoji: "🍻", label: "Bars" },
    { id: "restaurants", emoji: "🍽", label: "Restaurants" },
    { id: "coworking", emoji: "💼", label: "Co-working" },
  ];

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("name, linkedin_url, phone, city, preferences")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        name: data.name || "",
        linkedin_url: data.linkedin_url || "",
        phone: data.phone || "",
        city: data.city || "",
        preferences: data.preferences || [],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name || null,
        linkedin_url: profile.linkedin_url || null,
        phone: profile.phone || null,
        city: profile.city || null,
        preferences: profile.preferences,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved!");
    }

    setSaving(false);
  };

  const togglePreference = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(id)
        ? prev.preferences.filter((p) => p !== id)
        : [...prev.preferences, id],
    }));
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-medium py-2 px-4 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Basic Info
          </h2>

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your name"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="City or neighborhood"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </motion.div>

        {/* Contact Info - for sharing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Contact Info (shared when you tap phones)
          </h2>

          <div className="relative">
            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="url"
              value={profile.linkedin_url}
              onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
              placeholder="LinkedIn profile URL"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Phone number"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </motion.div>

        {/* Place Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Favorite Hangout Spots
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {preferenceOptions.map((pref) => {
              const isSelected = profile.preferences.includes(pref.id);
              return (
                <button
                  key={pref.id}
                  onClick={() => togglePreference(pref.id)}
                  className={`px-4 py-3 rounded-xl text-left font-medium border transition-all active:scale-[0.98] ${
                    isSelected
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-xl mr-2">{pref.emoji}</span>
                  {pref.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
