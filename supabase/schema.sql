-- AgentFi Database Schema
-- Complete database setup for AI trading agent platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean deployment)
DROP TABLE IF EXISTS trading_signals CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create custom types/enums
CREATE TYPE agent_strategy AS ENUM ('trend', 'momentum', 'mean-reversion');
CREATE TYPE agent_risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE agent_status AS ENUM ('created', 'active', 'paused', 'stopped');
CREATE TYPE signal_type AS ENUM ('BUY', 'SELL', 'HOLD');

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    total_agents INTEGER DEFAULT 0 NOT NULL,
    total_balance DECIMAL(20,8) DEFAULT 0 NOT NULL,
    total_pnl DECIMAL(20,8) DEFAULT 0 NOT NULL,
    preferred_risk_level agent_risk_level,
    notification_preferences JSONB DEFAULT '{
        "email_notifications": false,
        "push_notifications": true,
        "signal_alerts": true,
        "performance_reports": true
    }'::jsonb NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_wallet_address CHECK (length(wallet_address) = 42 AND wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT non_negative_agents CHECK (total_agents >= 0),
    CONSTRAINT non_negative_balance CHECK (total_balance >= 0)
);

-- Agents Table
CREATE TABLE agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    strategy agent_strategy NOT NULL,
    risk_level agent_risk_level NOT NULL,
    allocated_amount DECIMAL(20,8) NOT NULL,
    status agent_status DEFAULT 'created' NOT NULL,
    token_pairs TEXT[] DEFAULT ARRAY['MATIC/USDC', 'ETH/USDC'] NOT NULL,
    gas_settings JSONB DEFAULT '{
        "maxFeePerGas": "30",
        "maxPriorityFeePerGas": "2",
        "gasLimit": "300000"
    }'::jsonb NOT NULL,
    slippage_tolerance DECIMAL(5,2) DEFAULT 0.5 NOT NULL,
    current_balance DECIMAL(20,8) DEFAULT 0 NOT NULL,
    total_pnl DECIMAL(20,8) DEFAULT 0 NOT NULL,
    total_trades INTEGER DEFAULT 0 NOT NULL,
    win_rate DECIMAL(5,2) DEFAULT 0 NOT NULL,
    last_signal_at TIMESTAMP WITH TIME ZONE,
    config_hash TEXT, -- For smart contract integration
    
    -- Constraints
    CONSTRAINT valid_wallet_address CHECK (length(wallet_address) = 42 AND wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT non_empty_name CHECK (length(trim(name)) > 0),
    CONSTRAINT positive_allocated_amount CHECK (allocated_amount > 0),
    CONSTRAINT valid_slippage CHECK (slippage_tolerance >= 0.1 AND slippage_tolerance <= 10.0),
    CONSTRAINT non_negative_balance CHECK (current_balance >= 0),
    CONSTRAINT non_negative_trades CHECK (total_trades >= 0),
    CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100),
    CONSTRAINT non_empty_token_pairs CHECK (array_length(token_pairs, 1) > 0),
    
    -- Foreign key
    CONSTRAINT fk_wallet_address FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address) ON DELETE CASCADE
);

-- Trading Signals Table
CREATE TABLE trading_signals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    agent_id UUID NOT NULL,
    signal_type signal_type NOT NULL,
    token_pair TEXT NOT NULL,
    confidence_score INTEGER NOT NULL,
    reasoning TEXT NOT NULL,
    price_target DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    position_size DECIMAL(5,2) NOT NULL,
    executed BOOLEAN DEFAULT FALSE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_price DECIMAL(20,8),
    gas_used BIGINT,
    transaction_hash TEXT,
    ai_model_version TEXT DEFAULT 'mixtral-8x7b-32768',
    market_conditions JSONB,
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 100),
    CONSTRAINT non_empty_reasoning CHECK (length(trim(reasoning)) > 0),
    CONSTRAINT valid_position_size CHECK (position_size >= 0 AND position_size <= 100),
    CONSTRAINT positive_price_target CHECK (price_target IS NULL OR price_target > 0),
    CONSTRAINT positive_stop_loss CHECK (stop_loss IS NULL OR stop_loss > 0),
    CONSTRAINT positive_execution_price CHECK (execution_price IS NULL OR execution_price > 0),
    CONSTRAINT valid_gas_used CHECK (gas_used IS NULL OR gas_used > 0),
    CONSTRAINT execution_consistency CHECK (
        (executed = FALSE AND executed_at IS NULL AND execution_price IS NULL AND transaction_hash IS NULL) OR
        (executed = TRUE AND executed_at IS NOT NULL)
    ),
    
    -- Foreign key
    CONSTRAINT fk_agent_id FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Performance Analytics Table (for advanced metrics)
CREATE TABLE performance_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL,
    date DATE NOT NULL,
    daily_pnl DECIMAL(20,8) DEFAULT 0 NOT NULL,
    daily_volume DECIMAL(20,8) DEFAULT 0 NOT NULL,
    trades_count INTEGER DEFAULT 0 NOT NULL,
    successful_trades INTEGER DEFAULT 0 NOT NULL,
    max_drawdown DECIMAL(20,8) DEFAULT 0 NOT NULL,
    sharpe_ratio DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT non_negative_volume CHECK (daily_volume >= 0),
    CONSTRAINT non_negative_trades CHECK (trades_count >= 0),
    CONSTRAINT valid_successful_trades CHECK (successful_trades >= 0 AND successful_trades <= trades_count),
    CONSTRAINT non_negative_drawdown CHECK (max_drawdown >= 0),
    
    -- Unique constraint for agent per day
    CONSTRAINT unique_agent_date UNIQUE (agent_id, date),
    
    -- Foreign key
    CONSTRAINT fk_agent_id FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Agent Configuration History (for tracking changes)
CREATE TABLE agent_config_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    changed_by TEXT NOT NULL, -- wallet address
    field_name TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB NOT NULL,
    reason TEXT,
    
    -- Foreign key
    CONSTRAINT fk_agent_id FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX idx_agents_wallet_address ON agents(wallet_address);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_strategy ON agents(strategy);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);
CREATE INDEX idx_trading_signals_agent_id ON trading_signals(agent_id);
CREATE INDEX idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX idx_trading_signals_executed ON trading_signals(executed);
CREATE INDEX idx_trading_signals_signal_type ON trading_signals(signal_type);
CREATE INDEX idx_performance_analytics_agent_date ON performance_analytics(agent_id, date DESC);
CREATE INDEX idx_agent_config_history_agent_id ON agent_config_history(agent_id, changed_at DESC);

-- Create composite indexes for common queries
CREATE INDEX idx_agents_wallet_status ON agents(wallet_address, status);
CREATE INDEX idx_signals_agent_executed ON trading_signals(agent_id, executed, created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user profile statistics
CREATE OR REPLACE FUNCTION update_user_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user profile statistics when agent is modified
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE user_profiles SET
            total_agents = (
                SELECT COUNT(*) 
                FROM agents 
                WHERE wallet_address = NEW.wallet_address
            ),
            total_balance = (
                SELECT COALESCE(SUM(current_balance), 0) 
                FROM agents 
                WHERE wallet_address = NEW.wallet_address
            ),
            total_pnl = (
                SELECT COALESCE(SUM(total_pnl), 0) 
                FROM agents 
                WHERE wallet_address = NEW.wallet_address
            ),
            updated_at = NOW()
        WHERE wallet_address = NEW.wallet_address;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE user_profiles SET
            total_agents = (
                SELECT COUNT(*) 
                FROM agents 
                WHERE wallet_address = OLD.wallet_address
            ),
            total_balance = (
                SELECT COALESCE(SUM(current_balance), 0) 
                FROM agents 
                WHERE wallet_address = OLD.wallet_address
            ),
            total_pnl = (
                SELECT COALESCE(SUM(total_pnl), 0) 
                FROM agents 
                WHERE wallet_address = OLD.wallet_address
            ),
            updated_at = NOW()
        WHERE wallet_address = OLD.wallet_address;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for user profile stats
CREATE TRIGGER update_user_profile_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_user_profile_stats();

-- Function to track agent configuration changes
CREATE OR REPLACE FUNCTION track_agent_config_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track specific field changes
    IF TG_OP = 'UPDATE' THEN
        -- Track strategy changes
        IF OLD.strategy != NEW.strategy THEN
            INSERT INTO agent_config_history (agent_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, NEW.wallet_address, 'strategy', to_jsonb(OLD.strategy), to_jsonb(NEW.strategy));
        END IF;
        
        -- Track risk level changes
        IF OLD.risk_level != NEW.risk_level THEN
            INSERT INTO agent_config_history (agent_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, NEW.wallet_address, 'risk_level', to_jsonb(OLD.risk_level), to_jsonb(NEW.risk_level));
        END IF;
        
        -- Track status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO agent_config_history (agent_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, NEW.wallet_address, 'status', to_jsonb(OLD.status), to_jsonb(NEW.status));
        END IF;
        
        -- Track allocated amount changes
        IF OLD.allocated_amount != NEW.allocated_amount THEN
            INSERT INTO agent_config_history (agent_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, NEW.wallet_address, 'allocated_amount', to_jsonb(OLD.allocated_amount), to_jsonb(NEW.allocated_amount));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for config tracking
CREATE TRIGGER track_agent_config_changes_trigger
    AFTER UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION track_agent_config_changes();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_config_history ENABLE ROW LEVEL SECURITY;

-- Create development-friendly RLS policies
-- These allow all operations while keeping RLS enabled for development

-- RLS policies for user_profiles
CREATE POLICY "Allow all profile operations" ON user_profiles FOR ALL USING (true);

-- RLS policies for agents  
CREATE POLICY "Allow all agent operations" ON agents FOR ALL USING (true);

-- RLS policies for trading_signals
CREATE POLICY "Allow all signal operations" ON trading_signals FOR ALL USING (true);

-- RLS policies for performance_analytics
CREATE POLICY "Allow all analytics operations" ON performance_analytics FOR ALL USING (true);

-- RLS policies for agent_config_history
CREATE POLICY "Allow all history operations" ON agent_config_history FOR ALL USING (true);

-- Insert some sample supported token pairs (for reference)
CREATE TABLE IF NOT EXISTS supported_token_pairs (
    id SERIAL PRIMARY KEY,
    pair_name TEXT UNIQUE NOT NULL,
    token_in_address TEXT NOT NULL,
    token_out_address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO supported_token_pairs (pair_name, token_in_address, token_out_address) VALUES
('MATIC/USDC', '0x0000000000000000000000000000000000001010', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
('ETH/USDC', '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
('WBTC/USDC', '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
('LINK/USDC', '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
('AAVE/USDC', '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
('UNI/USDC', '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');

-- Create views for common queries
CREATE VIEW agent_performance_summary AS
SELECT 
    a.id,
    a.name,
    a.wallet_address,
    a.strategy,
    a.risk_level,
    a.status,
    a.allocated_amount,
    a.current_balance,
    a.total_pnl,
    a.total_trades,
    a.win_rate,
    a.created_at,
    a.last_signal_at,
    COUNT(ts.id) as total_signals,
    COUNT(CASE WHEN ts.executed = true THEN 1 END) as executed_signals,
    AVG(CASE WHEN ts.executed = true THEN ts.confidence_score END) as avg_confidence
FROM agents a
LEFT JOIN trading_signals ts ON a.id = ts.agent_id
GROUP BY a.id, a.name, a.wallet_address, a.strategy, a.risk_level, a.status, 
         a.allocated_amount, a.current_balance, a.total_pnl, a.total_trades, 
         a.win_rate, a.created_at, a.last_signal_at;

-- Create view for recent trading activity
CREATE VIEW recent_trading_activity AS
SELECT 
    ts.id,
    ts.created_at,
    ts.signal_type,
    ts.token_pair,
    ts.confidence_score,
    ts.executed,
    ts.execution_price,
    a.name as agent_name,
    a.wallet_address,
    a.strategy
FROM trading_signals ts
JOIN agents a ON ts.agent_id = a.id
ORDER BY ts.created_at DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'User wallet profiles with aggregated statistics';
COMMENT ON TABLE agents IS 'AI trading agents with configuration and performance data';
COMMENT ON TABLE trading_signals IS 'AI-generated trading signals with execution tracking';
COMMENT ON TABLE performance_analytics IS 'Daily performance metrics for detailed analytics';
COMMENT ON TABLE agent_config_history IS 'Audit trail for agent configuration changes';
COMMENT ON TABLE supported_token_pairs IS 'Supported trading pairs with contract addresses';

COMMENT ON COLUMN agents.config_hash IS 'Hash of agent configuration for smart contract integration';
COMMENT ON COLUMN trading_signals.ai_model_version IS 'Version of AI model used for signal generation';
COMMENT ON COLUMN trading_signals.market_conditions IS 'Market context data at time of signal generation';

-- Final success message
SELECT 'AgentFi database schema created successfully!' as status;