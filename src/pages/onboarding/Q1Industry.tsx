import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Factory, Store, Briefcase, Zap } from "lucide-react";

interface Q1IndustryProps {
  onAnswerChange: (answer: string) => void;
  currentAnswer?: string;
}

const industries = [
  {
    value: "manufacturing",
    label: "We manufacture a physical product",
    icon: Factory,
    description: "Production of physical goods",
  },
  {
    value: "trading",
    label: "We trade / distribute goods",
    icon: Store,
    description: "Wholesale, retail, distribution",
  },
  {
    value: "services",
    label: "We provide services",
    icon: Briefcase,
    description: "Service-based business",
  },
  {
    value: "mixed",
    label: "Mix of manufacturing + trading",
    icon: Zap,
    description: "Hybrid business model",
  },
];

export const Q1Industry = ({ onAnswerChange, currentAnswer }: Q1IndustryProps) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(currentAnswer || null);

  const handleSelect = (value: string) => {
    setSelected(value);
    onAnswerChange(value);
  };

  const handleNext = () => {
    if (selected) {
      navigate("/onboarding/q2");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Question 1 of 5</h2>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="w-1/5 h-full bg-blue-600 rounded-full transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            What does your business primarily do?
          </h1>
          <p className="text-lg text-gray-600">
            This helps us understand which AI agents will be most valuable for your operations.
          </p>
        </div>

        {/* Industry Options */}
        <div className="space-y-4 mb-8">
          {industries.map((industry) => {
            const Icon = industry.icon;
            const isSelected = selected === industry.value;

            return (
              <Card
                key={industry.value}
                className={`p-6 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-blue-600 bg-blue-50"
                    : "border border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => handleSelect(industry.value)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{industry.label}</h3>
                    <p className="text-sm text-gray-500">{industry.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-blue-600 bg-blue-600"
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
            onClick={() => navigate("/")}
            className="px-6"
          >
            Back to Home
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selected}
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
