import { supabase } from "@/integrations/supabase/client";

export interface AgentConfigData {
  company_id: string;
  q1_industry_type: string;
  q2_company_size: string;
  q3_pain_points: string[];
  q5_ai_style: string;
}

export async function configureAgentsForCompany(
  data: AgentConfigData
): Promise<void> {
  try {
    // Call the configure-agents edge function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/configure-agents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to configure agents");
    }

    const result = await response.json();
    console.log("Agents configured:", result);
  } catch (error) {
    console.error("Error configuring agents:", error);
    throw error;
  }
}

export async function ingestDocument(
  knowledge_base_id: string,
  company_id: string,
  filename: string,
  file_type: "pdf" | "word" | "excel",
  file_url: string,
  file_size: number
): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          knowledge_base_id,
          company_id,
          filename,
          file_type,
          file_url,
          file_size,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to ingest document");
    }
  } catch (error) {
    console.error("Error ingesting document:", error);
    throw error;
  }
}

export async function ingestExcelData(
  company_id: string,
  filename: string,
  file_url: string,
  file_size: number,
  sheet_names?: string[]
): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-excel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          company_id,
          filename,
          file_url,
          file_size,
          sheet_names,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to ingest Excel data");
    }
  } catch (error) {
    console.error("Error ingesting Excel data:", error);
    throw error;
  }
}

export async function queryAgent(
  company_id: string,
  agent_id: string,
  interaction_type: "chat" | "file_upload" | "alert",
  input_data: Record<string, any>
): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/query-agent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          company_id,
          agent_id,
          user_id: user.id,
          interaction_type,
          input_data,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to query agent");
    }

    return await response.json();
  } catch (error) {
    console.error("Error querying agent:", error);
    throw error;
  }
}

export async function getEnabledAgents(
  company_id: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("agent_configurations")
      .select("*")
      .eq("company_id", company_id)
      .eq("enabled", true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching enabled agents:", error);
    return [];
  }
}

export async function getUserCompany(): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user company:", error);
    return null;
  }
}
