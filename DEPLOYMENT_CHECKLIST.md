# UDYAMI AI - Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment

- [ ] All code committed to git
- [ ] No console.log debug statements remaining
- [ ] Environment variables documented
- [ ] Team has read IMPLEMENTATION.md

## Database Setup

- [ ] Supabase project created
- [ ] Run migration: `supabase db push`
- [ ] Verify tables created:
  ```bash
  supabase db list
  ```
  Should show:
  - companies
  - onboarding_assessments
  - knowledge_bases
  - knowledge_base_documents
  - excel_data_sources
  - agent_configurations
  - agent_interactions

- [ ] Verify RLS policies enabled on all tables
- [ ] Create storage bucket:
  ```
  Supabase Dashboard → Storage → New Bucket
  Name: knowledge-base
  Privacy: Private
  ```

## Dependencies

- [ ] Run `npm install`
- [ ] Verify js-yaml installed:
  ```bash
  npm ls js-yaml
  ```

## Environment Variables

- [ ] Set in `.env`:
  ```
  VITE_SUPABASE_URL=https://[project-id].supabase.co
  VITE_SUPABASE_ANON_KEY=[your-anon-key]
  ```

- [ ] Verify variables loaded:
  ```bash
  echo $VITE_SUPABASE_URL
  ```

## Supabase Functions

Deploy in this order:

```bash
# 1. Agent configuration
supabase functions deploy configure-agents

# 2. Document processing
supabase functions deploy ingest-documents

# 3. Excel processing
supabase functions deploy ingest-excel

# 4. Agent queries
supabase functions deploy query-agent
```

- [ ] All 4 functions deployed
- [ ] No deployment errors
- [ ] Functions visible in Supabase Dashboard

## Build

- [ ] Run development build:
  ```bash
  npm run build
  ```

- [ ] No TypeScript errors
- [ ] No build warnings
- [ ] Output size reasonable

## Testing - Onboarding Flow

- [ ] Create test user account
- [ ] Navigate to `/onboarding/q1`
- [ ] Complete Q1 - Industry selection
  - [ ] Can select all 4 industries
  - [ ] Next button enables after selection
  - [ ] Data persists if navigate back

- [ ] Complete Q2 - Company Size
  - [ ] Can select all 4 sizes
  - [ ] Progress bar shows 2/5

- [ ] Complete Q3 - Pain Points
  - [ ] Can select max 2 pain points
  - [ ] Selection count displays
  - [ ] Cannot exceed 2 selections

- [ ] Complete Q4 - Data Readiness
  - [ ] Can select multiple documents
  - [ ] "low_readiness" disables others
  - [ ] Badges show capabilities

- [ ] Complete Q5 - AI Style
  - [ ] Can select all 4 styles
  - [ ] Submit button shows "Saving..."
  - [ ] No console errors during submission

- [ ] Assessment saved to database:
  ```sql
  SELECT * FROM onboarding_assessments
  WHERE user_id = '[test-user-id]'
  ORDER BY created_at DESC LIMIT 1;
  ```

## Testing - Company Profile

- [ ] Redirected to company profile after Q5
- [ ] Form fields work (name, email, phone, location, GST)
- [ ] Validation works:
  - [ ] Name required
  - [ ] Email required and validated
  - [ ] Phone/location/GST optional

- [ ] Company saved to database:
  ```sql
  SELECT * FROM companies
  WHERE user_id = '[test-user-id]'
  ORDER BY created_at DESC LIMIT 1;
  ```

## Testing - Knowledge Base Upload

- [ ] Redirected to knowledge base upload
- [ ] Can upload PDF files
- [ ] Can upload Word documents
- [ ] Can upload Excel files
- [ ] File status shows "uploading"
- [ ] "Go to Dashboard" button works
- [ ] Can see dashboard without uploading

## Testing - Agent Configuration

- [ ] After knowledge base step, agents configured
- [ ] Check database:
  ```sql
  SELECT agent_id, phase, enabled, ux_mode
  FROM agent_configurations
  WHERE company_id = '[test-company-id]'
  ORDER BY phase, priority;
  ```

- [ ] Should see:
  - Phase 1 agent matches pain point
  - Phase 2+ agents for enabled industry
  - Count ≤ companySizes[size].maxAgents
  - ux_mode matches Q5 answer

## Testing - Dashboard

- [ ] Onboarding dashboard loads
- [ ] Shows assessment summary:
  - [ ] Industry displayed
  - [ ] Company size displayed
  - [ ] Pain points displayed
  - [ ] UX style displayed

- [ ] Phase 1 agents displayed
- [ ] Phase 2 agents displayed
- [ ] Agent cards show:
  - [ ] Agent name and icon
  - [ ] Description
  - [ ] Phase badge
  - [ ] "Interact" button

- [ ] Quick links work:
  - [ ] "Upload Docs" button
  - [ ] "Settings" button
  - [ ] "Retake Assessment" button

## Testing - Returning Users

- [ ] Logout and login again
- [ ] Automatic redirect to dashboard (not Q1)
- [ ] All previous data restored:
  - [ ] Company info visible
  - [ ] Same agents configured
  - [ ] Assessment summary correct

## Testing - Multi-Tenant Isolation

- [ ] Create 2nd test user
- [ ] Login as user 2
- [ ] Complete onboarding with different answers
- [ ] Verify user 2 cannot see user 1's data:
  ```sql
  -- As user 1
  SELECT COUNT(*) FROM agent_configurations;
  -- Should be ~3
  
  -- As user 2
  SELECT COUNT(*) FROM agent_configurations;
  -- Should be different (based on their answers)
  ```

## Testing - Error Handling

- [ ] Network disconnected during submission
  - [ ] Error toast appears
  - [ ] Can retry
  - [ ] No duplicate submissions

- [ ] Invalid file upload
  - [ ] Error message shown
  - [ ] Can try different file

- [ ] Supabase down
  - [ ] Graceful error handling
  - [ ] No blank screens

## Performance

- [ ] First pageload < 3 seconds
- [ ] Assessment flow smooth (no lag)
- [ ] Dashboard loads < 2 seconds
- [ ] No memory leaks in DevTools

## Security

- [ ] RLS policies enforced:
  - [ ] User can only see own company
  - [ ] User can only see own assessments
  - [ ] No cross-company access

- [ ] Passwords never logged
- [ ] API keys not exposed in frontend code
- [ ] No hardcoded secrets

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## Documentation

- [ ] README.md updated with new features
- [ ] CONFIG.md reviewed
- [ ] IMPLEMENTATION.md reviewed
- [ ] ARCHITECTURE.md reviewed
- [ ] Comments in code for complex logic

## Final Checks

- [ ] All team members can complete onboarding
- [ ] No console errors in browser DevTools
- [ ] No TypeScript errors
- [ ] All routes accessible
- [ ] Database backups configured
- [ ] Error logging configured (Sentry, etc.)
- [ ] Analytics configured

## Deployment

- [ ] Push to main branch
- [ ] GitHub Actions pass
- [ ] Deploy to staging
- [ ] Test in staging environment
- [ ] Get approval from team lead
- [ ] Deploy to production
- [ ] Monitor error logs for 1 hour
- [ ] Smoke test in production

## Post-Deployment

- [ ] Monitor error logs
- [ ] Check agent_configurations created correctly
- [ ] Monitor database performance
- [ ] Gather early user feedback
- [ ] Document any issues found

## Rollback Plan

If critical issues found:

1. Revert to previous commit:
   ```bash
   git revert [commit-hash]
   ```

2. Database rollback:
   ```bash
   supabase db reset
   supabase db push  # previous migration
   ```

3. Notify users via status page

## Sign-Off

- [ ] QA Lead: _________________________ Date: _______
- [ ] DevOps Lead: _________________________ Date: _______
- [ ] Product Manager: _________________________ Date: _______
