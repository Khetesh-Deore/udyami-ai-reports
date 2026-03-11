import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QueryRequest {
  company_id: string;
  agent_id: string;
  user_id: string;
  interaction_type: "chat" | "file_upload" | "alert";
  input_data: Record<string, any>;
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const {
      company_id,
      agent_id,
      user_id,
      interaction_type,
      input_data,
    }: QueryRequest = await req.json();

    if (!company_id || !agent_id || !user_id) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Check if agent is configured for this company
    const { data: agentConfig, error: configError } = await supabase
      .from("agent_configurations")
      .select("*")
      .eq("company_id", company_id)
      .eq("agent_id", agent_id)
      .single();

    if (configError || !agentConfig?.enabled) {
      return new Response(
        JSON.stringify({ error: "Agent not configured for this company" }),
        { status: 403 }
      );
    }

    // Get knowledge base for this agent
    const { data: kb } = await supabase
      .from("knowledge_bases")
      .select("id, vector_store_id")
      .eq("company_id", company_id)
      .eq("agent_id", agent_id)
      .single();

    // Get recent documents
    const { data: documents } = await supabase
      .from("knowledge_base_documents")
      .select("*")
      .eq("knowledge_base_id", kb?.id)
      .eq("status", "indexed")
      .limit(5);

    // TODO: Integrate with actual AI agent
    // This would typically:
    // 1. Use RAG to retrieve relevant documents from vector store
    // 2. Query the agent's underlying AI model with context
    // 3. Generate response
    // 4. Process according to ux_mode (chat, file_upload, alerts)
    // 5. Execute any recommended actions

    const mockResponse = {
      text: `Agent "${agent_id}" processed your query successfully.`,
      confidence: 0.85,
      sources: documents?.map(d => d.filename) || [],
      recommended_action: null,
    };

    // Record interaction
    const { data: interaction, error: interactionError } = await supabase
      .from("agent_interactions")
      .insert([{
        company_id,
        agent_id,
        user_id,
        interaction_type,
        input_data,
        output_data: mockResponse,
        metadata: {
          knowledge_base_id: kb?.id,
          documents_used: documents?.length || 0,
        },
      }])
      .select()
      .single();

    if (interactionError) {
      console.error("Error recording interaction:", interactionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        interaction_id: interaction?.id,
        response: mockResponse,
        shadow_mode: agentConfig.shadow_mode,
        message: agentConfig.shadow_mode
          ? "Agent running in shadow mode - no actions executed"
          : "Agent query processed successfully",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in query-agent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
