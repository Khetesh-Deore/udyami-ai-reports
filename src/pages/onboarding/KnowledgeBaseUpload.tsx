import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FileUp, CheckCircle2 } from "lucide-react";

interface UploadedFile {
  id: string;
  filename: string;
  file_type: "pdf" | "word" | "excel";
  status: "uploading" | "processing" | "indexed";
  progress?: number;
}

export const KnowledgeBaseUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth/login");
      return;
    }
    setUser(user);

    // Get company
    const { data: comp } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (comp) {
      setCompany(comp);

      // Get latest assessment
      const { data: assessment } = await supabase
        .from("onboarding_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (assessment) {
        setAssessmentData(assessment);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !company) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileType = getFileType(file.name);
        if (!fileType) {
          toast({
            title: "Unsupported file type",
            description: `${file.name} is not supported. Please use PDF, Word, or Excel files.`,
            variant: "destructive",
          });
          continue;
        }

        const fileId = Math.random().toString(36).substring(7);
        setUploadedFiles(prev => [...prev, {
          id: fileId,
          filename: file.name,
          file_type: fileType as any,
          status: "uploading",
          progress: 0,
        }]);

        // Upload to storage
        const filePath = `companies/${company.id}/documents/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("knowledge-base")
          .upload(filePath, file, {
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("knowledge-base")
          .getPublicUrl(filePath);

        // Update status
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: "processing" } : f
        ));

        toast({
          title: "File uploaded",
          description: `${file.name} is being processed.`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileType = (filename: string): string | null => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || "")) return "pdf";
    if (["doc", "docx"].includes(ext || "")) return "word";
    if (["xls", "xlsx", "csv"].includes(ext || "")) return "excel";
    return null;
  };

  const handleContinue = async () => {
    setIsConfiguring(true);

    try {
      if (!company || !assessmentData || !user) {
        throw new Error("Missing required data");
      }

      // Call configure-agents function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/configure-agents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            company_id: company.id,
            assessment_id: assessmentData.id,
            q1_industry_type: assessmentData.q1_industry_type,
            q2_company_size: assessmentData.q2_company_size,
            q3_pain_points: assessmentData.q3_pain_points,
            q5_ai_style: assessmentData.q5_ai_style,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to configure agents");

      toast({
        title: "Success!",
        description: "Your agents have been configured and are ready to use.",
      });

      // Redirect to onboarding dashboard
      navigate("/onboarding/dashboard");
    } catch (error) {
      console.error("Configuration error:", error);
      toast({
        title: "Error",
        description: "Failed to configure agents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Knowledge Base (Optional)
          </h1>
          <p className="text-gray-600">
            Upload documents to help your AI agents provide better insights
          </p>
        </div>

        {/* Upload Card */}
        <Card className="p-8 border-2 border-dashed border-gray-300 mb-8">
          <label className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <FileUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">
                  {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-gray-600">
                  PDF, Word docs, or Excel files (up to 25MB each)
                </p>
              </div>
            </div>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </Card>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 mb-8">
            <h2 className="font-semibold text-gray-900">Uploaded Files</h2>
            {uploadedFiles.map(file => (
              <Card key={file.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.filename}</p>
                  <p className="text-sm text-gray-500">{file.file_type.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {file.status === "indexed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {file.status !== "indexed" && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  <span className="text-sm text-gray-600 capitalize">{file.status}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-900">
            You can skip this step and upload documents later. Your agents are ready to work!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/onboarding/company-profile")}
            disabled={isConfiguring}
            className="px-6"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={isConfiguring}
            className="flex-1 bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            {isConfiguring && <Loader2 className="w-4 h-4 animate-spin" />}
            {isConfiguring ? "Configuring Agents..." : "Go to Dashboard"}
          </Button>
        </div>
      </div>
    </div>
  );
};
