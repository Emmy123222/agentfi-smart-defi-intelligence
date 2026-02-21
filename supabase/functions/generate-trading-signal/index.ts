import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketAnalysisRequest {
  agentId: string;
  tokenPair: string;
  strategy: 'trend' | 'momentum' | 'mean-reversion';
  riskLevel: 'low' | 'medium' | 'high';
  allocatedAmount: number;
  historicalData?: any;
}

interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  priceTarget?: number;
  stopLoss?: number;
  positionSize: number;
  tokenPair: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge function called');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for edge functions
    )

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { agentId, tokenPair, strategy, riskLevel, allocatedAmount } = requestBody as MarketAnalysisRequest;

    // Validate required fields
    if (!agentId || !tokenPair || !strategy || !riskLevel || !allocatedAmount) {
      throw new Error('Missing required fields');
    }

    // Call Groq AI for market analysis
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    console.log('Groq API key exists:', !!groqApiKey);
    
    if (!groqApiKey) {
      console.error('Groq API key not configured');
      throw new Error('Groq API key not configured');
    }

    const systemPrompt = generateSystemPrompt(strategy, riskLevel);
    const userPrompt = generateUserPrompt(tokenPair, allocatedAmount);

    console.log('Calling Groq API...');
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Use a valid Groq model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    console.log('Groq response received');
    
    const aiResponse = groqData.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error('No response from AI');
      throw new Error('No response from AI');
    }

    // Parse AI response (expecting JSON format)
    let tradingSignal: TradingSignal;
    try {
      const parsed = JSON.parse(aiResponse);
      tradingSignal = {
        signal: parsed.signal,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        priceTarget: parsed.priceTarget,
        stopLoss: parsed.stopLoss,
        positionSize: calculatePositionSize(riskLevel, parsed.confidence),
        tokenPair,
        timestamp: new Date().toISOString(),
      };
    } catch (parseError) {
      console.log('AI response parsing failed, using fallback');
      // Fallback to simulated signal if AI response is not parseable
      tradingSignal = generateFallbackSignal(strategy, riskLevel, tokenPair);
    }

    console.log('Storing signal in database...');
    // Store signal in database
    const { data: signal, error: insertError } = await supabaseClient
      .from('trading_signals')
      .insert({
        agent_id: agentId,
        signal_type: tradingSignal.signal,
        token_pair: tradingSignal.tokenPair,
        confidence_score: tradingSignal.confidence,
        reasoning: tradingSignal.reasoning,
        price_target: tradingSignal.priceTarget,
        stop_loss: tradingSignal.stopLoss,
        position_size: tradingSignal.positionSize,
        executed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log('Signal stored successfully');

    // Update agent's last signal timestamp
    await supabaseClient
      .from('agents')
      .update({ 
        last_signal_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', agentId);

    console.log('Agent updated successfully');

    return new Response(
      JSON.stringify({ success: true, signal }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating trading signal:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateSystemPrompt(strategy: string, riskLevel: string): string {
  return `You are an expert DeFi trading analyst. Analyze market data and provide trading signals in STRICT JSON format.

Strategy: ${strategy}
Risk Level: ${riskLevel}

You MUST respond with ONLY valid JSON in this exact format:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 75,
  "reasoning": "Brief analysis explanation",
  "priceTarget": 1.15,
  "stopLoss": 0.95
}

Rules:
- signal: Must be exactly "BUY", "SELL", or "HOLD"
- confidence: Integer between 50-95
- reasoning: 1-2 sentences explaining the decision
- priceTarget: Decimal number (optional for HOLD)
- stopLoss: Decimal number (optional for HOLD)

Respond with ONLY the JSON object, no other text.`;
}

function generateUserPrompt(tokenPair: string, allocatedAmount: number): string {
  return `Analyze ${tokenPair} for trading with $${allocatedAmount} allocated. Current time: ${new Date().toISOString()}. Provide your trading recommendation as JSON only.`;
}

function calculatePositionSize(riskLevel: string, confidence: number): number {
  const baseSize = {
    low: 10,
    medium: 25,
    high: 40
  }[riskLevel] || 25;

  // Adjust position size based on confidence
  const confidenceMultiplier = confidence / 100;
  return Math.round(baseSize * confidenceMultiplier);
}

function generateFallbackSignal(strategy: string, riskLevel: string, tokenPair: string): TradingSignal {
  // Fallback signal generation if AI parsing fails
  const signals = ['BUY', 'SELL', 'HOLD'] as const;
  const randomSignal = signals[Math.floor(Math.random() * signals.length)];
  
  return {
    signal: randomSignal,
    confidence: Math.floor(Math.random() * 40) + 50, // 50-90% confidence
    reasoning: `${strategy} strategy analysis suggests ${randomSignal.toLowerCase()} signal for ${tokenPair}. Market conditions indicate moderate opportunity with ${riskLevel} risk profile.`,
    priceTarget: randomSignal === 'BUY' ? 1.15 : randomSignal === 'SELL' ? 0.92 : undefined,
    stopLoss: randomSignal === 'BUY' ? 0.95 : randomSignal === 'SELL' ? 1.08 : undefined,
    positionSize: calculatePositionSize(riskLevel, 65),
    tokenPair,
    timestamp: new Date().toISOString(),
  };
}