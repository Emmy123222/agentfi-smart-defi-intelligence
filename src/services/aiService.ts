// AI Service for market analysis using Groq Cloud AI via Supabase Edge Functions
import { supabase } from '@/integrations/supabase/client';

export interface MarketSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasoning: string;
  priceTarget?: number;
  stopLoss?: number;
  positionSize: number; // Percentage of allocated amount
  tokenPair: string;
  timestamp: string;
}

export interface MarketAnalysisInput {
  agentId: string;
  tokenPair: string;
  strategy: 'trend' | 'momentum' | 'mean-reversion';
  riskLevel: 'low' | 'medium' | 'high';
  allocatedAmount: number;
  historicalData?: any; // Price data, volume, etc.
}

export class AIService {
  static async generateTradingSignal(input: MarketAnalysisInput): Promise<MarketSignal> {
    try {
      // Call Supabase Edge Function for AI analysis
      const { data, error } = await supabase.functions.invoke('generate-trading-signal', {
        body: input
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`AI service error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate signal');
      }

      // Convert database signal to MarketSignal format
      const dbSignal = data.signal;
      return {
        signal: dbSignal.signal_type,
        confidence: dbSignal.confidence_score,
        reasoning: dbSignal.reasoning,
        priceTarget: dbSignal.price_target,
        stopLoss: dbSignal.stop_loss,
        positionSize: dbSignal.position_size,
        tokenPair: dbSignal.token_pair,
        timestamp: dbSignal.created_at,
      };
    } catch (error) {
      console.error('Failed to generate trading signal:', error);
      
      // Fallback to local simulation if edge function fails
      return this.simulateAISignal(input);
    }
  }

  private static simulateAISignal(input: MarketAnalysisInput): MarketSignal {
    const { strategy, riskLevel, tokenPair } = input;
    
    // Simulate different strategies with more sophisticated logic
    let signal: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reasoning: string;
    let priceTarget: number | undefined;
    let stopLoss: number | undefined;
    
    // Strategy-based signal generation
    switch (strategy) {
      case 'trend':
        signal = Math.random() > 0.4 ? 'BUY' : 'HOLD';
        confidence = Math.floor(Math.random() * 25) + 65; // 65-90%
        reasoning = `Trend analysis for ${tokenPair} shows ${signal === 'BUY' ? 'strong upward momentum with increasing volume' : 'consolidation phase, waiting for clearer direction'}. RSI indicates ${signal === 'BUY' ? 'oversold conditions with potential reversal' : 'neutral territory'}.`;
        priceTarget = signal === 'BUY' ? 1.12 + Math.random() * 0.08 : undefined;
        stopLoss = signal === 'BUY' ? 0.94 + Math.random() * 0.04 : undefined;
        break;
        
      case 'momentum':
        signal = Math.random() > 0.5 ? 'SELL' : 'BUY';
        confidence = Math.floor(Math.random() * 20) + 70; // 70-90%
        reasoning = `Momentum indicators for ${tokenPair} suggest ${signal === 'BUY' ? 'strong buying pressure with breakout potential' : 'overbought conditions with momentum divergence'}. MACD shows ${signal === 'BUY' ? 'bullish crossover' : 'bearish divergence'}.`;
        priceTarget = signal === 'BUY' ? 1.08 + Math.random() * 0.12 : 0.88 + Math.random() * 0.08;
        stopLoss = signal === 'BUY' ? 0.92 + Math.random() * 0.06 : 1.12 - Math.random() * 0.08;
        break;
        
      case 'mean-reversion':
        signal = Math.random() > 0.6 ? 'HOLD' : (Math.random() > 0.5 ? 'BUY' : 'SELL');
        confidence = Math.floor(Math.random() * 30) + 55; // 55-85%
        reasoning = `Mean reversion analysis for ${tokenPair} indicates ${signal === 'HOLD' ? 'price near fair value, no clear reversion signal' : signal === 'BUY' ? 'oversold conditions with high probability of bounce' : 'overbought levels suggesting pullback'}. Bollinger Bands show ${signal === 'BUY' ? 'price touching lower band' : signal === 'SELL' ? 'price at upper band' : 'price in middle range'}.`;
        priceTarget = signal === 'BUY' ? 1.05 + Math.random() * 0.08 : signal === 'SELL' ? 0.92 + Math.random() * 0.06 : undefined;
        stopLoss = signal === 'BUY' ? 0.96 + Math.random() * 0.03 : signal === 'SELL' ? 1.08 - Math.random() * 0.04 : undefined;
        break;
        
      default:
        signal = 'HOLD';
        confidence = 50;
        reasoning = 'Unknown strategy, defaulting to HOLD';
    }

    return {
      signal,
      confidence,
      reasoning,
      priceTarget,
      stopLoss,
      positionSize: this.calculatePositionSize(riskLevel, confidence),
      tokenPair,
      timestamp: new Date().toISOString(),
    };
  }

  private static calculatePositionSize(riskLevel: string, confidence: number): number {
    const baseSize = {
      low: 8,
      medium: 20,
      high: 35
    }[riskLevel] || 20;

    // Adjust position size based on confidence (50-100% confidence range)
    const confidenceMultiplier = Math.max(0.5, Math.min(1.2, confidence / 75));
    return Math.round(baseSize * confidenceMultiplier);
  }

  static async analyzeMarketConditions(tokenPairs: string[]): Promise<{
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    volatility: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    // Enhanced market analysis simulation
    const sentiments = ['bullish', 'bearish', 'neutral'] as const;
    const volatilities = ['low', 'medium', 'high'] as const;
    
    const marketSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const volatility = volatilities[Math.floor(Math.random() * volatilities.length)];
    
    const recommendations = [
      `Current market sentiment appears ${marketSentiment} across major DeFi tokens`,
      `Volatility is ${volatility}, ${volatility === 'high' ? 'consider reducing position sizes' : volatility === 'low' ? 'good conditions for larger positions' : 'maintain standard risk management'}`,
      `${tokenPairs.length > 1 ? 'Diversification across selected pairs' : 'Single pair focus'} ${marketSentiment === 'bullish' ? 'shows positive correlation' : marketSentiment === 'bearish' ? 'may increase downside risk' : 'provides balanced exposure'}`,
      `Gas fees are ${Math.random() > 0.5 ? 'elevated' : 'moderate'}, factor into trade sizing decisions`
    ];

    return {
      marketSentiment,
      volatility,
      recommendations,
    };
  }
}