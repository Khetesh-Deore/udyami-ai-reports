import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AGENT_CONFIG = {
  manufacturing: {
    agents: ["scheduling", "qa", "inventory", "sales", "rd", "production"],
  },
  trading: {
    agents: ["inventory", "sales", "production"],
  },
  services: {
    agents: ["production", "scheduling", "qa"],
  },
  mixed: {
    agents: ["scheduling", "qa", "inventory", "sales", "rd", "production"],
  },
};

const COMPANY_SIZE_LIMITS: Record<string, number> = {
  small: 2,
  medium: 4,
  large: 6,
  enterprise: 6,
};

const PAIN_POINT_AGENT_MAP: Record<string, string> = {
  downtime: "scheduling",
  quality: "qa",
  inventory: "inventory",
  dispatch: "sales",
  rd: "rd",
  reporting: "production",
};

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { company_id, assessment_id, q1_industry_type, q2_company_size, q3_pain_points, q5_ai_style } = await req.json();

    if (!company_id || !q1_industry_type || !q2_company_size) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Get enabled agents for industry
    const industryAgents = (AGENT_CONFIG as any)[q1_industry_type]?.agents || [];
    const maxAgents = COMPANY_SIZE_LIMITS[q2_company_size] || 6;
    const enabledAgents = industryAgents.slice(0, maxAgents);

    // Get priority agent from first pain point
    const priorityAgent = q3_pain_points?.[0] ? PAIN_POINT_AGENT_MAP[q3_pain_points[0]] : null;

    // Configure agents
    const agentConfigs = enabledAgents.map((agent_id: string, index: number) => ({
      company_id,
      agent_id,
      enabled: true,
      shadow_mode: false,
      ux_mode: q5_ai_style || "hybrid",
      phase: agent_id === priorityAgent ? 1 : 2,
      priority: agent_id === priorityAgent ? 1 : index + 2,
      config_data: JSON.stringify({
        industry_type: q1_industry_type,
        company_size: q2_company_size,
        pain_points: q3_pain_points || [],
      }),
    }));

    // Upsert agent configurations
    for (const config of agentConfigs) {
      const { error } = await supabase
        .from("agent_configurations")
        .upsert([config], { onConflict: "company_id,agent_id" });

      if (error) {
        console.error("Error configuring agent:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    // Create knowledge bases for each agent
    for (const agent_id of enabledAgents) {
      const { error } = await supabase
        .from("knowledge_bases")
        .insert([{
          company_id,
          agent_id,
          name: `${agent_id} Knowledge Base`,
          description: `Knowledge base for ${agent_id} agent`,
        }]);

      if (error && !error.message.includes("duplicate")) {
        console.error("Error creating knowledge base:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        configured_agents: enabledAgents,
        priority_agent: priorityAgent,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in configure-agents:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
