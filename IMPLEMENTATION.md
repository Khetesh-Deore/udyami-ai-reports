# UDYAMI AI - Implementation Guide

## Quick Start

### 1. Database Setup

Run the migration to create onboarding tables:

```bash
# Using Supabase CLI
supabase db push

# Or execute manually in Supabase SQL editor:
# supabase/migrations/20260312_onboarding_schema.sql
```

**Tables created:**
- `companies` - Company profile information
- `onboarding_assessments` - User assessment answers (Q1-Q5)
- `knowledge_bases` - Knowledge base per agent per company
- `knowledge_base_documents` - Uploaded documents
- `excel_data_sources` - Excel/CSV data sources
- `agent_configurations` - Agent settings per company
- `agent_interactions` - Interaction audit trail

### 2. Install Dependencies

```bash
npm install js-yaml
```

The `js-yaml` package is required for loading `config.yaml`.

### 3. Configure Supabase Functions

Deploy edge functions:

```bash
supabase functions deploy configure-agents
supabase functions deploy ingest-documents
supabase functions deploy ingest-excel
supabase functions deploy query-agent
```

Or use the Supabase dashboard to upload manually.

### 4. Set Environment Variables

Add to `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## User Flow

### New User Journey

```
1. User Signs Up/Logs In
   ↓
2. OnboardingGuard checks onboarding_assessments table
   ↓
3. If no completed assessment → Redirect to /onboarding/q1
   ↓
4. Q1: Industry Type (manufacturing, trading, services, mixed)
   ↓
5. Q2: Company Size (small, medium, large, enterprise)
   ↓
6. Q3: Pain Points (select top 2)
   ↓
7. Q4: Data Readiness (select document types available)
   ↓
8. Q5: AI Interaction Style (chat, file_upload, alerts, hybrid)
   ↓
9. Assessment saved to onboarding_assessments table
   ↓
10. Redirect to Company Profile form
   ↓
11. Company info saved to companies table
   ↓
12. Redirect to Knowledge Base Upload (optional)
   ↓
13. Calls configure-agents edge function
   ↓
14. Agents configured in agent_configurations table
   ↓
15. Redirect to /onboarding/dashboard
   ↓
16. User sees enabled agents and can interact
```

### Returning User Journey

```
User logs in
   ↓
OnboardingGuard checks onboarding_assessments
   ↓
If completed assessment exists → Show dashboard
   ↓
User interacts with enabled agents
```

## Component Architecture

### Onboarding Pages

```
src/pages/onboarding/
├── OnboardingContainer.tsx       # State management & routing
├── Q1Industry.tsx                # Industry selection
├── Q2CompanySize.tsx             # Company size selection
├── Q3PainPoints.tsx              # Pain point selection
├── Q4DataReadiness.tsx           # Data readiness selection
├── Q5AIStyle.tsx                 # UX mode selection
├── CompanyProfile.tsx            # Company info form
└── KnowledgeBaseUpload.tsx       # Document upload
```

### Dashboard Components

```
src/components/
├── OnboardingGuard.tsx           # Checks onboarding status
└── dashboard/
    ├── OnboardingDashboard.tsx   # Main dashboard
    └── AgentCard.tsx             # Individual agent display
```

### Utilities

```
src/lib/
├── configLoader.ts               # Loads config.yaml
└── agentConfig.ts                # Agent configuration logic
```

## Agent Configuration Flow

### Step 1: User Completes Assessment

Assessment saved with all answers:

```sql
INSERT INTO onboarding_assessments (
  user_id, q1_industry_type, q2_company_size, 
  q3_pain_points, q4_data_readiness, q5_ai_style
) VALUES (...)
```

### Step 2: Configure Agents (Edge Function)

Called from `KnowledgeBaseUpload.tsx`:

```typescript
await fetch(`${SUPABASE_URL}/functions/v1/configure-agents`, {
  method: "POST",
  body: JSON.stringify({
    company_id,
    q1_industry_type,
    q2_company_size,
    q3_pain_points,
    q5_ai_style
  })
})
```

### Step 3: Agent Configuration Logic

```javascript
// supabase/functions/configure-agents/index.ts

1. Get enabled agents from industryAgentMapping[industry]
2. Limit to companySizes[size].maxAgents
3. For each agent:
   - Check if first pain point maps to this agent
   - If yes: phase = 1, priority = 1
   - If no: phase = 2, priority = index + 2
   - Set ux_mode from q5_ai_style
4. Upsert into agent_configurations table
5. Create knowledge_bases for each agent
```

### Step 4: Create Knowledge Bases

Automatically creates a knowledge base for each agent:

```sql
INSERT INTO knowledge_bases (
  company_id, agent_id, name
) VALUES (...)
```

## Knowledge Base Integration

### Uploading Documents

1. User selects files in KnowledgeBaseUpload
2. Files uploaded to Supabase Storage (`knowledge-base` bucket)
3. Calls `ingest-documents` function:

```typescript
await fetch(`${SUPABASE_URL}/functions/v1/ingest-documents`, {
  method: "POST",
  body: JSON.stringify({
    knowledge_base_id,
    filename,
    file_type: "pdf" | "word" | "excel",
    file_url,  // Public URL from storage
    file_size
  })
})
```

4. Document record created with `status: "processing"`
5. Background job processes and generates embeddings
6. Status updated to "indexed" when complete

### Processing Pipeline (Placeholder)

Currently stubbed out in edge functions:

```typescript
// TODO: Implement actual document processing
// 1. Download from file_url
// 2. Extract text based on file_type
// 3. Split into chunks for embedding
// 4. Generate embeddings (OpenAI, Cohere, etc.)
// 5. Store in vector DB (Pinecone, Weaviate, etc.)
// 6. Update status to "indexed"
```

## Agent Interaction

### Querying an Agent

```typescript
const response = await queryAgent(
  company_id,
  agent_id,
  "chat",  // interaction_type
  { question: "What's our current inventory?" }
)
```

Calls `query-agent` edge function which:

1. Validates agent is configured for company
2. Retrieves knowledge base docs
3. Calls agent's AI model with RAG context
4. Records interaction in agent_interactions
5. Returns response to user

## Row-Level Security (RLS)

All tables have RLS enabled. Users can only see their own:

```sql
-- Example: Companies table RLS
CREATE POLICY companies_select ON public.companies
  FOR SELECT USING (auth.uid() = user_id);
```

Agents access company data via company_id:

```sql
-- Knowledge bases belong to company
CREATE POLICY knowledge_bases_select ON public.knowledge_bases
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );
```

## Configuration Modifications

### Add a New Agent

1. Add to `config.yaml` `agents` section
2. Add to `industryAgentMapping` for relevant industries
3. Optionally add to `painPointMapping`

Example - Adding a "Supply Chain" agent:

```yaml
# config.yaml
agents:
  - id: supply_chain
    name: Supply Chain Optimization
    description: Optimizes supplier selection and logistics
    icon: Truck
    enabledFor:
      industries: [manufacturing, trading, mixed]
      minSize: medium

industryAgentMapping:
  manufacturing: [..., supply_chain]
```

When users take assessment, "Supply Chain" automatically appears.

### Modify Agent Availability

Change which industries get an agent:

```yaml
enabledFor:
  industries: [manufacturing]  # Was: [manufacturing, trading, mixed]
```

All new onboarded users get updated configuration.

### Change Max Agents per Size

```yaml
companySizes:
  enterprise: { departments: "7+", maxAgents: 8 }  # Was: 6
```

## Testing the Flow

### 1. Test Onboarding Flow

1. Create test user account
2. Navigate to http://localhost:5173/onboarding/q1
3. Complete all 5 questions
4. Fill in company profile
5. Upload test documents
6. Verify agents appear in dashboard

### 2. Test Agent Configuration

1. Check Supabase > agent_configurations table
2. Verify:
   - Correct agents are enabled
   - Phase 1 agent is first pain point mapping
   - Phase 2 agents are others
   - UX mode matches Q5 answer

### 3. Test RLS Policies

1. Create second test user
2. Login as user 1, note company_id
3. Login as user 2
4. Verify user 2 cannot see user 1's agents

## Debugging

### Enable Console Logging

Edge functions log to Supabase Dashboard:

```
Supabase → Project → Functions → [function name] → Logs
```

Check for errors in document processing or agent configuration.

### Check Assessment Storage

```sql
SELECT * FROM onboarding_assessments 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

Verify all Q1-Q5 answers are saved.

### Check Agent Configuration

```sql
SELECT * FROM agent_configurations 
WHERE company_id = 'your-company-id'
ORDER BY priority;
```

Verify correct agents, phases, and ux_modes.

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Supabase functions deployed
- [ ] config.yaml in project root
- [ ] js-yaml installed
- [ ] Environment variables set
- [ ] RLS policies enabled on all tables
- [ ] Onboarding routes added to App.tsx
- [ ] OnboardingGuard wrapped around routes
- [ ] Storage bucket created for documents
- [ ] Test complete onboarding flow
- [ ] Verify agent configurations created
- [ ] Test returning user login

## Next Steps

1. **Implement document processing** - Add vector embedding pipeline
2. **Integrate AI models** - Connect agents to LLM endpoints
3. **Add chat interface** - Build real-time agent interaction UI
4. **Implement alerts** - Set up proactive notification system
5. **Analytics** - Track agent usage and effectiveness
6. **Admin panel** - Tool to manage agent configurations per company
