import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Certifications from "./pages/Certifications";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth"; // Import the new Auth component
import Settings from "./pages/Settings"; // Import the new Settings component
import CertificationDetail from "./pages/CertificationDetail"; // Import the new CertificationDetail component
import { DebugToggle } from "@/components/DebugToggle";
import AdminLogs from "./pages/AdminLogs";
import Favorites from "./pages/Favorites";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import HowItWorks from "@/pages/HowItWorks";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile?.isAdmin && !profile?.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function RequireSuperAdmin({ children }: { children: JSX.Element }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile?.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/certifications/:id" element={<CertificationDetail />} /> {/* New dynamic route for certification details */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} /> {/* Add the Auth route */}
          <Route path="/settings" element={<ProtectedRoute><RequireAdmin><Settings /></RequireAdmin></ProtectedRoute>} /> {/* Secured */}
          <Route path="/admin/logs" element={<ProtectedRoute><RequireSuperAdmin><AdminLogs /></RequireSuperAdmin></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <DebugToggle />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
