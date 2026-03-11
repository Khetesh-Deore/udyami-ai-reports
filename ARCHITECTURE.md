# UDYAMI AI - System Architecture

## Overview

UDYAMI AI is a multi-agent platform that provides specialized AI agents for different business operations (manufacturing, trading, services). The system uses a config-driven approach to match companies with agents based on their industry, size, and needs.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                                                             │
│  Onboarding Flow (Q1-Q5)                                   │
│  ├─ Q1: Industry Selection                                 │
│  ├─ Q2: Company Size                                       │
│  ├─ Q3: Pain Points                                        │
│  ├─ Q4: Data Readiness                                     │
│  └─ Q5: UX Mode Selection                                  │
│                                                             │
│  Dashboard                                                  │
│  ├─ Agent Discovery                                        │
│  ├─ Agent Interaction                                      │
│  └─ Knowledge Base Management                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │  config.yaml (Configuration)     │
        │  ├─ Agent Definitions            │
        │  ├─ Industry Mappings            │
        │  ├─ Company Size Limits          │
        │  ├─ Pain Point Prioritization    │
        │  └─ UX Modes                     │
        └──────────┬───────────────────────┘
                   │
        ┌──────────↓───────────────────────┐
        │  Supabase (Backend)              │
        │                                  │
        │  Tables:                         │
        │  ├─ auth.users (Auth)            │
        │  ├─ companies                    │
        │  ├─ onboarding_assessments       │
        │  ├─ agent_configurations         │
        │  ├─ knowledge_bases              │
        │  ├─ knowledge_base_documents     │
        │  ├─ excel_data_sources           │
        │  └─ agent_interactions           │
        │                                  │
        │  Edge Functions:                 │
        │  ├─ configure-agents             │
        │  ├─ ingest-documents             │
        │  ├─ ingest-excel                 │
        │  └─ query-agent                  │
        │                                  │
        │  Storage:                        │
        │  └─ knowledge-base bucket        │
        └──────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │  External Services (Placeholder) │
        │  ├─ Document Processing          │
        │  ├─ Vector Embeddings            │
        │  ├─ Vector Database              │
        │  ├─ LLM API (e.g., OpenAI)       │
        │  └─ Notification Service         │
        └──────────────────────────────────┘
```

## Core Concepts

### 1. Config-Driven Design

The entire system is driven by `config.yaml`:

**Flow:**
```
config.yaml defines agents
    ↓
User assessment (Q1-Q5) answers
    ↓
Edge function reads config
    ↓
Determines enabled agents
    ↓
Creates agent_configurations
    ↓
Dashboard displays agents
```

**Benefits:**
- Add agents without code changes
- Change availability rules instantly
- Multi-tenant ready (each company can have different config)
- Version control of agent definitions

### 2. Multi-Tenant Isolation

Each company is isolated using company_id:

```
┌─ User 1 (Manu. Co.) → Company 1
│                       ├─ Agents: scheduling, qa, inventory
│                       └─ Knowledge Base: 5 documents
│
└─ User 2 (Retail Co.) → Company 2
                         ├─ Agents: inventory, sales
                         └─ Knowledge Base: 2 documents
```

**Implemented via:**
- `companies.user_id` - Links company to authenticated user
- RLS policies on all tables - Filter by company_id
- agent_configurations.company_id - Company-specific agent setup
- knowledge_bases.company_id - Separate knowledge bases per company

### 3. Phased Agent Rollout

Agents are released in phases to manage complexity:

```
Phase 1: Priority Agent (from top pain point)
├─ Fully enabled
├─ Production ready
└─ Focus of pilot

Phase 2: Additional Agents (other enabled agents)
├─ Available but not primary
├─ Expanded capabilities
└─ Gradual adoption
```

## Data Model

### Companies

```sql
companies
├─ id (UUID)
├─ user_id (FK: auth.users)
├─ name (TEXT)
├─ email (TEXT)
├─ phone (TEXT)
├─ location (TEXT)
├─ gst_number (TEXT)
└─ created_at / updated_at
```

**RLS:** Users can only see their own company.

### Onboarding Assessments

```sql
onboarding_assessments
├─ id (UUID)
├─ company_id (FK: companies)
├─ user_id (FK: auth.users)
├─ q1_industry_type (VARCHAR)
│  ├─ manufacturing
│  ├─ trading
│  ├─ services
│  └─ mixed
├─ q2_company_size (VARCHAR)
│  ├─ small (1-2 depts)
│  ├─ medium (3-4 depts)
│  ├─ large (5-6 depts)
│  └─ enterprise (7+ depts)
├─ q3_pain_points (TEXT[])
│  ├─ downtime
│  ├─ quality
│  ├─ inventory
│  ├─ dispatch
│  ├─ rd
│  └─ reporting
├─ q4_data_readiness (TEXT[])
│  ├─ has_sops
│  ├─ has_quality_docs
│  ├─ has_machine_docs
│  ├─ has_excel_data
│  └─ low_readiness
├─ q5_ai_style (VARCHAR)
│  ├─ chat
│  ├─ file_upload
│  ├─ alerts
│  └─ hybrid
├─ completed_at (TIMESTAMPTZ)
├─ is_locked (BOOLEAN)
└─ created_at
```

**Batch Operations:**
- All answers collected in frontend state
- Single INSERT after Q5 completion
- No intermediate database writes during assessment

### Agent Configurations

```sql
agent_configurations
├─ id (UUID)
├─ company_id (FK: companies)
├─ agent_id (VARCHAR)
├─ enabled (BOOLEAN)
├─ shadow_mode (BOOLEAN)
├─ ux_mode (VARCHAR)
│  ├─ chat
│  ├─ file_upload
│  ├─ alerts
│  └─ hybrid
├─ phase (INTEGER)
│  ├─ 1 = Priority agent
│  └─ 2+ = Additional agents
├─ priority (INTEGER) [1-100]
├─ config_data (JSONB)
└─ created_at / updated_at

-- Unique constraint: (company_id, agent_id)
```

**Usage:**
```sql
-- Get enabled agents for dashboard
SELECT * FROM agent_configurations
WHERE company_id = '...' AND enabled = true
ORDER BY phase, priority

-- Check if agent can be accessed
SELECT * FROM agent_configurations
WHERE company_id = '...' AND agent_id = 'qa' AND enabled = true
```

### Knowledge Bases

```sql
knowledge_bases
├─ id (UUID)
├─ company_id (FK: companies)
├─ agent_id (VARCHAR)
├─ name (TEXT)
├─ description (TEXT)
├─ vector_store_id (TEXT) -- For embedding storage
└─ created_at / updated_at
```

**One per agent:** Each enabled agent gets its own knowledge base.

### Knowledge Base Documents

```sql
knowledge_base_documents
├─ id (UUID)
├─ knowledge_base_id (FK: knowledge_bases)
├─ company_id (FK: companies)
├─ filename (TEXT)
├─ file_type (ENUM: pdf, word, excel)
├─ file_url (TEXT) -- Public storage URL
├─ file_size (INTEGER)
├─ content_hash (TEXT) -- Deduplication
├─ chunks_count (INTEGER) -- For embeddings
├─ status (ENUM: pending, processing, indexed, failed)
├─ metadata (JSONB)
│  └─ sheets: ["Sales", "Production"]
│     extracted_at: "2026-03-12T10:30:00Z"
│     content_preview: "..."
└─ created_at / updated_at
```

**Statuses:**
- pending: Uploaded, awaiting processing
- processing: Document being parsed/embedded
- indexed: Ready for RAG queries
- failed: Processing error

### Agent Interactions

```sql
agent_interactions
├─ id (UUID)
├─ company_id (FK: companies)
├─ agent_id (VARCHAR)
├─ user_id (FK: auth.users)
├─ interaction_type (ENUM: chat, file_upload, alert)
├─ input_data (JSONB)
│  └─ question: "What's current inventory?"
├─ output_data (JSONB)
│  └─ text: "..."
│     confidence: 0.92
│     sources: [doc1, doc2]
├─ metadata (JSONB)
│  └─ knowledge_base_id: "..."
│     documents_used: 3
└─ created_at
```

**For audit trail and analytics.**

## Request-Response Flows

### Onboarding Flow

```
1. User completes Q5
   └─ Frontend submits to POST /onboarding_assessments
      ├─ Insert assessment record
      └─ Return assessment_id

2. User fills company profile
   └─ POST /companies
      ├─ Insert company record
      └─ Return company_id

3. User uploads documents (optional)
   └─ POST /storage/knowledge-base
      ├─ Upload to Supabase Storage
      └─ Get public_url

4. User clicks "Go to Dashboard"
   └─ POST /functions/configure-agents
      ├─ Read config.yaml
      ├─ Determine enabled agents
      ├─ Upsert agent_configurations
      ├─ Create knowledge_bases
      └─ Return configured_agents

5. Redirect to dashboard
   └─ GET /agent_configurations?company_id=X
      └─ Render enabled agents
```

### Agent Query Flow

```
1. User interacts with agent
   └─ queryAgent(company_id, agent_id, input)
      ├─ Check agent_configurations (enabled?)
      ├─ Call POST /functions/query-agent
      │  ├─ Fetch knowledge_bases
      │  ├─ Query embeddings (vector DB)
      │  ├─ Call LLM with RAG context
      │  ├─ Insert agent_interactions
      │  └─ Return response
      └─ Update UI with response
```

## Edge Functions

### configure-agents

**Trigger:** User completes onboarding

**Input:**
```json
{
  "company_id": "uuid",
  "q1_industry_type": "manufacturing",
  "q2_company_size": "large",
  "q3_pain_points": ["downtime", "quality"],
  "q5_ai_style": "hybrid"
}
```

**Logic:**
1. Read industryAgentMapping[industry] from config
2. Slice to companySizes[size].maxAgents
3. For each agent:
   - phase = (agent == painPoint[0].agent) ? 1 : 2
   - priority = phase * 10 + index
4. Upsert agent_configurations
5. Create knowledge_bases

**Output:**
```json
{
  "configured_agents": ["scheduling", "qa", "inventory"],
  "priority_agent": "scheduling"
}
```

### ingest-documents

**Trigger:** User uploads PDF/Word document

**Input:**
```json
{
  "knowledge_base_id": "uuid",
  "filename": "SOP.pdf",
  "file_type": "pdf",
  "file_url": "...",
  "file_size": 1024000
}
```

**Logic:**
1. Create knowledge_base_documents record (status: processing)
2. Background job:
   - Download document
   - Extract text
   - Split into chunks
   - Generate embeddings
   - Store in vector DB
   - Update status: indexed

**Output:**
```json
{
  "document_id": "uuid",
  "status": "processing"
}
```

### ingest-excel

**Trigger:** User uploads Excel/CSV file

**Input:**
```json
{
  "company_id": "uuid",
  "filename": "production.xlsx",
  "file_url": "...",
  "sheet_names": ["Sales", "Production"]
}
```

**Logic:**
1. Create excel_data_sources record
2. Background job:
   - Download Excel
   - Parse sheets
   - Convert to structured JSON
   - Store in parsed_data
   - Index for agent queries

**Output:**
```json
{
  "excel_id": "uuid",
  "status": "processing"
}
```

### query-agent

**Trigger:** User interacts with agent

**Input:**
```json
{
  "company_id": "uuid",
  "agent_id": "qa",
  "interaction_type": "chat",
  "input_data": {"question": "..."}
}
```

**Logic:**
1. Validate agent_configurations (enabled, not shadow_mode)
2. Fetch knowledge_base docs
3. Retrieve relevant embeddings
4. Call LLM with RAG context
5. Record in agent_interactions
6. Return response

**Output:**
```json
{
  "response": {
    "text": "...",
    "confidence": 0.92,
    "sources": ["doc1.pdf"]
  }
}
```

## Security

### Authentication

- Supabase Auth handles user authentication
- JWT token in Authorization header
- Frontend sends token in API calls

### Authorization

- Row-Level Security (RLS) policies on all tables
- Users can only access their own company data
- Service key used by edge functions for elevated access

### Data Protection

- All company data belongs to user_id
- No cross-company data access
- Files stored in private bucket

## Scalability Considerations

### Current Limits

- Single company per user (can extend to multi-company)
- Document processing done serially (can parallelize)
- Vector DB not specified (choose based on scale)

### Scaling Path

1. **Multiple companies per user:** Add company_users junction table
2. **Batch processing:** Use job queue (Bull, Inngest, Temporal)
3. **Caching:** Redis for config, agent lists
4. **Search:** Elasticsearch for document search
5. **Real-time:** WebSockets for agent updates
6. **Analytics:** Timescale for interaction metrics

## Future Enhancements

1. **Admin Panel:** Manage agent configs per company
2. **Custom Agents:** Allow customers to create custom agents
3. **Workflows:** Chain agents together for complex tasks
4. **Alerts:** Proactive notifications when conditions met
5. **API:** REST/GraphQL API for external integrations
6. **Marketplace:** Share knowledge bases between companies
7. **Analytics:** Usage metrics and agent effectiveness
8. **Feedback Loop:** Train models on agent interactions
