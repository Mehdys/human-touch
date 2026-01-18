import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { OnboardingStep1 } from "@/components/onboarding/OnboardingStep1";
import { OnboardingStep2 } from "@/components/onboarding/OnboardingStep2";
import { OnboardingStep3 } from "@/components/onboarding/OnboardingStep3";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCalendarConnect = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          redirectTo: `${window.location.origin}/onboarding?step=3`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Calendar connection error:", error);
        toast.error("Failed to connect calendar");
        setStep(3);
      } else {
        // User will be redirected to Google, then back to onboarding
        toast.info("Redirecting to Google...");
      }
    } catch (error) {
      console.error("Error connecting calendar:", error);
      toast.error("Something went wrong");
      setStep(3);
    }
  };

  const handleComplete = async (city?: string, preferences?: string[]) => {
    // Save preferences to profile
    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({
            city,
            preferences: preferences || [],
            preference: preferences?.[0] || null // Keep legacy field for compatibility
          })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    }

    localStorage.setItem("catchup-onboarded", "true");
    toast.success("You're all set! 🎉");
    navigate("/home");
  };

  return (
    <div className="bg-background min-h-screen">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <OnboardingStep1 key="step1" onContinue={() => setStep(2)} />
        )}
        {step === 2 && (
          <OnboardingStep2
            key="step2"
            onConnect={handleCalendarConnect}
            onSkip={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <OnboardingStep3 key="step3" onDone={handleComplete} />
        )}
      </AnimatePresence>

      {/* Progress indicators */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all ${s === step ? "bg-primary w-6" : "bg-border"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
