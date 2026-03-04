import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  CheckCircle,
  Wallet
} from 'lucide-react';

// ROOT FIX: The previous implementation read chain ID via
// window.ethereum.request({ method: 'eth_chainId' }) directly.
// When the app is connected through wagmi, wagmi wraps window.ethereum
// in its own provider. The raw window.ethereum call can return stale
// data until wagmi's internal chainChanged listener fires.
// Fix: use wagmi's useChainId() hook — it is always in sync with the
// wallet because wagmi manages the event subscription itself.
const AMOY_CHAIN_ID = 80002;

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const steps: WizardStep[] = [
  { id: 1, title: 'Basic Info',        description: 'Name and strategy selection' },
  { id: 2, title: 'Risk & Amount',     description: 'Configure risk level and investment' },
  { id: 3, title: 'Trading Pairs',     description: 'Select token pairs to trade' },
  { id: 4, title: 'Advanced Settings', description: 'Gas and slippage configuration' },
  { id: 5, title: 'Review & Deploy',   description: 'Confirm and deploy your agent' }
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
  const { address }               = useAccount();
  // useChainId() subscribes to wagmi's chain state — always accurate,
  // never stale, no manual window.ethereum polling needed.
  const chainId                   = useChainId();
  const { switchChainAsync }      = useSwitchChain();
  const navigate                  = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [formData, setFormData]       = useState<FormData>({
    name:              '',
    strategy:          '',
    riskLevel:         '',
    amount:            [1000],
    tokenPairs:        ['MATIC/USDC'],
    slippageTolerance: [0.5],
    gasSettings: {
      maxFeePerGas:         '30',
      maxPriorityFeePerGas: '2'
    }
  });

  const isOnAmoy = chainId === AMOY_CHAIN_ID;

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
    { id: 'low',    name: 'Conservative', description: 'Lower risk, steady returns',    color: 'text-neon-green' },
    { id: 'medium', name: 'Balanced',     description: 'Moderate risk and returns',     color: 'text-yellow-400' },
    { id: 'high',   name: 'Aggressive',   description: 'Higher risk, higher potential', color: 'text-red-400'    }
  ];

  const availableTokenPairs = [
    'MATIC/USDC', 'ETH/USDC', 'WBTC/USDC', 'LINK/USDC', 'AAVE/USDC', 'UNI/USDC'
  ];

  const progress = (currentStep / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!(formData.name && formData.strategy);
      case 2: return !!(formData.riskLevel && formData.amount[0] > 0);
      case 3: return formData.tokenPairs.length > 0;
      case 4: return true;
      case 5: return !!address && isOnAmoy;
      default: return false;
    }
  };

  const handleNext     = () => { if (currentStep < steps.length) setCurrentStep(s => s + 1); };
  const handlePrevious = () => { if (currentStep > 1)            setCurrentStep(s => s - 1); };

  // Switching is now handled by wagmi's useSwitchChain — it uses the same
  // internal provider as useChainId, so after it resolves, isOnAmoy
  // will be true on the next render without any manual polling.
  const handleSwitchNetwork = async () => {
    try {
      setIsSwitching(true);
      await switchChainAsync({ chainId: AMOY_CHAIN_ID });
      toast.success('Switched to Polygon Amoy!');
    } catch (err: any) {
      toast.error('Network switch failed', {
        description: err?.message ?? 'Please switch to Polygon Amoy manually in MetaMask.'
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleDeploy = async () => {
    if (!address) {
      toast.error('Please connect your wallet before deploying.');
      return;
    }

    // Strict check - must be on Amoy
    if (!isOnAmoy) {
      toast.error('Wrong Network!', {
        description: 'Please switch to Polygon Amoy in MetaMask first.'
      });
      return;
    }

    setIsDeploying(true);
    try {
      const result = await IntegrationService.createAgentWithFullIntegration({
        name:              formData.name,
        strategy:          formData.strategy as 'trend' | 'momentum' | 'mean-reversion',
        riskLevel:         formData.riskLevel as 'low' | 'medium' | 'high',
        allocatedAmount:   formData.amount[0],
        tokenPairs:        formData.tokenPairs,
        slippageTolerance: formData.slippageTolerance[0],
        gasSettings:       formData.gasSettings,
        walletAddress:     address
      });

      if (result.blockchainTxHash) {
        toast.success(`Agent "${result.agent.name}" deployed on-chain! 🚀`, {
          action: {
            label: 'View TX',
            onClick: () => window.open(
              `https://amoy.polygonscan.com/tx/${result.blockchainTxHash}`,
              '_blank'
            )
          }
        });
      } else {
        toast.success(`Agent "${result.agent.name}" created! Blockchain registration pending.`);
      }

      setIsDeploying(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create agent');
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
                  <motion.div key={strategy.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                            <p className="text-sm text-muted-foreground mb-2">{strategy.description}</p>
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
                        <span className="text-muted-foreground text-sm">- {level.description}</span>
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
                  <span className="text-2xl font-bold">${formData.amount[0].toLocaleString()}</span>
                </div>
                <Slider
                  value={formData.amount}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                  max={10000} min={100} step={100} className="w-full"
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
                        setFormData(prev => ({
                          ...prev,
                          tokenPairs: checked
                            ? [...prev.tokenPairs, pair]
                            : prev.tokenPairs.filter(p => p !== pair)
                        }));
                      }}
                    />
                    <Label htmlFor={pair} className="text-sm font-medium">{pair}</Label>
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
                <span className="text-sm text-muted-foreground">{formData.slippageTolerance[0]}%</span>
                <Slider
                  value={formData.slippageTolerance}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, slippageTolerance: value }))}
                  max={5} min={0.1} step={0.1} className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1%</span><span>5%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxFee">Max Fee (Gwei)</Label>
                <Input
                  id="maxFee" type="number"
                  value={formData.gasSettings.maxFeePerGas}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gasSettings: { ...prev.gasSettings, maxFeePerGas: e.target.value }
                  }))}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priorityFee">Priority Fee (Gwei)</Label>
                <Input
                  id="priorityFee" type="number"
                  value={formData.gasSettings.maxPriorityFeePerGas}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gasSettings: { ...prev.gasSettings, maxPriorityFeePerGas: e.target.value }
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
              <p className="text-muted-foreground">Please review your configuration before deploying</p>
            </div>

            {/* Network status banner — only shown when on wrong network */}
            {!isOnAmoy && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Wrong network (chain {chainId}). Switch to Polygon Amoy to deploy.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={handleSwitchNetwork}
                  disabled={isSwitching}
                >
                  {isSwitching ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                  ) : null}
                  {isSwitching ? 'Switching...' : 'Switch Network'}
                </Button>
              </div>
            )}

            {isOnAmoy && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                Connected to Polygon Amoy ✓
              </div>
            )}

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
                      <span key={pair} className="px-2 py-1 bg-primary/20 rounded text-sm">{pair}</span>
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

                <div>
                  <p className="text-sm text-muted-foreground">Deploying from</p>
                  {address
                    ? <p className="font-mono text-xs text-primary break-all">{address}</p>
                    : <p className="text-sm text-red-400 flex items-center gap-1">
                        <Wallet className="w-4 h-4" /> No wallet connected
                      </p>
                  }
                </div>
              </CardContent>
            </Card>

            {/* Network Warning */}
            {!isOnAmoy && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border-2 border-red-500 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-red-500 mb-2 text-lg">⚠️ WRONG NETWORK - ACTION REQUIRED</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    You're currently on <span className="font-bold">{Number(chainId) === 1 ? 'Ethereum Mainnet' : `Chain ID ${chainId}`}</span>.
                    <br />
                    You MUST switch to <span className="font-bold text-red-500">Polygon Amoy (Chain ID: {AMOY_CHAIN_ID})</span> before deploying.
                  </p>
                  <div className="bg-red-500/20 p-3 rounded mb-3">
                    <p className="text-sm font-medium mb-2">📋 Manual Switch Instructions:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Open MetaMask</li>
                      <li>Click the network dropdown at the top</li>
                      <li>Select "Polygon Amoy"</li>
                      <li>Come back and click Deploy</li>
                    </ol>
                  </div>
                  <Button 
                    onClick={handleSwitchNetwork} 
                    disabled={isSwitching}
                    size="sm"
                    variant="destructive"
                    className="w-full"
                  >
                    {isSwitching ? (
                      <>
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Switching...
                      </>
                    ) : (
                      <>Try Automatic Switch (May Not Work)</>
                    )}
                  </Button>
                </div>
              </div>
            )}

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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Create AI Trading Agent</h1>
          <span className="text-sm text-muted-foreground">Step {currentStep} of {steps.length}</span>
        </div>

        <Progress value={progress} className="mb-4" />

        <div className="flex justify-between text-sm">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`text-center ${step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto mb-1 ${
                step.id < currentStep
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step.id === currentStep
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground'
              }`}>
                {step.id < currentStep ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              <p className="text-xs font-medium">{step.title}</p>
            </div>
          ))}
        </div>
      </div>

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

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isDeploying || isSwitching}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="glow-purple">
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || isSwitching || !canProceed() || !isOnAmoy}
            className="glow-purple"
          >
            {isSwitching ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Switching Network...
              </>
            ) : isDeploying ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Deploying...
              </>
            ) : !address ? (
              <><Wallet className="w-4 h-4 mr-2" />Connect Wallet</>
            ) : !isOnAmoy ? (
              <><AlertTriangle className="w-4 h-4 mr-2" />Switch Network First</>
            ) : (
              <><Bot className="w-4 h-4 mr-2" />Deploy Agent</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};