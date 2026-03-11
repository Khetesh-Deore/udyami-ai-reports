import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Q3PainPointsProps {
  onAnswerChange: (answers: string[]) => void;
  currentAnswer?: string[];
}

const painPoints = [
  {
    value: "downtime",
    label: "Machine downtime / scheduling chaos",
    icon: "⏰",
  },
  {
    value: "quality",
    label: "Quality failures / rejections caught late",
    icon: "✓",
  },
  {
    value: "inventory",
    label: "Raw material shortages or excess inventory",
    icon: "📦",
  },
  {
    value: "dispatch",
    label: "Missed delivery deadlines / dispatch errors",
    icon: "🚚",
  },
  {
    value: "rd",
    label: "Slow or outdated R&D / formulation decisions",
    icon: "🧪",
  },
  {
    value: "reporting",
    label: "Manual reporting eating manager time",
    icon: "📊",
  },
];

export const Q3PainPoints = ({ onAnswerChange, currentAnswer }: Q3PainPointsProps) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(currentAnswer || []);

  const handleToggle = (value: string) => {
    let newSelected: string[];

    if (selected.includes(value)) {
      newSelected = selected.filter(s => s !== value);
    } else {
      if (selected.length < 2) {
        newSelected = [...selected, value];
      } else {
        return; // Don't allow more than 2 selections
      }
    }

    setSelected(newSelected);
    onAnswerChange(newSelected);
  };

  const handleNext = () => {
    if (selected.length > 0) {
      navigate("/onboarding/q4");
    }
  };

  const handleBack = () => {
    navigate("/onboarding/q2");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Question 3 of 5</h2>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="w-3/5 h-full bg-orange-600 rounded-full transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Where does your team lose the most time or money?
          </h1>
          <p className="text-lg text-gray-600">
            Pick your top 2 pain points. We'll prioritize AI agents accordingly.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Selected items determine which agents pilot first in your system.
          </p>
        </div>

        {/* Pain Points Options */}
        <div className="space-y-3 mb-8">
          {painPoints.map((point) => {
            const isSelected = selected.includes(point.value);

            return (
              <Card
                key={point.value}
                className={`p-5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-orange-600 bg-orange-50"
                    : "border border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => handleToggle(point.value)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{point.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{point.label}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? "border-orange-600 bg-orange-600"
                      : "border-gray-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Selection Counter */}
        <div className="text-sm text-gray-600 mb-6">
          {selected.length}/2 selected {selected.length === 2 && "- Maximum reached"}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="px-6"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={selected.length === 0}
            className="px-8 bg-orange-600 hover:bg-orange-700"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
