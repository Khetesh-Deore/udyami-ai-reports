import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface Q2CompanySizeProps {
  onAnswerChange: (answer: string) => void;
  currentAnswer?: string;
}

const sizes = [
  {
    value: "small",
    label: "1-2 departments",
    description: "Deploy up to 2 agents max",
  },
  {
    value: "medium",
    label: "3-4 departments",
    description: "Deploy 3-4 agents",
  },
  {
    value: "large",
    label: "5-6 departments",
    description: "Deploy 5-6 agents",
  },
  {
    value: "enterprise",
    label: "7+ departments",
    description: "Full suite + priority support",
  },
];

export const Q2CompanySize = ({ onAnswerChange, currentAnswer }: Q2CompanySizeProps) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(currentAnswer || null);

  const handleSelect = (value: string) => {
    setSelected(value);
    onAnswerChange(value);
  };

  const handleNext = () => {
    if (selected) {
      navigate("/onboarding/q3");
    }
  };

  const handleBack = () => {
    navigate("/onboarding/q1");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Question 2 of 5</h2>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="w-2/5 h-full bg-green-600 rounded-full transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            How many departments or teams actively manage operations?
          </h1>
          <p className="text-lg text-gray-600">
            This determines how many AI agents we deploy to support your operations.
          </p>
        </div>

        {/* Size Options */}
        <div className="space-y-4 mb-8">
          {sizes.map((size) => {
            const isSelected = selected === size.value;

            return (
              <Card
                key={size.value}
                className={`p-6 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-green-600 bg-green-50"
                    : "border border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => handleSelect(size.value)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{size.label}</h3>
                    <p className="text-sm text-gray-500">{size.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-green-600 bg-green-600"
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
            disabled={!selected}
            className="px-8 bg-green-600 hover:bg-green-700"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
