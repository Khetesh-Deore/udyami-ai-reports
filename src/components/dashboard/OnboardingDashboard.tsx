import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentCard } from "./AgentCard";
import { Loader2, CheckCircle2, FileUp, Settings } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
}

const agentsList: Agent[] = [
  { id: "scheduling", name: "Production Scheduling", description: "Optimizes schedules and manages downtime" },
  { id: "qa", name: "Quality Assurance", description: "Monitors quality and catches issues early" },
  { id: "inventory", name: "Inventory Management", description: "Manages stock levels and supply" },
  { id: "sales", name: "Sales & Dispatch", description: "Handles dispatch and customer deliveries" },
  { id: "rd", name: "R&D & Formulation", description: "Supports product development decisions" },
  { id: "production", name: "Production & Reporting", description: "Manages workflows and generates reports" },
];

export const OnboardingDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/login");
        return;
      }
      setUser(user);

      // Load company
      const { data: comp } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setCompany(comp);

      if (comp) {
        // Load assessment
        const { data: assess } = await supabase
          .from("onboarding_assessments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        setAssessment(assess);

        // Load enabled agents
        const { data: enabledAgents } = await supabase
          .from("agent_configurations")
          .select("*")
          .eq("company_id", comp.id)
          .order("priority");

        setAgents(enabledAgents || []);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setIsLoading(false);
    }
  };

  const handleAgentInteract = (agentId: string) => {
    // TODO: Navigate to agent interaction page
    console.log("Interact with agent:", agentId);
  };

  const getAgentName = (agentId: string) => {
    return agentsList.find(a => a.id === agentId)?.name || agentId;
  };

  const getAgentDescription = (agentId: string) => {
    return agentsList.find(a => a.id === agentId)?.description || "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const phaseOneAgents = agents.filter(a => a.phase === 1);
  const phaseOtherAgents = agents.filter(a => a.phase > 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome, {company?.name}!
            </h1>
            <p className="text-gray-600">
              Your AI agents are configured and ready to assist.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/onboarding/knowledge-base")}
              className="flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Upload Docs
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/onboarding/company-profile")}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Assessment Summary */}
        {assessment && (
          <Card className="p-6 bg-blue-50 border border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Your Onboarding Summary
                </h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Industry:</strong> {assessment.q1_industry_type.toUpperCase()}
                  </p>
                  <p>
                    <strong>Company Size:</strong> {assessment.q2_company_size.toUpperCase()}
                  </p>
                  <p>
                    <strong>Primary Focus:</strong>{" "}
                    {assessment.q3_pain_points?.[0]?.toUpperCase() || "N/A"}
                  </p>
                  <p>
                    <strong>Interaction Style:</strong> {assessment.q5_ai_style.toUpperCase()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/onboarding/q1")}
              >
                Retake Assessment
              </Button>
            </div>
          </Card>
        )}

        {/* Phase 1 Agents - Priority */}
        {phaseOneAgents.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Phase 1 - Priority Agents</h2>
              <Badge className="bg-red-100 text-red-700">ACTIVE</Badge>
            </div>
            <p className="text-gray-600 mb-6">
              Based on your pain points, these agents are configured and ready to use.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phaseOneAgents.map(agent => (
                <AgentCard
                  key={agent.agent_id}
                  agentId={agent.agent_id}
                  name={getAgentName(agent.agent_id)}
                  description={getAgentDescription(agent.agent_id)}
                  enabled={agent.enabled}
                  phase={agent.phase}
                  shadowMode={agent.shadow_mode}
                  uxMode={agent.ux_mode}
                  onInteract={handleAgentInteract}
                />
              ))}
            </div>
          </section>
        )}

        {/* Phase 2+ Agents - Additional */}
        {phaseOtherAgents.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Phase 2 - Additional Agents</h2>
            </div>
            <p className="text-gray-600 mb-6">
              These agents are enabled and can be accessed as needed for expanded capabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phaseOtherAgents.map(agent => (
                <AgentCard
                  key={agent.agent_id}
                  agentId={agent.agent_id}
                  name={getAgentName(agent.agent_id)}
                  description={getAgentDescription(agent.agent_id)}
                  enabled={agent.enabled}
                  phase={agent.phase}
                  shadowMode={agent.shadow_mode}
                  uxMode={agent.ux_mode}
                  onInteract={handleAgentInteract}
                />
              ))}
            </div>
          </section>
        )}

        {/* Next Steps */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="font-bold text-green-600 mt-0.5">1.</span>
              <span>Upload business documents (SOPs, quality records, production data) to enhance agent intelligence.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-green-600 mt-0.5">2.</span>
              <span>Start interacting with Phase 1 agents to understand their capabilities.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-green-600 mt-0.5">3.</span>
              <span>Gradually activate Phase 2 agents as your team becomes familiar with the system.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-green-600 mt-0.5">4.</span>
              <span>Provide feedback to help us optimize agent behavior for your operations.</span>
            </li>
          </ul>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            Back to Main Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
