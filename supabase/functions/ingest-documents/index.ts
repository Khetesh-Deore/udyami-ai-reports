import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IngestionRequest {
  knowledge_base_id: string;
  company_id: string;
  filename: string;
  file_type: "pdf" | "word" | "excel";
  file_url: string;
  file_size: number;
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const {
      knowledge_base_id,
      company_id,
      filename,
      file_type,
      file_url,
      file_size,
    }: IngestionRequest = await req.json();

    if (!knowledge_base_id || !company_id || !filename) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Create document record
    const { data: docData, error: docError } = await supabase
      .from("knowledge_base_documents")
      .insert([{
        knowledge_base_id,
        company_id,
        filename,
        file_type,
        file_url,
        file_size,
        status: "processing",
        chunks_count: 0,
      }])
      .select()
      .single();

    if (docError) {
      return new Response(JSON.stringify({ error: docError.message }), { status: 500 });
    }

    // TODO: Integrate with actual document processing service
    // This would typically:
    // 1. Download document from file_url
    // 2. Extract text/content based on file_type
    // 3. Split into chunks (for vector embedding)
    // 4. Generate embeddings using OpenAI or similar
    // 5. Store in vector database (Pinecone, Weaviate, etc.)
    // 6. Update status to "indexed"

    // For now, mark as ready after a simulated processing delay
    setTimeout(async () => {
      await supabase
        .from("knowledge_base_documents")
        .update({
          status: "indexed",
          chunks_count: Math.ceil(file_size / 1024), // Rough estimate
        })
        .eq("id", docData.id);
    }, 2000);

    return new Response(
      JSON.stringify({
        success: true,
        document_id: docData.id,
        status: "processing",
        message: "Document ingestion started. Processing in background.",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ingest-documents:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
