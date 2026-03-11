import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Zap, AlertCircle } from "lucide-react";

interface AgentCardProps {
  agentId: string;
  name: string;
  description: string;
  enabled: boolean;
  phase: number;
  shadowMode: boolean;
  uxMode: string;
  icon?: React.ReactNode;
  onInteract: (agentId: string) => void;
}

const agentIcons: Record<string, React.ReactNode> = {
  scheduling: "🕐",
  qa: "✅",
  inventory: "📦",
  sales: "🚚",
  rd: "🧪",
  production: "🏭",
};

export const AgentCard = ({
  agentId,
  name,
  description,
  enabled,
  phase,
  shadowMode,
  uxMode,
  onInteract,
}: AgentCardProps) => {
  const icon = agentIcons[agentId] || "🤖";

  return (
    <Card className={`p-6 transition-all duration-200 hover:shadow-md ${
      !enabled ? "opacity-50" : ""
    }`}>
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            {shadowMode && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Shadow Mode
              </Badge>
            )}
            {phase === 1 && (
              <Badge className="bg-blue-100 text-blue-700">Phase 1</Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Status and Config */}
      <div className="flex items-center gap-4 mb-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600">Phase {phase}</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600 capitalize">{uxMode}</span>
        </div>
        {!enabled && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Disabled</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {enabled && (
        <Button
          onClick={() => onInteract(agentId)}
          variant="outline"
          className="w-full"
          disabled={shadowMode}
        >
          {shadowMode ? "Learning Mode" : "Interact"}
        </Button>
      )}
    </Card>
  );
};
