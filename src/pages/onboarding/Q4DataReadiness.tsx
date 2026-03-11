import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Zap } from "lucide-react";

interface Q4DataReadinessProps {
  onAnswerChange: (answers: string[]) => void;
  currentAnswer?: string[];
}

const documents = [
  {
    value: "has_sops",
    label: "SOPs and process manuals",
    types: "PDF/Word",
    enablesRag: true,
    icon: "📋",
  },
  {
    value: "has_quality_docs",
    label: "Quality standards and test reports",
    types: "PDF/Excel",
    enablesAgent: "QA",
    icon: "✅",
  },
  {
    value: "has_machine_docs",
    label: "Machine or equipment manuals",
    types: "PDF/Word",
    enablesAgent: "Scheduling",
    icon: "⚙️",
  },
  {
    value: "has_excel_data",
    label: "Historical production/sales records",
    types: "Excel",
    enablesIngestion: true,
    icon: "📊",
  },
  {
    value: "low_readiness",
    label: "We have most things in paper / not digitized",
    types: "Not applicable",
    enablesShadowMode: true,
    icon: "📄",
  },
];

export const Q4DataReadiness = ({ onAnswerChange, currentAnswer }: Q4DataReadinessProps) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(currentAnswer || []);

  const handleToggle = (value: string) => {
    // If selecting "low_readiness", deselect all others and select only this
    if (value === "low_readiness" && !selected.includes("low_readiness")) {
      setSelected(["low_readiness"]);
      onAnswerChange(["low_readiness"]);
      return;
    }

    // If deselecting "low_readiness", allow normal toggle
    if (value === "low_readiness") {
      const newSelected = selected.filter(s => s !== value);
      setSelected(newSelected);
      onAnswerChange(newSelected);
      return;
    }

    // If "low_readiness" is selected, don't allow selecting other items
    if (selected.includes("low_readiness")) {
      return;
    }

    // Normal toggle for other items
    let newSelected: string[];
    if (selected.includes(value)) {
      newSelected = selected.filter(s => s !== value);
    } else {
      newSelected = [...selected, value];
    }

    setSelected(newSelected);
    onAnswerChange(newSelected);
  };

  const handleNext = () => {
    if (selected.length > 0) {
      navigate("/onboarding/q5");
    }
  };

  const handleBack = () => {
    navigate("/onboarding/q3");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Question 4 of 5</h2>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="w-4/5 h-full bg-purple-600 rounded-full transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            What business documents or data do you currently maintain digitally?
          </h1>
          <p className="text-lg text-gray-600">
            This helps us understand what data sources to integrate with your AI agents.
          </p>
        </div>

        {/* Document Options */}
        <div className="space-y-3 mb-8">
          {documents.map((doc) => {
            const isSelected = selected.includes(doc.value);
            const isDisabled = selected.includes("low_readiness") && doc.value !== "low_readiness";

            return (
              <Card
                key={doc.value}
                className={`p-5 cursor-pointer transition-all duration-200 ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                } ${
                  isSelected
                    ? "border-2 border-purple-600 bg-purple-50"
                    : "border border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => !isDisabled && handleToggle(doc.value)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{doc.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {doc.types}
                      {(doc.enablesRag || doc.enablesAgent || doc.enablesIngestion || doc.enablesShadowMode) && (
                        <span className="ml-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {doc.enablesRag && "Enables RAG for all agents"}
                          {doc.enablesAgent && `Enables ${doc.enablesAgent} agent`}
                          {doc.enablesIngestion && "Enables Excel ingestion"}
                          {doc.enablesShadowMode && "Activates shadow mode"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? "border-purple-600 bg-purple-600"
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

        {/* Info message */}
        {selected.includes("low_readiness") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              No worries! We'll guide you on digitizing key business documents and enabling shadow mode for learning.
            </p>
          </div>
        )}

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
            className="px-8 bg-purple-600 hover:bg-purple-700"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
