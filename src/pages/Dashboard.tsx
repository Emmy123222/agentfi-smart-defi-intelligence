import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { SystemStatus } from '@/components/SystemStatus';
import { TradeQueue } from '@/components/trading/TradeQueue';
import { AgentService } from '@/services/agentService';
import { SignalService } from '@/services/signalService';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  DollarSign, 
  Activity,
  Settings,
  Play,
  Pause,
  Eye,
  RefreshCw
} from 'lucide-react';

type Agent = Database['public']['Tables']['agents']['Row'];

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadAgents();
    }
  }, [isConnected, address]);

  const loadAgents = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const userAgents = await AgentService.getAgentsByWallet(address);
      setAgents(userAgents);
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAgents();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleAgentStatusChange = async (agentId: string, newStatus: Agent['status']) => {
    try {
      await AgentService.updateAgentStatus(agentId, newStatus);
      await loadAgents(); // Refresh the list
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      console.error('Failed to update agent status:', error);
      toast.error('Failed to update agent status');
    }
  };

  // Calculate totals from real data
  const totalBalance = agents.reduce((sum, agent) => sum + agent.current_balance, 0);
  const totalPnL = agents.reduce((sum, agent) => sum + agent.total_pnl, 0);
  const totalPnLPercent = totalBalance > 0 ? (totalPnL / (totalBalance - totalPnL)) * 100 : 0;
  const totalTrades = agents.reduce((sum, agent) => sum + agent.total_trades, 0);
  const activeAgents = agents.filter(a => a.status === 'active').length;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">Connect your wallet to access your trading dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button size="sm" className="glow-purple" asChild>
              <Link to="/create-agent">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Balance"
                value={`$${totalBalance.toLocaleString()}`}
                icon={<DollarSign className="w-5 h-5" />}
                color="blue"
              />
              <StatsCard
                title="Total P&L"
                value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`}
                subtitle={`${totalPnLPercent >= 0 ? '+' : ''}${totalPnLPercent.toFixed(1)}%`}
                icon={totalPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                color={totalPnL >= 0 ? "green" : "red"}
              />
              <StatsCard
                title="Active Agents"
                value={activeAgents.toString()}
                subtitle={`${agents.length} total`}
                icon={<Bot className="w-5 h-5" />}
                color="purple"
              />
              <StatsCard
                title="Total Trades"
                value={totalTrades.toString()}
                icon={<Activity className="w-5 h-5" />}
                color="cyan"
              />
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="lg:col-span-3">
                <Tabs defaultValue="agents">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="agents">My Agents</TabsTrigger>
                    <TabsTrigger value="signals">Trade Queue & History</TabsTrigger>
                  </TabsList>

              <TabsContent value="agents" className="mt-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-4">Your Agents</h2>
                  {agents.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Agents Yet</h3>
                        <p className="text-muted-foreground mb-6 text-center">
                          Create your first AI trading agent to get started
                        </p>
                        <Button asChild>
                          <Link to="/create-agent">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Agent
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {agents.map((agent) => (
                        <AgentCard 
                          key={agent.id} 
                          agent={agent} 
                          onStatusChange={handleAgentStatusChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="signals" className="mt-6">
                {address && <TradeQueue walletAddress={address} />}
              </TabsContent>
                </Tabs>
              </div>
              <div className="lg:col-span-1">
                <SystemStatus />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple' | 'cyan';
}

function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-neon-green',
    red: 'text-red-400',
    purple: 'text-neon-purple',
    cyan: 'text-neon-cyan',
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={colorClasses[color]}>{icon}</div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className={`text-sm ${colorClasses[color]}`}>{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AgentCardProps {
  agent: Agent;
  onStatusChange: (agentId: string, newStatus: Agent['status']) => void;
}

function AgentCard({ agent, onStatusChange }: AgentCardProps) {
  const strategyNames = {
    trend: 'Trend Following',
    momentum: 'Momentum',
    'mean-reversion': 'Mean Reversion'
  };

  const handleStatusToggle = () => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    onStatusChange(agent.id, newStatus);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <Badge 
              variant={agent.status === 'active' ? 'default' : 'secondary'}
              className={agent.status === 'active' ? 'bg-neon-green/20 text-neon-green' : ''}
            >
              {agent.status === 'active' ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
              {agent.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{strategyNames[agent.strategy]}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="font-semibold">${agent.current_balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L</p>
              <p className={`font-semibold ${agent.total_pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {agent.total_pnl >= 0 ? '+' : ''}${agent.total_pnl.toFixed(2)}
              </p>
              <p className={`text-xs ${agent.total_pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {((agent.total_pnl / agent.allocated_amount) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Trades: </span>
              <span className="font-medium">{agent.total_trades}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Win Rate: </span>
              <span className="font-medium">{agent.win_rate}%</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1" 
              onClick={handleStatusToggle}
            >
              {agent.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to={`/agent/${agent.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default Dashboard;