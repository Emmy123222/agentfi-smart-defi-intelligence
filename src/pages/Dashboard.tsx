import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
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
  Eye
} from 'lucide-react';

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  
  // Mock data - replace with real data later
  const [agents] = useState([
    {
      id: '1',
      name: 'Alpha Trend Bot',
      strategy: 'Trend Following',
      status: 'active',
      balance: 1250.45,
      pnl: 125.30,
      pnlPercent: 11.2,
      trades: 23,
      winRate: 78
    },
    {
      id: '2', 
      name: 'Momentum Hunter',
      strategy: 'Momentum',
      status: 'paused',
      balance: 890.20,
      pnl: -45.80,
      pnlPercent: -4.9,
      trades: 15,
      winRate: 60
    },
    {
      id: '3',
      name: 'Mean Reversion Pro',
      strategy: 'Mean Reversion', 
      status: 'active',
      balance: 2100.75,
      pnl: 310.25,
      pnlPercent: 17.3,
      trades: 41,
      winRate: 85
    }
  ]);

  const totalBalance = agents.reduce((sum, agent) => sum + agent.balance, 0);
  const totalPnL = agents.reduce((sum, agent) => sum + agent.pnl, 0);
  const totalPnLPercent = (totalPnL / (totalBalance - totalPnL)) * 100;

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
            value={agents.filter(a => a.status === 'active').length.toString()}
            subtitle={`${agents.length} total`}
            icon={<Bot className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title="Total Trades"
            value={agents.reduce((sum, agent) => sum + agent.trades, 0).toString()}
            icon={<Activity className="w-5 h-5" />}
            color="cyan"
          />
        </div>

        {/* Agents Grid */}
        <div className="mb-8">
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
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
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
  agent: {
    id: string;
    name: string;
    strategy: string;
    status: string;
    balance: number;
    pnl: number;
    pnlPercent: number;
    trades: number;
    winRate: number;
  };
}

function AgentCard({ agent }: AgentCardProps) {
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
          <p className="text-sm text-muted-foreground">{agent.strategy}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="font-semibold">${agent.balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L</p>
              <p className={`font-semibold ${agent.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toFixed(2)}
              </p>
              <p className={`text-xs ${agent.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {agent.pnlPercent >= 0 ? '+' : ''}{agent.pnlPercent.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Trades: </span>
              <span className="font-medium">{agent.trades}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Win Rate: </span>
              <span className="font-medium">{agent.winRate}%</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={`/agent/${agent.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default Dashboard;