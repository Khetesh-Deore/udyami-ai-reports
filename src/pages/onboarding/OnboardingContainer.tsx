import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Q1Industry } from "./Q1Industry";
import { Q2CompanySize } from "./Q2CompanySize";
import { Q3PainPoints } from "./Q3PainPoints";
import { Q4DataReadiness } from "./Q4DataReadiness";
import { Q5AIStyle } from "./Q5AIStyle";
import { Loader2 } from "lucide-react";

export const OnboardingContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [assessmentAnswers, setAssessmentAnswers] = useState({
    q1_industry_type: "",
    q2_company_size: "",
    q3_pain_points: [] as string[],
    q4_data_readiness: [] as string[],
    q5_ai_style: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/login");
        return;
      }
      setUser(user);
      setIsLoading(false);
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/auth/login");
    }
  };

  const handleAnswerChange = (field: string, value: any) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitAssessment = async (finalAnswers: any) => {
    try {
      if (!user) throw new Error("User not authenticated");

      // Save assessment to database
      const { data, error } = await supabase
        .from("onboarding_assessments")
        .insert([{
          user_id: user.id,
          q1_industry_type: finalAnswers.q1_industry_type,
          q2_company_size: finalAnswers.q2_company_size,
          q3_pain_points: finalAnswers.q3_pain_points,
          q4_data_readiness: finalAnswers.q4_data_readiness,
          q5_ai_style: finalAnswers.q5_ai_style,
          completed_at: new Date(),
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Assessment Saved",
        description: "Your answers have been saved successfully.",
      });

      // Redirect to company profile
      navigate("/onboarding/company-profile");
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      toast({
        title: "Error",
        description: "Failed to save your assessment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate question based on URL
  const currentPath = location.pathname;

  if (currentPath === "/onboarding/q1") {
    return (
      <Q1Industry
        currentAnswer={assessmentAnswers.q1_industry_type}
        onAnswerChange={(answer) => handleAnswerChange("q1_industry_type", answer)}
      />
    );
  }

  if (currentPath === "/onboarding/q2") {
    return (
      <Q2CompanySize
        currentAnswer={assessmentAnswers.q2_company_size}
        onAnswerChange={(answer) => handleAnswerChange("q2_company_size", answer)}
      />
    );
  }

  if (currentPath === "/onboarding/q3") {
    return (
      <Q3PainPoints
        currentAnswer={assessmentAnswers.q3_pain_points}
        onAnswerChange={(answers) => handleAnswerChange("q3_pain_points", answers)}
      />
    );
  }

  if (currentPath === "/onboarding/q4") {
    return (
      <Q4DataReadiness
        currentAnswer={assessmentAnswers.q4_data_readiness}
        onAnswerChange={(answers) => handleAnswerChange("q4_data_readiness", answers)}
      />
    );
  }

  if (currentPath === "/onboarding/q5") {
    return (
      <Q5AIStyle
        currentAnswer={assessmentAnswers.q5_ai_style}
        onAnswerChange={(answer) => handleAnswerChange("q5_ai_style", answer)}
        assessmentAnswers={assessmentAnswers}
        onSubmit={handleSubmitAssessment}
      />
    );
  }

  return null;
};
