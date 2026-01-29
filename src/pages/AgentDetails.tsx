import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  ExternalLink,
  Settings,
  AlertCircle
} from 'lucide-react';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  
  // Mock agent data - replace with real data later
  const [agent] = useState({
    id: id || '1',
    name: 'Alpha Trend Bot',
    strategy: 'Trend Following',
    status: 'active',
    balance: 1250.45,
    initialBalance: 1000,
    pnl: 250.45,
    pnlPercent: 25.05,
    trades: 23,
    winRate: 78,
    createdAt: '2024-01-15',
    riskLevel: 'Medium',
    lastTrade: '2 hours ago'
  });

  const [trades] = useState([
    {
      id: '1',
      pair: 'ETH/USDC',
      type: 'BUY',
      amount: 0.5,
      price: 2450.30,
      pnl: 45.20,
      timestamp: '2024-01-20 14:30:00',
      txHash: '0x1234...5678'
    },
    {
      id: '2',
      pair: 'MATIC/USDC',
      type: 'SELL',
      amount: 100,
      price: 0.85,
      pnl: -12.50,
      timestamp: '2024-01-20 12:15:00',
      txHash: '0x5678...9012'
    },
    {
      id: '3',
      pair: 'ETH/USDC',
      type: 'SELL',
      amount: 0.3,
      price: 2480.75,
      pnl: 78.90,
      timestamp: '2024-01-20 10:45:00',
      txHash: '0x9012...3456'
    }
  ]);

  const handleToggleAgent = async () => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Agent ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`);
      // In real app, update agent status here
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">Connect your wallet to view agent details</p>
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
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
            <Button 
              onClick={handleToggleAgent}
              variant={agent.status === 'active' ? 'destructive' : 'default'}
              size="sm"
            >
              {agent.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Agent
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Agent
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Agent Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{agent.name}</CardTitle>
                    <p className="text-muted-foreground">{agent.strategy}</p>
                  </div>
                  <Badge 
                    variant={agent.status === 'active' ? 'default' : 'secondary'}
                    className={agent.status === 'active' ? 'bg-neon-green/20 text-neon-green' : ''}
                  >
                    {agent.status === 'active' ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                    {agent.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-2xl font-bold">${agent.balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total P&L</p>
                    <p className={`text-2xl font-bold ${agent.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                      {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toFixed(2)}
                    </p>
                    <p className={`text-sm ${agent.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                      {agent.pnlPercent >= 0 ? '+' : ''}{agent.pnlPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
                    <p className="text-2xl font-bold">{agent.trades}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                    <p className="text-2xl font-bold">{agent.winRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Agent Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className="font-medium">{agent.riskLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{agent.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Trade</span>
                  <span className="font-medium">{agent.lastTrade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Balance</span>
                  <span className="font-medium">${agent.initialBalance.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {agent.status === 'paused' && (
              <Card className="glass-card border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-500 mb-1">Agent Paused</p>
                      <p className="text-sm text-muted-foreground">
                        This agent is currently paused and not executing trades.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Performance Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Performance chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="trades" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="strategy">Strategy Details</TabsTrigger>
          </TabsList>

          <TabsContent value="trades">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trades.map((trade) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trade.type === 'BUY' ? 'bg-neon-green/20 text-neon-green' : 'bg-red-400/20 text-red-400'
                        }`}>
                          {trade.type === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{trade.pair}</p>
                          <p className="text-sm text-muted-foreground">
                            {trade.type} {trade.amount} @ ${trade.price}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${trade.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(trade.timestamp).toLocaleString()}
                          <Button variant="ghost" size="sm" className="h-auto p-0 ml-2">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Strategy Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Trend Following Strategy</h3>
                    <p className="text-muted-foreground mb-4">
                      This agent follows market trends and momentum indicators to make trading decisions.
                      It uses technical analysis to identify entry and exit points.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Parameters</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Moving Average Period</span>
                          <span>20</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">RSI Threshold</span>
                          <span>70/30</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stop Loss</span>
                          <span>5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Take Profit</span>
                          <span>15%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Risk Management</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Position Size</span>
                          <span>25%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Loss Limit</span>
                          <span>2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cooldown Period</span>
                          <span>1 hour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDetails;