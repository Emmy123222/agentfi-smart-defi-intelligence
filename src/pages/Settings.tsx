import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useDisconnect } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Wallet, 
  Key, 
  Bell, 
  Shield, 
  LogOut,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

const Settings = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      tradeAlerts: true,
      performanceUpdates: true,
      systemUpdates: false,
    },
    trading: {
      autoRebalance: false,
      emergencyStop: true,
      maxDailyLoss: 5,
    },
    apiKey: '',
  });

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected');
    navigate('/');
  };

  const handleSaveSettings = () => {
    // Simulate saving settings
    toast.success('Settings saved successfully');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">Connect your wallet to access settings</p>
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
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and trading preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Wallet Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Connected Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-secondary rounded text-sm font-mono">
                      {address}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAddress}
                      className="shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-medium">Network</p>
                    <p className="text-sm text-muted-foreground">Polygon Mainnet</p>
                  </div>
                  <Button variant="destructive" onClick={handleDisconnect}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">API Key (Optional)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key for enhanced features"
                    value={settings.apiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    API key is used for advanced market data and analytics
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trade Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when agents execute trades</p>
                  </div>
                  <Switch
                    checked={settings.notifications.tradeAlerts}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, tradeAlerts: checked }
                      }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Performance Updates</p>
                    <p className="text-sm text-muted-foreground">Daily/weekly performance summaries</p>
                  </div>
                  <Switch
                    checked={settings.notifications.performanceUpdates}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, performanceUpdates: checked }
                      }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Updates</p>
                    <p className="text-sm text-muted-foreground">Platform updates and maintenance notices</p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, systemUpdates: checked }
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trading Preferences */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Trading Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Rebalance Portfolio</p>
                    <p className="text-sm text-muted-foreground">Automatically rebalance agent allocations</p>
                  </div>
                  <Switch
                    checked={settings.trading.autoRebalance}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        trading: { ...prev.trading, autoRebalance: checked }
                      }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Emergency Stop</p>
                    <p className="text-sm text-muted-foreground">Enable emergency stop for all agents</p>
                  </div>
                  <Switch
                    checked={settings.trading.emergencyStop}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        trading: { ...prev.trading, emergencyStop: checked }
                      }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="maxDailyLoss">Max Daily Loss (%)</Label>
                  <Input
                    id="maxDailyLoss"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.trading.maxDailyLoss}
                    onChange={(e) => 
                      setSettings(prev => ({
                        ...prev,
                        trading: { ...prev.trading, maxDailyLoss: parseInt(e.target.value) || 5 }
                      }))
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Pause all agents if daily loss exceeds this percentage
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="glass-card border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Emergency Stop All Agents</p>
                    <p className="text-sm text-muted-foreground">
                      Immediately pause all active trading agents
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Emergency Stop
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                onClick={handleSaveSettings}
                className="w-full glow-purple"
                size="lg"
              >
                Save Settings
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;