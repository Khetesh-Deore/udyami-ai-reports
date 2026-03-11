export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabledFor: {
    industries: string[];
    minSize: string;
  };
}

export interface Config {
  agents: Agent[];
  industryAgentMapping: Record<string, string[]>;
  companySizes: Record<string, any>;
  painPointMapping: Record<string, any>;
  uxModes: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  dataReadinessDocuments: Array<{
    key: string;
    label: string;
    types?: string[];
    enablesRag?: boolean;
    enablesAgent?: string;
    enablesIngestion?: boolean;
    enablesShadowMode?: boolean;
  }>;
}

let configCache: Config | null = null;

export async function loadConfig(): Promise<Config> {
  if (configCache) {
    return configCache;
  }

  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json() as Config;
    configCache = config;
    return config;
  } catch (error) {
    console.error('Failed to load config.json:', error);
    throw new Error('Failed to load configuration');
  }
}

export function getEnabledAgents(industry: string, companySize: string, config: Config): string[] {
  const industryAgents = config.industryAgentMapping[industry] || [];
  const sizeConfig = config.companySizes[companySize];
  const maxAgents = sizeConfig?.maxAgents || 6;
  
  return industryAgents.slice(0, maxAgents);
}

export function getPrioritizedAgent(painPoints: string[], config: Config): string | null {
  if (!painPoints || painPoints.length === 0) return null;
  
  const topPainPoint = painPoints[0];
  const mapping = config.painPointMapping[topPainPoint];
  
  return mapping?.agent || null;
}

export function getUXModeConfig(uxMode: string, config: Config) {
  return config.uxModes.find(mode => mode.id === uxMode);
}

export function getDataReadinessConfig(key: string, config: Config) {
  return config.dataReadinessDocuments.find(doc => doc.key === key);
}

export function getAgentById(agentId: string, config: Config): Agent | undefined {
  return config.agents.find(agent => agent.id === agentId);
}
