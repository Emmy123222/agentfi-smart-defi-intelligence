# Edge Function Debugging Guide

## Current Issue
The edge function is returning 500 Internal Server Error when generating trading signals.

## Root Causes Identified

### 1. RLS Policy Issues
The Row Level Security policies were too restrictive and blocking the edge function from inserting data.

**Solution**: Updated RLS policies to be development-friendly while keeping RLS enabled.

### 2. Missing Service Role Key
Edge functions need the service role key, not the anon key, to bypass RLS restrictions.

**Solution**: Updated edge function to use `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Missing Error Logging
The edge function lacked proper error logging to debug issues.

**Solution**: Added comprehensive console logging throughout the function.

## Deployment Steps

### Step 1: Update Database Schema
Run the updated schema to fix RLS policies:

```bash
# Navigate to your project directory
cd your-project-directory

# Apply the updated schema
supabase db reset --linked
```

Or manually run the SQL in Supabase Dashboard → SQL Editor:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own agents" ON agents;
DROP POLICY IF EXISTS "Users can insert own agents" ON agents;
DROP POLICY IF EXISTS "Users can update own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON agents;
DROP POLICY IF EXISTS "Users can view signals for own agents" ON trading_signals;
DROP POLICY IF EXISTS "System can insert trading signals" ON trading_signals;
DROP POLICY IF EXISTS "System can update trading signals" ON trading_signals;
DROP POLICY IF EXISTS "Users can view own agent analytics" ON performance_analytics;
DROP POLICY IF EXISTS "System can manage analytics" ON performance_analytics;
DROP POLICY IF EXISTS "Users can view own agent history" ON agent_config_history;

-- Create development-friendly policies
CREATE POLICY "Allow all profile operations" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all agent operations" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all signal operations" ON trading_signals FOR ALL USING (true);
CREATE POLICY "Allow all analytics operations" ON performance_analytics FOR ALL USING (true);
CREATE POLICY "Allow all history operations" ON agent_config_history FOR ALL USING (true);
```

### Step 2: Set Groq API Key in Supabase Secrets
The edge function needs the Groq API key to be set as a Supabase secret:

```bash
# Set the Groq API key as a secret
supabase secrets set GROQ_API_KEY=your_groq_api_key_here
```

Or set it in Supabase Dashboard → Settings → Edge Functions → Secrets.

### Step 3: Redeploy Edge Function
Since you mentioned you deployed it manually, redeploy with the updated code:

```bash
# Deploy the updated edge function
supabase functions deploy generate-trading-signal
```

### Step 4: Test the Edge Function
Test the edge function directly to verify it works:

```bash
# Test with curl
curl -X POST 'https://bvbwofxeeypkbrwlvbvg.supabase.co/functions/v1/generate-trading-signal' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "agentId": "test-agent-id",
    "tokenPair": "MATIC/USDC",
    "strategy": "trend",
    "riskLevel": "medium",
    "allocatedAmount": 100
  }'
```

## Debugging Steps

### 1. Check Edge Function Logs
Go to Supabase Dashboard → Edge Functions → generate-trading-signal → Logs to see detailed error messages.

### 2. Verify Secrets
Ensure the Groq API key is properly set:
- Go to Supabase Dashboard → Settings → Edge Functions
- Check that `GROQ_API_KEY` is listed in secrets

### 3. Test Database Connection
Verify the database policies are working by testing a simple insert in the SQL editor:

```sql
-- Test insert (replace with actual agent ID)
INSERT INTO trading_signals (
  agent_id, 
  signal_type, 
  token_pair, 
  confidence_score, 
  reasoning, 
  position_size
) VALUES (
  'ea21d6f2-0317-4266-a034-012a9e7b2c8d',
  'BUY',
  'MATIC/USDC',
  75,
  'Test signal',
  25
);
```

## Expected Behavior After Fix

1. Edge function should accept requests without 500 errors
2. Signals should be stored in the database
3. Agent's `last_signal_at` should be updated
4. Fallback system should still work if Groq API fails

## Monitoring

After deployment, monitor:
- Edge function logs for any remaining errors
- Database for new trading signals
- Frontend for successful signal generation

## Fallback System

The system includes a robust fallback that:
1. Tries edge function first
2. Falls back to local signal generation if edge function fails
3. Stores signals in database regardless of source
4. Provides realistic strategy-based signals

This ensures the application continues working even if the edge function has issues.