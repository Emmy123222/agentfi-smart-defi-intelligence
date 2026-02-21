# AgentFi Supabase Setup Guide

## 🚀 New Supabase Project Setup

### Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Set project details:
   - **Name**: `agentfi-platform`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

### Step 2: Get Project Credentials

After project creation, go to **Settings > API**:

1. **Project URL**: `https://your-project-id.supabase.co`
2. **Project ID**: `your-project-id` 
3. **Anon Key**: `eyJ...` (public key)
4. **Service Role Key**: `eyJ...` (secret key - keep secure)

### Step 3: Update Environment Variables

Update your `.env` file with the new credentials:

```env
VITE_SUPABASE_PROJECT_ID="your_new_project_id"
VITE_SUPABASE_URL="https://your_new_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_new_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
VITE_GROQ_API_KEY="your_groq_api_key_here"
```

### Step 4: Deploy Database Schema

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire content from `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your_project_id

# Run the schema
supabase db reset
```

### Step 5: Verify Database Setup

After running the schema, verify these tables exist:

- ✅ `user_profiles` - User wallet profiles
- ✅ `agents` - AI trading agents
- ✅ `trading_signals` - AI-generated signals
- ✅ `performance_analytics` - Performance metrics
- ✅ `agent_config_history` - Configuration audit trail
- ✅ `supported_token_pairs` - Trading pair definitions

### Step 6: Configure Row Level Security (RLS)

The schema automatically enables RLS with these policies:

- **Users can only access their own data**
- **System functions can manage signals and analytics**
- **Audit trail for all configuration changes**

### Step 7: Deploy Edge Functions

Deploy the AI signal generation function:

```bash
# Deploy the edge function
supabase functions deploy generate-trading-signal

# Set environment variables for the function
supabase secrets set GROQ_API_KEY=your_groq_api_key_here
```

### Step 8: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Connect your wallet and try creating an agent

3. Verify data appears in Supabase dashboard under **Table Editor**

## 📊 Database Schema Overview

### Core Tables

#### `user_profiles`
- Stores wallet addresses and aggregated user statistics
- Automatically updated via triggers when agents change

#### `agents`
- Main agent configuration and performance data
- Supports all strategy types and risk levels
- Tracks real-time balance and P&L

#### `trading_signals`
- AI-generated trading signals with full metadata
- Execution tracking and performance analysis
- Links to specific agents and strategies

#### `performance_analytics`
- Daily performance metrics for advanced analytics
- Sharpe ratio, drawdown, and other financial metrics
- Supports historical performance tracking

#### `agent_config_history`
- Complete audit trail of agent changes
- Tracks who changed what and when
- Essential for compliance and debugging

### Advanced Features

#### Automatic Triggers
- **User stats updates**: Automatically recalculates user totals
- **Configuration tracking**: Logs all agent changes
- **Timestamp management**: Auto-updates `updated_at` fields

#### Performance Indexes
- Optimized for wallet-based queries
- Fast signal retrieval and filtering
- Efficient analytics calculations

#### Data Validation
- Wallet address format validation
- Positive amount constraints
- Logical consistency checks

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- System functions have controlled access
- No cross-user data leakage

### Data Validation
- Input sanitization at database level
- Type safety with custom enums
- Constraint validation for all fields

### Audit Trail
- Complete history of all changes
- Immutable configuration tracking
- Compliance-ready logging

## 🛠️ Maintenance

### Regular Tasks

1. **Monitor Performance**
   ```sql
   -- Check query performance
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

2. **Backup Data**
   ```bash
   # Automatic backups are enabled by default
   # Manual backup via Supabase dashboard: Settings > Database > Backups
   ```

3. **Update Statistics**
   ```sql
   -- Refresh table statistics
   ANALYZE user_profiles, agents, trading_signals;
   ```

### Scaling Considerations

- **Free Tier**: Up to 500MB database, 2GB bandwidth
- **Pro Tier**: Unlimited database, 8GB bandwidth
- **Team Tier**: Advanced features, priority support

## 🚨 Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Ensure JWT contains wallet_address claim
   - Check policy conditions match your auth setup

2. **Function Deployment Fails**
   - Verify Supabase CLI is logged in
   - Check function syntax and dependencies

3. **Schema Migration Errors**
   - Run schema in smaller chunks if needed
   - Check for existing table conflicts

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

**Setup Complete!** Your AgentFi platform is now ready with a production-grade database schema.