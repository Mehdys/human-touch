import { useState, useEffect, useCallback } from "react";

export interface Contact {
  id: string;
  name: string;
  context: string;
  createdAt: string;
  status: "pending" | "snoozed" | "done";
  snoozedUntil?: string;
}

const STORAGE_KEY = "catchup-contacts";

// Default mock contacts for first-time users
const defaultContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    context: "IAx Hackathon",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    context: "Product Hunt meetup",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "3",
    name: "Emma Wilson",
    context: "Friend's birthday",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
];

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
}

function getSuggestion(contact: Contact): string {
  const suggestions = [
    "Coffee this week?",
    "Time for lunch?",
    "Catch up soon?",
    "Weekend brunch?",
    "Quick coffee?",
    "Let's reconnect!",
  ];
  // Deterministic based on contact id
  const index = contact.id.charCodeAt(0) % suggestions.length;
  return suggestions[index];
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load contacts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setContacts(JSON.parse(stored));
      } catch {
        setContacts(defaultContacts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContacts));
      }
    } else {
      // First time user - add default contacts
      setContacts(defaultContacts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContacts));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when contacts change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    }
  }, [contacts, isLoaded]);

  const addContact = useCallback((name: string, context: string) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: name.trim(),
      context: context.trim() || "Met recently",
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    setContacts((prev) => [newContact, ...prev]);
    return newContact;
  }, []);

  const snoozeContact = useCallback((id: string, days: number = 7) => {
    const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    setContacts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "snoozed" as const, snoozedUntil } : c
      )
    );
  }, []);

  const markDone = useCallback((id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "done" as const } : c))
    );
  }, []);

  const removeFromFeed = useCallback((id: string) => {
    // Just snooze for 3 days when user taps "Later"
    snoozeContact(id, 3);
  }, [snoozeContact]);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Get contacts to show in the feed (pending or snoozed that are due)
  const feedContacts = contacts
    .filter((c) => {
      if (c.status === "done") return false;
      if (c.status === "snoozed" && c.snoozedUntil) {
        return new Date(c.snoozedUntil) <= new Date();
      }
      return true;
    })
    .map((c) => ({
      ...c,
      timeAgo: getTimeAgo(c.createdAt),
      suggestion: getSuggestion(c),
    }));

  return {
    contacts,
    feedContacts,
    isLoaded,
    addContact,
    snoozeContact,
    markDone,
    removeFromFeed,
    deleteContact,
  };
}
