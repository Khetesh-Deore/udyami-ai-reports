import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExcelIngestionRequest {
  company_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  sheet_names?: string[];
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const {
      company_id,
      filename,
      file_url,
      file_size,
      sheet_names = [],
    }: ExcelIngestionRequest = await req.json();

    if (!company_id || !filename) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Create Excel data source record
    const { data: excelData, error: excelError } = await supabase
      .from("excel_data_sources")
      .insert([{
        company_id,
        filename,
        file_url,
        file_size,
        sheet_names: sheet_names.length > 0 ? sheet_names : null,
        status: "processing",
        parsed_data: JSON.stringify({}),
      }])
      .select()
      .single();

    if (excelError) {
      return new Response(JSON.stringify({ error: excelError.message }), { status: 500 });
    }

    // TODO: Integrate with actual Excel processing service
    // This would typically:
    // 1. Download Excel file from file_url
    // 2. Parse sheets and extract data
    // 3. Convert to structured JSON format
    // 4. Store parsed data in parsed_data JSONB column
    // 5. Index for querying by agents
    // 6. Update status to "ready"

    // For now, mark as ready after a simulated processing delay
    setTimeout(async () => {
      await supabase
        .from("excel_data_sources")
        .update({
          status: "ready",
          parsed_data: JSON.stringify({
            sheets_processed: sheet_names.length,
            ingestion_date: new Date().toISOString(),
            note: "Sample parsed data structure",
          }),
        })
        .eq("id", excelData.id);
    }, 3000);

    return new Response(
      JSON.stringify({
        success: true,
        excel_id: excelData.id,
        status: "processing",
        message: "Excel file ingestion started. Processing in background.",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ingest-excel:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
