import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SignalService } from '@/services/signalService';
import type { Database } from '@/integrations/supabase/types';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

type TradingSignal = Database['public']['Tables']['trading_signals']['Row'];

interface TradeQueueProps {
  walletAddress: string;
}

export const TradeQueue = ({ walletAddress }: TradeQueueProps) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSignals();
  }, [walletAddress]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      const recentSignals = await SignalService.getRecentSignals(walletAddress, 50);
      setSignals(recentSignals);
    } catch (error) {
      console.error('Failed to load signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSignals();
    setRefreshing(false);
  };

  const pendingSignals = signals.filter(s => !s.executed);
  const executedSignals = signals.filter(s => s.executed);

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY':
        return <TrendingUp className="w-4 h-4" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY':
        return 'bg-neon-green/20 text-neon-green';
      case 'SELL':
        return 'bg-red-400/20 text-red-400';
      default:
        return 'bg-yellow-400/20 text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trade Queue & History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Signals</p>
                <p className="text-2xl font-bold">{signals.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingSignals.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Executed</p>
                <p className="text-2xl font-bold">{executedSignals.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-neon-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {executedSignals.length > 0 
                    ? Math.round((executedSignals.length / signals.length) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-neon-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Signals */}
      {pendingSignals.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Pending Signals ({pendingSignals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} isPending={true} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executed Signals */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-neon-green" />
            Execution History ({executedSignals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executedSignals.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No executed signals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executedSignals.slice(0, 10).map((signal) => (
                <SignalCard key={signal.id} signal={signal} isPending={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface SignalCardProps {
  signal: TradingSignal;
  isPending: boolean;
}

const SignalCard = ({ signal, isPending }: SignalCardProps) => {
  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY':
        return <TrendingUp className="w-4 h-4" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY':
        return 'bg-neon-green/20 text-neon-green';
      case 'SELL':
        return 'bg-red-400/20 text-red-400';
      default:
        return 'bg-yellow-400/20 text-yellow-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSignalColor(signal.signal_type)}`}>
          {getSignalIcon(signal.signal_type)}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{signal.token_pair}</p>
            <Badge variant={isPending ? 'secondary' : 'default'}>
              {signal.signal_type}
            </Badge>
            <Badge variant="outline">
              {signal.confidence_score}% confidence
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Position: {signal.position_size}%
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
            {signal.reasoning}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <Badge variant={isPending ? 'secondary' : 'default'} className="mb-2">
          {isPending ? 'Pending' : 'Executed'}
        </Badge>
        
        {signal.price_target && (
          <p className="text-sm text-muted-foreground">
            Target: ${signal.price_target.toFixed(4)}
          </p>
        )}
        
        {signal.execution_price && (
          <p className="text-sm text-neon-green">
            Executed: ${signal.execution_price.toFixed(4)}
          </p>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Clock className="w-3 h-3" />
          {new Date(signal.created_at).toLocaleString()}
          {signal.transaction_hash && (
            <Button variant="ghost" size="sm" className="h-auto p-0 ml-2">
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};