-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wallet_address TEXT UNIQUE NOT NULL,
    total_agents INTEGER DEFAULT 0,
    total_balance DECIMAL(20,8) DEFAULT 0,
    total_pnl DECIMAL(20,8) DEFAULT 0,
    preferred_risk_level TEXT CHECK (preferred_risk_level IN ('low', 'medium', 'high')),
    notification_preferences JSONB DEFAULT '{}'::jsonb
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK (strategy IN ('trend', 'momentum', 'mean-reversion')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    allocated_amount DECIMAL(20,8) NOT NULL,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'active', 'paused', 'stopped')),
    token_pairs TEXT[] DEFAULT ARRAY['MATIC/USDC', 'ETH/USDC'],
    gas_settings JSONB DEFAULT '{"maxFeePerGas": "30", "maxPriorityFeePerGas": "2"}'::jsonb,
    slippage_tolerance DECIMAL(5,2) DEFAULT 0.5,
    current_balance DECIMAL(20,8) DEFAULT 0,
    total_pnl DECIMAL(20,8) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    last_signal_at TIMESTAMP WITH TIME ZONE
);

-- Create trading signals table
CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
    token_pair TEXT NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    reasoning TEXT NOT NULL,
    price_target DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    position_size DECIMAL(5,2) NOT NULL,
    executed BOOLEAN DEFAULT FALSE,
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_price DECIMAL(20,8),
    gas_used BIGINT,
    transaction_hash TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_wallet_address ON agents(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_agent_id ON trading_signals(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- For now, allow all operations on agents and trading_signals
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on trading_signals" ON trading_signals FOR ALL USING (true);