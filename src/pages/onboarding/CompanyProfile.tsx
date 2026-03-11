import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2 } from "lucide-react";

interface CompanyFormData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  gst_number?: string;
}

export const CompanyProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyFormData>();
  const [user, setUser] = useState<any>(null);

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
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (!user) throw new Error("User not authenticated");

      // Create company record
      const { data: company, error } = await supabase
        .from("companies")
        .insert([{
          user_id: user.id,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          location: data.location || null,
          gst_number: data.gst_number || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Company Profile Created",
        description: "Your company information has been saved.",
      });

      // Redirect to knowledge base upload
      navigate("/onboarding/knowledge-base");
    } catch (error) {
      console.error("Failed to create company profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your company profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-slate-900 text-white rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
              <p className="text-gray-600 mt-1">Tell us about your business</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8 border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
                Company Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., Acme Manufacturing"
                className="mt-2"
                {...register("name", {
                  required: "Company name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Company Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Company Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@company.com"
                className="mt-2"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                className="mt-2"
                {...register("phone")}
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-sm font-semibold text-gray-900">
                Location (Optional)
              </Label>
              <Input
                id="location"
                placeholder="City, State"
                className="mt-2"
                {...register("location")}
              />
            </div>

            {/* GST Number */}
            <div>
              <Label htmlFor="gst_number" className="text-sm font-semibold text-gray-900">
                GST Number (Optional)
              </Label>
              <Input
                id="gst_number"
                placeholder="27AAPCU9603R1Z5"
                className="mt-2"
                {...register("gst_number")}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/onboarding/q5")}
                className="px-6"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-slate-900 hover:bg-slate-800 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Creating Company..." : "Create Company"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You can update this information anytime in your company settings.
          </p>
        </div>
      </div>
    </div>
  );
};
