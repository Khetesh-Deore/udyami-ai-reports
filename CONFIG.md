# UDYAMI AI - config.yaml Reference Guide

## Overview

The `config.yaml` file is the central configuration file for the UDYAMI AI multi-agent platform. It defines:
- Available AI agents and their capabilities
- Industry-to-agent mapping
- Company size constraints
- Pain point prioritization
- UX modes for user interaction
- Data readiness indicators

All agent configurations are automatically generated based on user assessments using this config.

## File Location

```
/config.yaml
```

## Configuration Sections

### 1. Agents Definition

Each agent represents a specialized AI capability for specific business operations.

```yaml
agents:
  - id: scheduling
    name: Production Scheduling
    description: Optimizes production schedules and manages downtime
    icon: Clock
    enabledFor:
      industries: [manufacturing, mixed]
      minSize: small
```

**Fields:**
- `id`: Unique identifier (used in database)
- `name`: Display name for UI
- `description`: What the agent does
- `icon`: Icon name (from lucide-react)
- `enabledFor.industries`: Which industries get this agent
- `enabledFor.minSize`: Minimum company size to access

### 2. Industry-to-Agent Mapping

Defines which agents are enabled for each industry type.

```yaml
industryAgentMapping:
  manufacturing: [scheduling, qa, inventory, sales, rd, production]
  trading: [inventory, sales, production]
  services: [production, scheduling, qa]
  mixed: [scheduling, qa, inventory, sales, rd, production]
```

**Logic:**
- When user selects an industry in Q1, these agents become available
- Company size in Q2 limits how many are actually deployed
- Pain points in Q3 determine priority (Phase 1 vs Phase 2)

### 3. Company Sizes

Maps company size to maximum number of agents deployed.

```yaml
companySizes:
  small: { departments: "1-2", maxAgents: 2 }
  medium: { departments: "3-4", maxAgents: 4 }
  large: { departments: "5-6", maxAgents: 6 }
  enterprise: { departments: "7+", maxAgents: 6, prioritySupport: true }
```

**Usage:**
- User answers Q2 (company size)
- System limits available agents to `maxAgents` value
- Enterprise tier enables priority support flag

### 4. Pain Point Mapping

Links business pain points to specific agents for prioritization.

```yaml
painPointMapping:
  downtime: { agent: scheduling, priority: 1 }
  quality: { agent: qa, priority: 1 }
  inventory: { agent: inventory, priority: 1 }
  dispatch: { agent: sales, priority: 1 }
  rd: { agent: rd, priority: 1 }
  reporting: { agent: production, priority: 1 }
```

**Logic:**
- User selects top 2 pain points in Q3
- First pain point (`index: 0`) gets `phase: 1` (active immediately)
- Other enabled agents get `phase: 2` (available but not primary)

### 5. UX Modes

Defines interaction styles for all agents.

```yaml
uxModes:
  - id: chat
    label: Chat interface
    description: Type questions, get instant answers
  - id: file_upload
    label: File upload
    description: Upload files and get structured reports
  - id: alerts
    label: Proactive alerts
    description: Get notifications without asking
  - id: hybrid
    label: Mix of all
    description: Use all three modes together
```

**Applied in Q5:**
- User selects preferred interaction style
- All configured agents inherit this `ux_mode`
- Agents respect mode constraints in their implementations

### 6. Data Readiness Documents

Indicates what documents unlock specific capabilities.

```yaml
dataReadinessDocuments:
  - key: has_sops
    label: SOPs and process manuals
    types: [pdf, word]
    enablesRag: true
  
  - key: has_quality_docs
    label: Quality standards and test reports
    types: [pdf, excel]
    enablesAgent: qa
  
  - key: low_readiness
    label: We have most things in paper
    enablesShadowMode: true
```

**Fields:**
- `key`: Identifier in Q4 answers
- `label`: Display text for user
- `types`: Supported file formats
- `enablesRag`: Enables RAG across all agents
- `enablesAgent`: Enables specific agent RAG
- `enablesIngestion`: Enables Excel data processing
- `enablesShadowMode`: Activates learning-only mode

## How Configuration Flows Through the System

### 1. User Onboarding (Q1-Q5)

```
Q1: Industry → industryAgentMapping → Available agents
Q2: Company Size → companySizes.maxAgents → Limit agents
Q3: Pain Points → painPointMapping → Phase 1 agent priority
Q4: Data Readiness → dataReadinessDocuments → RAG enabling
Q5: UX Style → uxModes → Agent interaction configuration
```

### 2. Agent Configuration (Backend)

After user completes Q5:

```javascript
// Pseudo-code: supabase/functions/configure-agents/index.ts
const enabledAgents = industryAgentMapping[q1_industry]
  .slice(0, companySizes[q2_company_size].maxAgents)

enabledAgents.forEach((agent_id, index) => {
  const phase = agent_id === painPointMapping[q3_painPoints[0]].agent ? 1 : 2
  const uxMode = q5_ai_style
  
  // Insert into agent_configurations table
})
```

### 3. Dashboard Display

```
agents WHERE phase = 1 → "Phase 1 - Priority Agents"
agents WHERE phase > 1 → "Phase 2 - Additional Agents"
agents WHERE enabled = false → "Disabled Agents"
```

## Modifying the Configuration

### Adding a New Agent

1. Add to `agents` section:
```yaml
  - id: forecasting
    name: Demand Forecasting
    description: Predicts demand patterns
    icon: TrendingUp
    enabledFor:
      industries: [manufacturing, trading, mixed]
      minSize: small
```

2. Add to `industryAgentMapping`:
```yaml
industryAgentMapping:
  manufacturing: [..., forecasting]
```

3. Optionally add to `painPointMapping` if it addresses a pain point

4. Migrations and code generation happen automatically

### Changing Agent Availability

To restrict an agent to specific industries:

```yaml
enabledFor:
  industries: [manufacturing]  # Now only for manufacturing
```

To increase max agents for enterprise:

```yaml
enterprise: { departments: "7+", maxAgents: 8, prioritySupport: true }
```

### Adding a New UX Mode

```yaml
uxModes:
  - id: api_integration
    label: API Integration
    description: Integrate agent via API calls
```

Agents will then support this mode automatically.

## Database Schema Alignment

The config drives these Supabase tables:

- `agent_configurations` - `agent_id`, `ux_mode`, `phase`, `enabled`
- `knowledge_bases` - created for each agent per company
- `onboarding_assessments` - stores user Q1-Q5 answers
- `companies` - company profile from form

## Best Practices

1. **Consistency:** All agents in industry mapping must be defined in `agents` section
2. **Pain Points:** Every pain point must map to a valid agent
3. **Sizing:** `companySizes.maxAgents` should align with available agents
4. **Documentation:** Update comments when adding agents or changing logic
5. **Testing:** Test onboarding flow after any config changes

## Loading Config at Runtime

The config is loaded dynamically:

```typescript
import { loadConfig } from "@/lib/configLoader";

const config = await loadConfig();
const enabledAgents = getEnabledAgents("manufacturing", "large", config);
```

**Note:** YAML is parsed by `js-yaml` library (must be installed in dependencies)

## Troubleshooting

**Issue:** Agent not appearing in Q1-Q5 flow
- Check `industryAgentMapping` includes the agent
- Verify agent is defined in `agents` section

**Issue:** Wrong phase assignment
- Verify pain point mapping in `painPointMapping`
- Check Q3 pain points are stored correctly

**Issue:** UX mode not applied
- Ensure `q5_ai_style` matches a key in `uxModes`
- Verify agents check `agent_configurations.ux_mode` column
