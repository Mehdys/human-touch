import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export function ProfileDropdown() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-all"
                title="Profile menu"
            >
                <User className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                    >
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    navigate("/profile");
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors flex items-center gap-3 text-foreground"
                            >
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>Edit Profile</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigate("/settings");
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors flex items-center gap-3 text-foreground"
                            >
                                <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                                <span>Settings</span>
                            </button>

                            <div className="my-1 border-t border-border" />

                            <button
                                onClick={() => {
                                    handleSignOut();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-destructive/10 transition-colors flex items-center gap-3 text-destructive"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
