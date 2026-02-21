// Integration Service - Orchestrates AI, Blockchain, and Database
import { AgentService } from './agentService';
import { SignalService } from './signalService';
import { AIService } from './aiService';
import { BlockchainService } from './blockchainService';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Agent = Database['public']['Tables']['agents']['Row'];
type TradingSignal = Database['public']['Tables']['trading_signals']['Row'];

export interface AgentCreationData {
  name: string;
  strategy: 'trend' | 'momentum' | 'mean-reversion';
  riskLevel: 'low' | 'medium' | 'high';
  allocatedAmount: number;
  tokenPairs: string[];
  gasSettings: any;
  slippageTolerance: number;
  walletAddress: string;
}

export class IntegrationService {
  
  // Complete agent creation flow: Database -> Blockchain -> AI Analysis
  static async createAgentWithFullIntegration(
    agentData: AgentCreationData
  ): Promise<{ agent: Agent; blockchainTxHash?: string }> {
    try {
      console.log('🚀 Starting integrated agent creation...');
      
      // Step 1: Create agent in database
      console.log('📝 Creating agent in database...');
      const agent = await AgentService.createAgent(agentData.walletAddress, {
        name: agentData.name,
        strategy: agentData.strategy,
        riskLevel: agentData.riskLevel,
        allocatedAmount: agentData.allocatedAmount,
        tokenPairs: agentData.tokenPairs,
        gasSettings: agentData.gasSettings,
        slippageTolerance: agentData.slippageTolerance,
      });

      console.log('✅ Agent created in database:', agent.id);

      // Step 2: Register agent on blockchain
      let blockchainTxHash: string | undefined;
      try {
        console.log('⛓️ Registering agent on blockchain...');
        
        // Check if we're on the correct network
        const isCorrectNetwork = await BlockchainService.checkNetwork();
        if (!isCorrectNetwork) {
          console.log('🔄 Switching to Polygon Amoy network...');
          await BlockchainService.switchToAmoyNetwork();
        }

        blockchainTxHash = await BlockchainService.registerAgentOnChain(
          agent, 
          agentData.walletAddress as `0x${string}`
        );
        
        console.log('✅ Agent registered on blockchain:', blockchainTxHash);
        
        // Update agent with blockchain transaction hash
        await supabase
          .from('agents')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', agent.id);

        toast.success('Agent created and registered on blockchain!');
      } catch (blockchainError) {
        console.warn('⚠️ Blockchain registration failed, but agent exists in database:', blockchainError);
        toast.warning('Agent created in database, but blockchain registration failed. You can retry later.');
      }

      // Step 3: Generate initial AI analysis
      try {
        console.log('🤖 Generating initial AI market analysis...');
        await this.generateInitialAnalysis(agent);
        console.log('✅ Initial AI analysis completed');
      } catch (aiError) {
        console.warn('⚠️ Initial AI analysis failed:', aiError);
        toast.warning('Agent created successfully, but initial AI analysis failed.');
      }

      return { agent, blockchainTxHash };
    } catch (error) {
      console.error('❌ Integrated agent creation failed:', error);
      throw new Error(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate and execute trading signal with full integration
  static async generateAndExecuteSignal(
    agentId: string,
    walletAddress: string,
    autoExecute: boolean = false
  ): Promise<{ signal: TradingSignal; executionTxHash?: string }> {
    try {
      console.log('🎯 Starting integrated signal generation and execution...');
      
      // Step 1: Generate AI trading signal
      console.log('🤖 Generating AI trading signal...');
      const signal = await SignalService.generateSignalForAgent(agentId);
      console.log('✅ AI signal generated:', signal.signal_type);

      // Step 2: Execute signal on blockchain (if auto-execute is enabled)
      let executionTxHash: string | undefined;
      if (autoExecute && signal.signal_type !== 'HOLD') {
        try {
          console.log('⛓️ Attempting to execute signal on blockchain...');
          
          // Check if wallet is connected first
          const connectedAccount = await BlockchainService.getConnectedAccount();
          if (!connectedAccount) {
            console.warn('⚠️ Wallet not connected, skipping blockchain execution');
            toast.warning('Signal generated! Connect wallet to enable blockchain execution.');
            return { signal };
          }

          if (connectedAccount.toLowerCase() !== walletAddress.toLowerCase()) {
            console.warn('⚠️ Wallet address mismatch, skipping blockchain execution');
            toast.warning('Signal generated! Wallet address mismatch - please reconnect.');
            return { signal };
          }

          // Check network
          const isCorrectNetwork = await BlockchainService.checkNetwork();
          if (!isCorrectNetwork) {
            console.log('🔄 Switching to Polygon Amoy network...');
            await BlockchainService.switchToAmoyNetwork();
          }

          executionTxHash = await BlockchainService.executeSignalOnChain(
            signal,
            walletAddress as `0x${string}`
          );
          
          console.log('✅ Signal executed on blockchain:', executionTxHash);
          
          // Update signal as executed
          await SignalService.executeSignal(
            signal.id,
            1.0, // Mock execution price
            21000, // Mock gas used
            executionTxHash
          );

          toast.success(`${signal.signal_type} signal executed on blockchain! 🚀`);
        } catch (executionError) {
          console.warn('⚠️ Signal execution failed:', executionError);
          const errorMessage = executionError instanceof Error ? executionError.message : 'Unknown error';
          
          if (errorMessage.includes('Connect EVM') || errorMessage.includes('Wallet not connected')) {
            toast.warning('Signal generated! Please connect your wallet to enable blockchain execution.');
          } else if (errorMessage.includes('network') || errorMessage.includes('chain')) {
            toast.warning('Signal generated! Please switch to Polygon Amoy network for blockchain execution.');
          } else {
            toast.warning(`Signal generated! Blockchain execution failed: ${errorMessage}`);
          }
        }
      }

      // Step 3: Update agent status and performance
      await this.updateAgentPerformance(agentId, signal);

      return { signal, executionTxHash };
    } catch (error) {
      console.error('❌ Integrated signal generation failed:', error);
      throw new Error(`Failed to generate signal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update agent status with blockchain sync
  static async updateAgentStatusWithSync(
    agentId: string,
    newStatus: 'active' | 'paused' | 'stopped',
    walletAddress: string
  ): Promise<{ dbSuccess: boolean; blockchainTxHash?: string }> {
    try {
      console.log('🔄 Updating agent status with blockchain sync...');
      
      // Step 1: Update in database
      console.log('📝 Updating status in database...');
      await AgentService.updateAgentStatus(agentId, newStatus);
      console.log('✅ Database status updated');

      // Step 2: Update on blockchain
      let blockchainTxHash: string | undefined;
      try {
        console.log('⛓️ Updating status on blockchain...');
        
        const isCorrectNetwork = await BlockchainService.checkNetwork();
        if (!isCorrectNetwork) {
          await BlockchainService.switchToAmoyNetwork();
        }

        blockchainTxHash = await BlockchainService.updateAgentStatusOnChain(
          agentId,
          newStatus,
          walletAddress as `0x${string}`
        );
        
        console.log('✅ Blockchain status updated:', blockchainTxHash);
        toast.success('Agent status updated on blockchain!');
      } catch (blockchainError) {
        console.warn('⚠️ Blockchain status update failed:', blockchainError);
        toast.warning('Status updated in database, but blockchain sync failed.');
      }

      return { dbSuccess: true, blockchainTxHash };
    } catch (error) {
      console.error('❌ Status update failed:', error);
      throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get comprehensive agent data from all sources
  static async getComprehensiveAgentData(agentId: string) {
    try {
      console.log('📊 Fetching comprehensive agent data...');
      
      // Get data from database
      const [agent, signals] = await Promise.all([
        AgentService.getAgentById(agentId),
        SignalService.getSignalsByAgent(agentId, 10)
      ]);

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Try to get blockchain data
      let blockchainData = null;
      try {
        blockchainData = await BlockchainService.getAgentFromChain(agentId);
      } catch (error) {
        console.warn('Could not fetch blockchain data:', error);
      }

      // Get AI market analysis
      let marketAnalysis = null;
      try {
        marketAnalysis = await AIService.analyzeMarketConditions(agent.token_pairs);
      } catch (error) {
        console.warn('Could not fetch market analysis:', error);
      }

      return {
        agent,
        signals,
        blockchainData,
        marketAnalysis,
        isBlockchainSynced: !!blockchainData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to fetch comprehensive data:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async generateInitialAnalysis(agent: Agent): Promise<void> {
    try {
      // Generate initial market analysis for the agent's token pairs
      const analysis = await AIService.analyzeMarketConditions(agent.token_pairs);
      
      // Store analysis in database (you might want to create a market_analysis table)
      console.log('Initial market analysis:', analysis);
      
      // Optionally generate first signal
      if (agent.status === 'active') {
        await SignalService.generateSignalForAgent(agent.id);
      }
    } catch (error) {
      console.error('Initial analysis failed:', error);
      throw error;
    }
  }

  private static async updateAgentPerformance(agentId: string, signal: TradingSignal): Promise<void> {
    try {
      // Update agent's last signal timestamp
      await supabase
        .from('agents')
        .update({ 
          last_signal_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId);

      // You could also update performance metrics here
      console.log('Agent performance updated');
    } catch (error) {
      console.error('Failed to update agent performance:', error);
    }
  }

  // Health check for all systems
  static async systemHealthCheck(): Promise<{
    database: boolean;
    ai: boolean;
    blockchain: boolean;
    overall: boolean;
  }> {
    const health = {
      database: false,
      ai: false,
      blockchain: false,
      overall: false
    };

    try {
      // Check database
      const { error: dbError } = await supabase.from('agents').select('id').limit(1);
      health.database = !dbError;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    try {
      // Check AI service
      await AIService.analyzeMarketConditions(['MATIC/USDC']);
      health.ai = true;
    } catch (error) {
      console.error('AI health check failed:', error);
    }

    try {
      // Check blockchain
      health.blockchain = await BlockchainService.checkNetwork();
    } catch (error) {
      console.error('Blockchain health check failed:', error);
    }

    health.overall = health.database && health.ai && health.blockchain;
    
    console.log('System health check:', health);
    return health;
  }
}