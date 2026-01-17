import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { OnboardingStep1 } from "@/components/onboarding/OnboardingStep1";
import { OnboardingStep2 } from "@/components/onboarding/OnboardingStep2";
import { OnboardingStep3 } from "@/components/onboarding/OnboardingStep3";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleComplete = () => {
    localStorage.setItem("catchup-onboarded", "true");
    navigate("/");
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
            onConnect={() => setStep(3)}
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
            className={`w-2 h-2 rounded-full transition-all ${
              s === step ? "bg-primary w-6" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
