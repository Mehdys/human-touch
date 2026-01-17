import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import AddContact from "./pages/AddContact";
import PlanCatchup from "./pages/PlanCatchup";
import Booking from "./pages/Booking";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const hasOnboarded = localStorage.getItem("catchup-onboarded") === "true";
  
  if (!hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <Landing />} />
      <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <Auth />} />
      <Route path="/book/:name" element={<Booking />} />

      {/* Protected routes */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <Home />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AddContact />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <PlanCatchup />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <Contacts />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
