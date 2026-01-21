import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, CheckCircle2, XCircle, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [calendarStatus, setCalendarStatus] = useState<{
        isConnected: boolean;
        loading: boolean;
    }>({ isConnected: false, loading: true });
    const [connecting, setConnecting] = useState(false);
    const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        checkCalendarConnection();

        // Check if we just returned from OAuth
        const hash = window.location.hash;
        if (hash.includes('access_token') || hash.includes('provider_token')) {
            // Clear the hash to avoid back button issues
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => {
                checkCalendarConnection();
                fetchWeeklySummary();
            }, 1000);
        }
    }, []);

    const checkCalendarConnection = async () => {
        setCalendarStatus(prev => ({ ...prev, loading: true }));

        const { data: { session } } = await supabase.auth.getSession();
        const isConnected = !!session?.provider_token;

        setCalendarStatus({ isConnected, loading: false });
    };

    const fetchWeeklySummary = async () => {
        setLoadingSummary(true);
        try {
            const response = await supabase.functions.invoke("suggest-slots", {
                body: {
                    calendarEvents: [],
                    freeSlots: [],
                    contact: { name: "yourself", context: "" }
                }
            });

            if (!response.error && response.data?.calendarSummary) {
                setWeeklySummary(response.data.calendarSummary);
                toast.success("Calendar connected! Here's your weekly overview.");
            }
        } catch (error) {
            console.error("Error fetching weekly summary:", error);
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleConnectCalendar = async () => {
        setConnecting(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
                redirectTo: `${window.location.origin}/settings`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (error) {
            toast.error("Failed to connect calendar");
            setConnecting(false);
        }
    };

    const handleDisconnectCalendar = async () => {
        // Sign out and sign back in without calendar scopes
        const confirmed = window.confirm(
            "Are you sure you want to disconnect your calendar? You'll need to reconnect to use AI scheduling features."
        );

        if (!confirmed) return;

        try {
            // For now, we'll just show a message that they need to revoke access in Google settings
            toast.info("To fully disconnect, please revoke access in your Google Account settings", {
                duration: 5000,
                action: {
                    label: "Open Google",
                    onClick: () => window.open("https://myaccount.google.com/permissions", "_blank"),
                },
            });

            // We can also sign them out and back in
            await supabase.auth.signOut();
            navigate("/auth");
        } catch (error) {
            toast.error("Failed to disconnect calendar");
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-lg border-b border-border">
                <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/home')}
                        className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">Settings</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
                {/* Calendar Connection Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Google Calendar
                    </h2>

                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium text-foreground">Calendar Integration</p>
                                    <p className="text-sm text-muted-foreground">
                                        {calendarStatus.loading
                                            ? "Checking..."
                                            : calendarStatus.isConnected
                                                ? "Connected & syncing"
                                                : "Not connected"}
                                    </p>
                                </div>
                            </div>

                            {!calendarStatus.loading && (
                                <div className="flex items-center gap-2">
                                    {calendarStatus.isConnected ? (
                                        <CheckCircle2 className="w-5 h-5 text-success" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Connect your Google Calendar to get personalized AI suggestions for the best times to catch up based on your schedule.
                        </p>

                        {/* Action Button */}
                        <AnimatePresence mode="wait">
                            {calendarStatus.isConnected ? (
                                <motion.button
                                    key="disconnect"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={handleDisconnectCalendar}
                                    className="w-full py-3 px-4 rounded-xl border border-destructive/50 text-destructive hover:bg-destructive/10 font-medium transition-all active:scale-[0.98]"
                                >
                                    Disconnect Calendar
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="connect"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={handleConnectCalendar}
                                    disabled={connecting}
                                    className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-4 h-4" />
                                            Connect Google Calendar
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* AI Weekly Summary */}
                        {calendarStatus.isConnected && weeklySummary && (
                            <div className="mt-4 pt-4 border-t border-border space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-medium text-foreground uppercase tracking-wide">
                                        Your Week at a Glance
                                    </p>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-primary/5 p-3 rounded-lg">
                                    {weeklySummary}
                                </p>
                            </div>
                        )}

                        {loadingSummary && (
                            <div className="flex items-center justify-center gap-2 py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">Getting your weekly overview...</span>
                            </div>
                        )}

                        {/* Features enabled by calendar */}
                        {!calendarStatus.isConnected && (
                            <div className="mt-4 pt-4 border-t border-border space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    What you'll get:
                                </p>
                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>AI analyzes your free time and suggests optimal slots</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Personalized greetings with your weekly schedule summary</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Contextual reasoning for each suggested time slot</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Auto-create calendar events when you schedule a catchup</span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Account Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                >
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Account
                    </h2>

                    <div className="bg-card border border-border rounded-xl divide-y divide-border">
                        <button
                            onClick={() => navigate("/profile")}
                            className="w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                        >
                            <span className="font-medium text-foreground">Edit Profile</span>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </button>

                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                navigate("/auth");
                            }}
                            className="w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors text-destructive font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
