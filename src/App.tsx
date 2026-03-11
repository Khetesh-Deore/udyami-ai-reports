import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { OnboardingContainer } from "./pages/onboarding/OnboardingContainer";
import { CompanyProfile } from "./pages/onboarding/CompanyProfile";
import { KnowledgeBaseUpload } from "./pages/onboarding/KnowledgeBaseUpload";
import { OnboardingGuard } from "./components/OnboardingGuard";
import { OnboardingDashboard } from "./components/dashboard/OnboardingDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OnboardingGuard>
          <Routes>
            <Route path="/" element={<Index />} />
          {/* Onboarding Routes */}
          <Route path="/onboarding/dashboard" element={<OnboardingDashboard />} />
          <Route path="/onboarding/q1" element={<OnboardingContainer />} />
          <Route path="/onboarding/q2" element={<OnboardingContainer />} />
          <Route path="/onboarding/q3" element={<OnboardingContainer />} />
          <Route path="/onboarding/q4" element={<OnboardingContainer />} />
          <Route path="/onboarding/q5" element={<OnboardingContainer />} />
          <Route path="/onboarding/company-profile" element={<CompanyProfile />} />
          <Route path="/onboarding/knowledge-base" element={<KnowledgeBaseUpload />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OnboardingGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
