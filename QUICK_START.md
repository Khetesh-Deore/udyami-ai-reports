# UDYAMI AI - Quick Start Guide

Get the onboarding system running in 5 minutes.

## Prerequisites

- Node.js 16+
- Supabase account (https://supabase.com)
- Git

## 1. Clone & Install (1 min)

```bash
# Navigate to project
cd /vercel/share/v0-project

# Install dependencies
npm install
```

## 2. Setup Supabase (2 min)

### Create Project
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details
4. Note your `Project URL` and `Anon Key`

### Apply Migrations
```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref <your-project-id>

# Run migration
supabase db push
```

### Create Storage Bucket
1. Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `knowledge-base`
4. Privacy: Private

## 3. Environment Variables (1 min)

Create `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from Supabase Dashboard → Settings → API.

## 4. Deploy Functions (1 min)

```bash
supabase functions deploy configure-agents
supabase functions deploy ingest-documents
supabase functions deploy ingest-excel
supabase functions deploy query-agent
```

## 5. Start Development (0 min)

```bash
npm run dev
```

Open http://localhost:5173

## Test the Flow

1. **Sign Up**
   - Click signup/login
   - Create test account

2. **Complete Onboarding**
   - Navigate to /onboarding/q1
   - Answer all 5 questions
   - Fill company profile
   - (Skip knowledge base or upload test file)

3. **See Dashboard**
   - View enabled agents
   - See assessment summary

## Key Files

| File | Purpose |
|------|---------|
| `config.yaml` | Agent definitions and mappings |
| `src/pages/onboarding/*` | Q1-Q5 assessment pages |
| `supabase/migrations/*.sql` | Database schema |
| `supabase/functions/*` | Backend logic |
| `src/components/dashboard/*` | Agent discovery UI |

## Common Tasks

### Add a New Agent

1. Edit `config.yaml`:
```yaml
agents:
  - id: myagent
    name: My Agent
    description: Does something
    icon: Icon
    enabledFor:
      industries: [manufacturing]
      minSize: small
```

2. Add to industry mappings:
```yaml
industryAgentMapping:
  manufacturing: [..., myagent]
```

3. Deploy (no code changes needed!)

### Check if Assessment Saved

```sql
-- Supabase SQL Editor
SELECT * FROM onboarding_assessments
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

### See Configured Agents

```sql
SELECT agent_id, phase, enabled, ux_mode
FROM agent_configurations
WHERE company_id = 'your-company-id'
ORDER BY phase, priority;
```

### Reset a User's Onboarding

```sql
DELETE FROM onboarding_assessments 
WHERE user_id = 'your-user-id';

DELETE FROM companies 
WHERE user_id = 'your-user-id';
```

User will restart onboarding on next login.

## Troubleshooting

### "config.yaml not found"
```bash
# Ensure file exists in project root
ls config.yaml
```

### "VITE_SUPABASE_URL undefined"
```bash
# Restart dev server after editing .env
npm run dev
```

### "RLS policy violation"
```bash
# Check RLS is enabled
SELECT tablename, (SELECT array_agg(policyname) 
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename = t.tablename
) FROM pg_tables t 
WHERE schemaname = 'public';
```

### Functions not deploying
```bash
# Check Supabase CLI logged in
supabase projects list

# Re-authenticate if needed
supabase logout
supabase login
```

### Database migration fails
```bash
# Check migration syntax
supabase db push --dry-run

# View detailed error
supabase db push --verbose
```

## Next: Build Ahead

After getting comfortable with the flow:

1. **Add Chat Interface**
   - Build agent chat UI
   - Integrate LLM endpoints

2. **Process Documents**
   - Implement vector embeddings
   - Connect to embedding service

3. **Admin Panel**
   - Manage configurations
   - View analytics

4. **API**
   - REST endpoints
   - GraphQL queries

See `IMPLEMENTATION.md` for detailed next steps.

## Need Help?

- **Setup Issues:** Check `IMPLEMENTATION.md`
- **Architecture Questions:** Read `ARCHITECTURE.md`
- **Config Customization:** See `CONFIG.md`
- **Deployment:** Use `DEPLOYMENT_CHECKLIST.md`
- **Full Summary:** Read `ONBOARDING_SUMMARY.md`

## Project Structure

```
project/
├── config.yaml                    ← Agent definitions
├── src/
│   ├── pages/onboarding/         ← Q1-Q5 pages
│   ├── components/
│   │   ├── OnboardingGuard.tsx   ← Navigation guard
│   │   └── dashboard/            ← Dashboard UI
│   └── lib/
│       ├── configLoader.ts       ← Config parsing
│       └── agentConfig.ts        ← Agent utilities
└── supabase/
    ├── migrations/               ← Database schema
    └── functions/                ← Edge functions
```

## What Happens When User Signs Up

```
Sign Up → OnboardingGuard checks status
         → No assessment found → Redirect to Q1
         → User answers Q1-Q5 → Save to DB
         → User fills company info → Save to DB
         → Configure agents → Create agent_configurations
         → Show dashboard → User sees enabled agents
```

## Production Checklist

Before deploying:

```bash
# 1. Build check
npm run build

# 2. Check env vars
echo "URL: $VITE_SUPABASE_URL"
echo "KEY: $VITE_SUPABASE_ANON_KEY"

# 3. Run migrations
supabase db push

# 4. Deploy functions
supabase functions deploy configure-agents
supabase functions deploy ingest-documents
supabase functions deploy ingest-excel
supabase functions deploy query-agent

# 5. Start
npm run dev

# 6. Test complete flow
# Sign up → Onboard → See dashboard
```

See `DEPLOYMENT_CHECKLIST.md` for full checklist.

---

**That's it!** You're ready to start developing the UDYAMI AI onboarding system.

For questions or issues, refer to the documentation files or check the GitHub issues.
