import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Calendar as CalendarIcon, MapPin, Coffee, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Contact {
    id: string;
    name: string;
    context: string;
    last_met?: string;
    meeting_count?: number;
    preferences?: string[];
}

interface AIContext {
    summary: string;
    relationshipType: string;
    suggestedActivities: string[];
}

export default function ContactDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [contact, setContact] = useState<Contact | null>(null);
    const [aiContext, setAIContext] = useState<AIContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        if (id) {
            fetchContact();
        }
    }, [id]);

    const fetchContact = async () => {
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from("contacts")
                .select("*")
                .eq("id", id)
                .eq("user_id", user?.id)
                .single();

            if (error) throw error;

            setContact(data);
            generateAIContext(data);
        } catch (error) {
            console.error("Error fetching contact:", error);
            toast.error("Failed to load contact");
            navigate("/home");
        } finally {
            setLoading(false);
        }
    };

    const generateAIContext = async (contactData: Contact) => {
        setLoadingAI(true);

        try {
            // For now, generate a simple context based on available data
            // TODO: Replace with actual AI Edge Function call
            const summary = contactData.context
                ? `You met ${contactData.name.split(' ')[0]} ${contactData.context}. ${contactData.meeting_count && contactData.meeting_count > 1
                    ? `You've connected ${contactData.meeting_count} times.`
                    : "This is your first connection."
                }`
                : `${contactData.name} is in your network. Time to strengthen this connection!`;

            setAIContext({
                summary,
                relationshipType: contactData.meeting_count && contactData.meeting_count > 3
                    ? "Close connection"
                    : contactData.meeting_count && contactData.meeting_count > 1
                        ? "Growing friendship"
                        : "New connection",
                suggestedActivities: contactData.preferences || ["Coffee chat", "Quick catchup"],
            });
        } catch (error) {
            console.error("Error generating AI context:", error);
        } finally {
            setLoadingAI(false);
        }
    };

    const handlePlanCatchup = () => {
        if (contact) {
            navigate(`/plan/${contact.id}`, { state: { contact } });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!contact) {
        return null;
    }

    const initials = contact.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2);

    const formatLastMet = (date?: string) => {
        if (!date) return "Not recently";
        const lastMet = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastMet.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b border-border">
                <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate("/home")}
                        className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">Contact Details</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
                {/* Avatar & Name */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center space-y-4"
                >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                        <span className="text-primary-foreground font-bold text-3xl">
                            {initials}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{contact.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{aiContext?.relationshipType || "Connection"}</p>
                    </div>
                </motion.div>

                {/* AI Context Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-xl p-5 space-y-3"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">About {contact.name.split(' ')[0]}</h3>
                    </div>

                    {loadingAI ? (
                        <div className="flex items-center gap-2 py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Generating personalized context...</span>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground leading-relaxed">
                            {aiContext?.summary}
                        </p>
                    )}
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-3"
                >
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">Last catchup</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {formatLastMet(contact.last_met)}
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-medium">Times met</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {contact.meeting_count || 1} {contact.meeting_count === 1 ? "time" : "times"}
                        </p>
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 space-y-4"
                >
                    <div className="text-center">
                        <p className="text-lg font-semibold text-foreground mb-1">
                            Want to catch up with {contact.name.split(' ')[0]}?
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Let's find the perfect time and place
                        </p>
                    </div>

                    <button
                        onClick={handlePlanCatchup}
                        className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                    >
                        <Coffee className="w-5 h-5" />
                        Plan a Catchup
                    </button>
                </motion.div>

                {/* Suggested Activities */}
                {aiContext?.suggestedActivities && aiContext.suggestedActivities.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                    >
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Suggested Activities
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {aiContext.suggestedActivities.map((activity, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full"
                                >
                                    {activity}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
