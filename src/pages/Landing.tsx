import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Calendar, Sparkles, ArrowRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Save people you meet",
      description: "Never forget a meaningful connection again",
    },
    {
      icon: Sparkles,
      title: "AI-powered reminders",
      description: "We suggest when and why to catch up",
    },
    {
      icon: Calendar,
      title: "Plan in seconds",
      description: "Pick a time and place, share with one tap",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="max-w-lg mx-auto px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <span className="text-6xl">🤝</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-foreground leading-tight mb-4"
          >
            Never forget to catch up
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground max-w-sm mx-auto"
          >
            Save people you meet, get reminded at the right time, and plan catch-ups in seconds.
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 space-y-3"
        >
          <button
            onClick={() => navigate("/auth")}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-soft flex items-center justify-center gap-2"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 space-y-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          Free to use • No spam • Your data is yours
        </motion.p>
      </div>
    </div>
  );
}
