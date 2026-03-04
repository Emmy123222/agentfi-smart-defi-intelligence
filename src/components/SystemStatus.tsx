import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IntegrationService } from '@/services/integrationService';
import { RefreshCw, Database, Brain, Link, CheckCircle, XCircle, Wallet } from 'lucide-react';

interface SystemHealth {
  database: boolean;
  ai: boolean;
  blockchain: boolean;
  overall: boolean;
}

export const SystemStatus = () => {
  const { isConnected, chain } = useAccount();
  const [health, setHealth] = useState<SystemHealth>({
    database: false,
    ai: false,
    blockchain: false,
    overall: false
  });
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const healthStatus = await IntegrationService.systemHealthCheck();
      setHealth(healthStatus);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  // Log chain info for debugging
  useEffect(() => {
    if (chain) {
      console.log('Connected chain:', {
        id: chain.id,
        name: chain.name,
        isPolygonAmoy: chain.id === 80002
      });
    }
  }, [chain]);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'}>
        {status ? 'Online' : 'Offline'}
      </Badge>
    );
  };

  // Check if connected to Polygon Amoy (chain ID 80002)
  const isCorrectNetwork = isConnected && chain && chain.id === 80002;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">System Status</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkSystemHealth}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${health.overall ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">Overall System</span>
          </div>
          {getStatusBadge(health.overall)}
        </div>

        {/* Individual Components */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded border border-border/30">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.database)}
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Database (Supabase)</span>
            </div>
            {getStatusBadge(health.database)}
          </div>

          <div className="flex items-center justify-between p-2 rounded border border-border/30">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.ai)}
              <Brain className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">AI Service (Groq)</span>
            </div>
            {getStatusBadge(health.ai)}
          </div>

          <div className="flex items-center justify-between p-2 rounded border border-border/30">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.blockchain)}
              <Link className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Blockchain (Polygon)</span>
            </div>
            {getStatusBadge(health.blockchain)}
          </div>

          {/* Wallet Connection Status */}
          <div className="flex items-center justify-between p-2 rounded border border-border/30 bg-muted/20">
            <div className="flex items-center gap-2">
              {getStatusIcon(isCorrectNetwork)}
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm">Wallet Connection</span>
                {chain && (
                  <span className="text-xs text-muted-foreground">
                    {chain.name} (ID: {chain.id})
                  </span>
                )}
              </div>
            </div>
            {isConnected ? (
              isCorrectNetwork ? (
                <Badge variant="default">Connected</Badge>
              ) : (
                <Badge variant="destructive">Wrong Network</Badge>
              )
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
        </div>

        {/* Last Check */}
        {lastCheck && (
          <div className="text-xs text-muted-foreground text-center">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* Integration Status */}
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground mb-2">Integration Features:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>AI → Database</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected && isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span>Database → Blockchain</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Frontend → All Services</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Real-time Sync</span>
            </div>
          </div>
        </div>

        {/* Helpful message if wallet not connected */}
        {!isConnected && (
          <div className="text-xs text-yellow-500 text-center p-2 bg-yellow-500/10 rounded">
            💡 Connect your wallet to enable blockchain transactions
          </div>
        )}
        {isConnected && !isCorrectNetwork && (
          <div className="text-xs text-red-500 text-center p-2 bg-red-500/10 rounded">
            ⚠️ Please switch to Polygon Amoy network
          </div>
        )}
      </CardContent>
    </Card>
  );
};