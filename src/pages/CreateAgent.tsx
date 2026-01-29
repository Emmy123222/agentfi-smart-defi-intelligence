import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Bot, 
  TrendingUp, 
  Zap, 
  Shield, 
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const CreateAgent = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    strategy: '',
    riskLevel: '',
    amount: [1000], // Using array for slider
  });
  
  const [isDeploying, setIsDeploying] = useState(false);

  const strategies = [
    {
      id: 'trend',
      name: 'Trend Following',
      description: 'Follows market trends and momentum',
      icon: <TrendingUp className="w-5 h-5" />,
      riskLevel: 'Medium',
      expectedReturn: '8-15%'
    },
    {
      id: 'momentum',
      name: 'Momentum',
      description: 'Captures short-term price movements',
      icon: <Zap className="w-5 h-5" />,
      riskLevel: 'High',
      expectedReturn: '12-25%'
    },
    {
      id: 'mean-reversion',
      name: 'Mean Reversion',
      description: 'Buys dips and sells peaks',
      icon: <Shield className="w-5 h-5" />,
      riskLevel: 'Low',
      expectedReturn: '5-12%'
    }
  ];

  const riskLevels = [
    {
      id: 'low',
      name: 'Conservative',
      description: 'Lower risk, steady returns',
      color: 'text-neon-green'
    },
    {
      id: 'medium',
      name: 'Balanced',
      description: 'Moderate risk and returns',
      color: 'text-yellow-400'
    },
    {
      id: 'high',
      name: 'Aggressive',
      description: 'Higher risk, higher potential',
      color: 'text-red-400'
    }
  ];

  const handleDeploy = async () => {
    if (!formData.name || !formData.strategy || !formData.riskLevel) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsDeploying(true);
    
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Agent deployed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to deploy agent');
    } finally {
      setIsDeploying(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">Connect your wallet to create trading agents</p>
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
        <div className="flex items-center gap-4 mb-8">
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

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Create AI Trading Agent</h1>
            <p className="text-muted-foreground">
              Deploy an autonomous agent to trade on your behalf
            </p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agent Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Alpha Trend Bot"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Strategy Selection */}
              <div className="space-y-3">
                <Label>Trading Strategy *</Label>
                <div className="grid gap-3">
                  {strategies.map((strategy) => (
                    <motion.div
                      key={strategy.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-colors ${
                          formData.strategy === strategy.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-border/80'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, strategy: strategy.id }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-primary mt-1">{strategy.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{strategy.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {strategy.description}
                              </p>
                              <div className="flex gap-4 text-xs">
                                <span className="text-muted-foreground">
                                  Risk: <span className="text-foreground">{strategy.riskLevel}</span>
                                </span>
                                <span className="text-muted-foreground">
                                  Expected: <span className="text-neon-green">{strategy.expectedReturn}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Risk Level */}
              <div className="space-y-3">
                <Label>Risk Level *</Label>
                <Select 
                  value={formData.riskLevel} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, riskLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <div className="flex items-center gap-2">
                          <span className={level.color}>{level.name}</span>
                          <span className="text-muted-foreground text-sm">
                            - {level.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount to Allocate */}
              <div className="space-y-3">
                <Label>Amount to Allocate</Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      ${formData.amount[0].toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={formData.amount}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                    max={10000}
                    min={100}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$100</span>
                    <span>$10,000</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-500 mb-1">Important Notice</p>
                  <p className="text-muted-foreground">
                    Trading involves risk. Only invest what you can afford to lose. 
                    Past performance does not guarantee future results.
                  </p>
                </div>
              </div>

              {/* Deploy Button */}
              <Button 
                onClick={handleDeploy}
                disabled={isDeploying || !formData.name || !formData.strategy || !formData.riskLevel}
                className="w-full glow-purple"
                size="lg"
              >
                {isDeploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Deploying Agent...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5 mr-2" />
                    Deploy Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;