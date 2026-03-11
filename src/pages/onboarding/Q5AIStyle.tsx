import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Q5AIStyleProps {
  onAnswerChange: (answer: string) => void;
  onSubmit: (allAnswers: any) => Promise<void>;
  currentAnswer?: string;
  assessmentAnswers?: any;
}

const styles = [
  {
    value: "chat",
    label: "Chat interface",
    description: "Type a question, get an instant answer",
    icon: "💬",
  },
  {
    value: "file_upload",
    label: "File upload",
    description: "Upload a file and get a structured report",
    icon: "📁",
  },
  {
    value: "alerts",
    label: "Proactive alerts",
    description: "Get proactive alerts without asking",
    icon: "🔔",
  },
  {
    value: "hybrid",
    label: "Mix of all the above",
    description: "Use all three modes together",
    icon: "🎯",
  },
];

export const Q5AIStyle = ({ 
  onAnswerChange, 
  onSubmit, 
  currentAnswer,
  assessmentAnswers 
}: Q5AIStyleProps) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(currentAnswer || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (value: string) => {
    setSelected(value);
    onAnswerChange(value);
  };

  const handleSubmit = async () => {
    if (!selected) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...assessmentAnswers,
        q5_ai_style: selected,
      });
      // Navigation will be handled by parent component
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/onboarding/q4");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Question 5 of 5</h2>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="w-full h-full bg-cyan-600 rounded-full transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            How would your managers ideally want to use an AI assistant?
          </h1>
          <p className="text-lg text-gray-600">
            This determines which interaction modes are enabled for all your agents.
          </p>
        </div>

        {/* Style Options */}
        <div className="space-y-4 mb-8">
          {styles.map((style) => {
            const isSelected = selected === style.value;

            return (
              <Card
                key={style.value}
                className={`p-6 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-cyan-600 bg-cyan-50"
                    : "border border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => handleSelect(style.value)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg text-2xl flex items-center justify-center w-12 h-12 ${
                    isSelected ? "bg-cyan-100" : "bg-gray-100"
                  }`}>
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{style.label}</h3>
                    <p className="text-sm text-gray-500">{style.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-cyan-600 bg-cyan-600"
                      : "border-gray-300"
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Completion Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-900 font-medium">
            ✓ After this, you'll set up your company profile and knowledge base
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="px-6"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selected || isSubmitting}
            className="px-8 bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
          >
            {isSubmitting && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {isSubmitting ? "Saving..." : "Complete Assessment"}
          </Button>
        </div>
      </div>
    </div>
  );
};
