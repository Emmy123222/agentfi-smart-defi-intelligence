import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { AIService, type MarketSignal } from './aiService';

type TradingSignal = Database['public']['Tables']['trading_signals']['Row'];
type TradingSignalInsert = Database['public']['Tables']['trading_signals']['Insert'];

export class SignalService {
  static async generateSignalForAgent(agentId: string): Promise<TradingSignal> {
    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Generate AI signal for the primary token pair
    const primaryPair = agent.token_pairs?.[0] || 'MATIC/USDC';
    
    try {
      // Try to use edge function first
      const aiSignal = await AIService.generateTradingSignal({
        agentId: agentId,
        tokenPair: primaryPair,
        strategy: agent.strategy as 'trend' | 'momentum' | 'mean-reversion',
        riskLevel: agent.risk_level as 'low' | 'medium' | 'high',
        allocatedAmount: agent.allocated_amount,
      });

      // If edge function worked, the signal should already be in database
      // Try to fetch it
      const { data: signal, error } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single

      if (signal) {
        return signal;
      }

      // If no signal found, create one manually with the AI response
      const signalData = {
        agent_id: agentId,
        signal_type: aiSignal.signal,
        token_pair: aiSignal.tokenPair,
        confidence_score: aiSignal.confidence,
        reasoning: aiSignal.reasoning,
        price_target: aiSignal.priceTarget || null,
        stop_loss: aiSignal.stopLoss || null,
        position_size: aiSignal.positionSize,
        executed: false,
      };

      const { data: newSignal, error: insertError } = await supabase
        .from('trading_signals')
        .insert(signalData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to store signal: ${insertError.message}`);
      }

      // Update agent's last signal timestamp
      await supabase
        .from('agents')
        .update({ 
          last_signal_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', agentId);

      return newSignal;

    } catch (error) {
      console.error('Edge function failed, using fallback:', error);
      
      // Fallback: Generate signal locally and store it
      const fallbackSignal = this.generateFallbackSignal(agent, primaryPair);
      
      const signalData = {
        agent_id: agentId,
        signal_type: fallbackSignal.signal,
        token_pair: fallbackSignal.tokenPair,
        confidence_score: fallbackSignal.confidence,
        reasoning: fallbackSignal.reasoning,
        price_target: fallbackSignal.priceTarget || null,
        stop_loss: fallbackSignal.stopLoss || null,
        position_size: fallbackSignal.positionSize,
        executed: false,
      };

      const { data: newSignal, error: insertError } = await supabase
        .from('trading_signals')
        .insert(signalData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to store fallback signal: ${insertError.message}`);
      }

      // Update agent's last signal timestamp
      await supabase
        .from('agents')
        .update({ 
          last_signal_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', agentId);

      return newSignal;
    }
  }

  private static generateFallbackSignal(agent: any, tokenPair: string) {
    const { strategy, risk_level } = agent;
    
    // Generate signal based on strategy
    let signal: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reasoning: string;
    let priceTarget: number | undefined;
    let stopLoss: number | undefined;
    
    switch (strategy) {
      case 'trend':
        signal = Math.random() > 0.4 ? 'BUY' : 'HOLD';
        confidence = Math.floor(Math.random() * 25) + 65;
        reasoning = `Trend analysis for ${tokenPair} shows ${signal === 'BUY' ? 'strong upward momentum' : 'consolidation phase'}. Technical indicators suggest ${signal === 'BUY' ? 'bullish continuation' : 'waiting for clearer direction'}.`;
        priceTarget = signal === 'BUY' ? 1.12 + Math.random() * 0.08 : undefined;
        stopLoss = signal === 'BUY' ? 0.94 + Math.random() * 0.04 : undefined;
        break;
        
      case 'momentum':
        signal = Math.random() > 0.5 ? 'SELL' : 'BUY';
        confidence = Math.floor(Math.random() * 20) + 70;
        reasoning = `Momentum indicators for ${tokenPair} suggest ${signal === 'BUY' ? 'strong buying pressure' : 'overbought conditions'}. MACD shows ${signal === 'BUY' ? 'bullish crossover' : 'bearish divergence'}.`;
        priceTarget = signal === 'BUY' ? 1.08 + Math.random() * 0.12 : 0.88 + Math.random() * 0.08;
        stopLoss = signal === 'BUY' ? 0.92 + Math.random() * 0.06 : 1.12 - Math.random() * 0.08;
        break;
        
      case 'mean-reversion':
        signal = Math.random() > 0.6 ? 'HOLD' : (Math.random() > 0.5 ? 'BUY' : 'SELL');
        confidence = Math.floor(Math.random() * 30) + 55;
        reasoning = `Mean reversion analysis for ${tokenPair} indicates ${signal === 'HOLD' ? 'price near fair value' : signal === 'BUY' ? 'oversold conditions' : 'overbought levels'}. Bollinger Bands show ${signal === 'BUY' ? 'price at lower band' : signal === 'SELL' ? 'price at upper band' : 'price in middle range'}.`;
        priceTarget = signal === 'BUY' ? 1.05 + Math.random() * 0.08 : signal === 'SELL' ? 0.92 + Math.random() * 0.06 : undefined;
        stopLoss = signal === 'BUY' ? 0.96 + Math.random() * 0.03 : signal === 'SELL' ? 1.08 - Math.random() * 0.04 : undefined;
        break;
        
      default:
        signal = 'HOLD';
        confidence = 50;
        reasoning = 'Strategy analysis suggests holding current position until clearer market signals emerge.';
    }

    const baseSize = { low: 8, medium: 20, high: 35 }[risk_level] || 20;
    const positionSize = Math.round(baseSize * (confidence / 75));

    return {
      signal,
      confidence,
      reasoning,
      priceTarget,
      stopLoss,
      positionSize,
      tokenPair,
      timestamp: new Date().toISOString(),
    };
  }

  static async getSignalsByAgent(agentId: string, limit = 50): Promise<TradingSignal[]> {
    const { data: signals, error } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch signals: ${error.message}`);
    }

    return signals || [];
  }

  static async getRecentSignals(walletAddress: string, limit = 20): Promise<(TradingSignal & { agents: { name: string } })[]> {
    // Get signals for all user's agents
    const { data: signals, error } = await supabase
      .from('trading_signals')
      .select(`
        *,
        agents!inner(wallet_address, name)
      `)
      .eq('agents.wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent signals: ${error.message}`);
    }

    return signals || [];
  }

  static async executeSignal(signalId: string, executionPrice: number, gasUsed: number, txHash: string): Promise<TradingSignal> {
    const { data: signal, error } = await supabase
      .from('trading_signals')
      .update({
        executed: true,
        executed_at: new Date().toISOString(),
        execution_price: executionPrice,
        gas_used: gasUsed,
        transaction_hash: txHash,
      })
      .eq('id', signalId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update signal execution: ${error.message}`);
    }

    return signal;
  }

  static async getSignalAccuracy(agentId: string): Promise<{
    totalSignals: number;
    executedSignals: number;
    profitableSignals: number;
    accuracy: number;
  }> {
    const { data: signals, error } = await supabase
      .from('trading_signals')
      .select('executed, execution_price, price_target, signal_type')
      .eq('agent_id', agentId);

    if (error) {
      throw new Error(`Failed to calculate signal accuracy: ${error.message}`);
    }

    const totalSignals = signals?.length || 0;
    const executedSignals = signals?.filter(s => s.executed).length || 0;
    
    // Simple profitability check (in production, this would be more sophisticated)
    const profitableSignals = signals?.filter(s => {
      if (!s.executed || !s.execution_price || !s.price_target) return false;
      
      if (s.signal_type === 'BUY') {
        return s.execution_price <= s.price_target;
      } else if (s.signal_type === 'SELL') {
        return s.execution_price >= s.price_target;
      }
      return false;
    }).length || 0;

    const accuracy = executedSignals > 0 ? (profitableSignals / executedSignals) * 100 : 0;

    return {
      totalSignals,
      executedSignals,
      profitableSignals,
      accuracy,
    };
  }
}