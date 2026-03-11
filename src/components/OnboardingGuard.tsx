import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [location.pathname]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // If not authenticated, allow navigation (will be handled by auth guard)
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Check if user has completed onboarding
      const { data: assessment } = await supabase
        .from("onboarding_assessments")
        .select("id, completed_at")
        .eq("user_id", user.id)
        .eq("completed_at", !null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (!assessment) {
        // No completed assessment, redirect to Q1
        if (!location.pathname.startsWith("/onboarding")) {
          navigate("/onboarding/q1", { replace: true });
        }
        setIsOnboarded(false);
      } else {
        // Check if company profile is complete
        const { data: company } = await supabase
          .from("companies")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!company) {
          // Need to complete company profile
          if (!location.pathname.startsWith("/onboarding")) {
            navigate("/onboarding/company-profile", { replace: true });
          }
          setIsOnboarded(false);
        } else {
          // Fully onboarded
          setIsOnboarded(true);
        }
      }

      setIsChecking(false);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setIsChecking(false);
      setIsOnboarded(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking your onboarding status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
