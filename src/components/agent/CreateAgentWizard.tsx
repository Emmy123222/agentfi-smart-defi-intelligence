import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AgentService } from '@/services/agentService';
import { IntegrationService } from '@/services/integrationService';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight,
  Bot, 
  TrendingUp, 
  Zap, 
  Shield, 
  DollarSign,
  AlertTriangle,
  Settings,
  CheckCircle
} from 'lucide-react';

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const steps: WizardStep[] = [
  { id: 1, title: 'Basic Info', description: 'Name and strategy selection' },
  { id: 2, title: 'Risk & Amount', description: 'Configure risk level and investment' },
  { id: 3, title: 'Trading Pairs', description: 'Select token pairs to trade' },
  { id: 4, title: 'Advanced Settings', description: 'Gas and slippage configuration' },
  { id: 5, title: 'Review & Deploy', description: 'Confirm and deploy your agent' }
];

interface FormData {
  name: string;
  strategy: string;
  riskLevel: string;
  amount: number[];
  tokenPairs: string[];
  slippageTolerance: number[];
  gasSettings: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
}

export const CreateAgentWizard = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    strategy: '',
    riskLevel: '',
    amount: [1000],
    tokenPairs: ['MATIC/USDC'],
    slippageTolerance: [0.5],
    gasSettings: {
      maxFeePerGas: '30',
      maxPriorityFeePerGas: '2'
    }
  });

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
    { id: 'low', name: 'Conservative', description: 'Lower risk, steady returns', color: 'text-neon-green' },
    { id: 'medium', name: 'Balanced', description: 'Moderate risk and returns', color: 'text-yellow-400' },
    { id: 'high', name: 'Aggressive', description: 'Higher risk, higher potential', color: 'text-red-400' }
  ];

  const availableTokenPairs = [
    'MATIC/USDC', 'ETH/USDC', 'WBTC/USDC', 'LINK/USDC', 'AAVE/USDC', 'UNI/USDC'
  ];

  const progress = (currentStep / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name && formData.strategy;
      case 2: return formData.riskLevel && formData.amount[0] > 0;
      case 3: return formData.tokenPairs.length > 0;
      case 4: return true; // Advanced settings are optional
      case 5: return true; // Review step
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setIsDeploying(true);
    
    try {
      // Use integrated service for full blockchain + AI integration
      const result = await AgentService.createAgentWithIntegration(address, {
        name: formData.name,
        strategy: formData.strategy as 'trend' | 'momentum' | 'mean-reversion',
        riskLevel: formData.riskLevel as 'low' | 'medium' | 'high',
        allocatedAmount: formData.amount[0],
        tokenPairs: formData.tokenPairs,
        slippageTolerance: formData.slippageTolerance[0],
        gasSettings: formData.gasSettings,
      });
      
      if (result.blockchainTxHash) {
        toast.success(`Agent "${result.agent.name}" created and registered on blockchain! 🚀`);
      } else {
        toast.success(`Agent "${result.agent.name}" created in database! Blockchain registration can be done later.`);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setIsDeploying(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Alpha Trend Bot"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
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

            <div className="space-y-3">
              <Label>Investment Amount</Label>
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Trading Pairs *</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableTokenPairs.map((pair) => (
                  <div key={pair} className="flex items-center space-x-2">
                    <Checkbox
                      id={pair}
                      checked={formData.tokenPairs.includes(pair)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            tokenPairs: [...prev.tokenPairs, pair]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            tokenPairs: prev.tokenPairs.filter(p => p !== pair)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={pair} className="text-sm font-medium">
                      {pair}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select at least one trading pair for your agent
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Slippage Tolerance</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {formData.slippageTolerance[0]}%
                  </span>
                </div>
                <Slider
                  value={formData.slippageTolerance}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, slippageTolerance: value }))}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxFee">Max Fee (Gwei)</Label>
                <Input
                  id="maxFee"
                  type="number"
                  value={formData.gasSettings.maxFeePerGas}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gasSettings: {
                      ...prev.gasSettings,
                      maxFeePerGas: e.target.value
                    }
                  }))}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priorityFee">Priority Fee (Gwei)</Label>
                <Input
                  id="priorityFee"
                  type="number"
                  value={formData.gasSettings.maxPriorityFeePerGas}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gasSettings: {
                      ...prev.gasSettings,
                      maxPriorityFeePerGas: e.target.value
                    }
                  }))}
                  placeholder="2"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Review Your Agent</h3>
              <p className="text-muted-foreground">
                Please review your configuration before deploying
              </p>
            </div>

            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Agent Name</p>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Strategy</p>
                    <p className="font-medium">
                      {strategies.find(s => s.id === formData.strategy)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <p className="font-medium capitalize">{formData.riskLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Investment</p>
                    <p className="font-medium">${formData.amount[0].toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Trading Pairs</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tokenPairs.map(pair => (
                      <span key={pair} className="px-2 py-1 bg-primary/20 rounded text-sm">
                        {pair}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Slippage</p>
                    <p className="font-medium">{formData.slippageTolerance[0]}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Gas Fee</p>
                    <p className="font-medium">{formData.gasSettings.maxFeePerGas} Gwei</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Create AI Trading Agent</h1>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        
        <Progress value={progress} className="mb-4" />
        
        <div className="flex justify-between text-sm">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`text-center ${
                step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto mb-1 ${
                step.id < currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : step.id === currentStep
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground'
              }`}>
                {step.id < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <p className="text-xs font-medium">{step.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="glow-purple"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || !canProceed()}
            className="glow-purple"
          >
            {isDeploying ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Deploying...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Deploy Agent
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};