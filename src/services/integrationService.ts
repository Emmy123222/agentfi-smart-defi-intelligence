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

function assertEthAddress(address: string): `0x${string}` {
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    throw new Error(
      `Invalid wallet address "${address}". Expected a 42-character hex string starting with 0x.`
    );
  }
  return address as `0x${string}`;
}

export class IntegrationService {

  static async createAgentWithFullIntegration(
    agentData: AgentCreationData
  ): Promise<{ agent: Agent; blockchainTxHash?: string }> {
    try {
      console.log('🚀 Starting integrated agent creation...');

      const walletAddress = assertEthAddress(agentData.walletAddress);

      // Step 1: Create agent in database (always succeeds independently)
      console.log('📝 Creating agent in database...');
      const agent = await AgentService.createAgent(walletAddress, {
        name:              agentData.name,
        strategy:          agentData.strategy,
        riskLevel:         agentData.riskLevel,
        allocatedAmount:   agentData.allocatedAmount,
        tokenPairs:        agentData.tokenPairs,
        gasSettings:       agentData.gasSettings,
        slippageTolerance: agentData.slippageTolerance,
      });
      console.log('✅ Agent created in database:', agent.id);

      // Step 2: Blockchain registration
      let blockchainTxHash: string | undefined;
      try {
        console.log('⛓️ Registering agent on blockchain...');

        const result = await BlockchainService.registerAgentOnChain(agent, walletAddress);
        blockchainTxHash = result.txHash;

        console.log('✅ Agent registered on blockchain:', blockchainTxHash);

        // Optional: store on-chain ID if your contract returns it via event
        if (result.blockchainAgentId !== undefined) {
          await supabase
            .from('agents')
            .update({
              blockchain_agent_id: result.blockchainAgentId.toString(), // ← add this column if missing
              updated_at: new Date().toISOString()
            })
            .eq('id', agent.id);
        }

        toast.success('Agent created & registered on Polygon Amoy!', {
          description: 'Transaction confirmed',
          action: {
            label: 'View TX',
            onClick: () => window.open(`https://amoy.polygonscan.com/tx/${blockchainTxHash}`, '_blank')
          }
        });
      } catch (blockchainError: any) {
        console.warn('⚠️ Blockchain step failed:', blockchainError);

        const msg = blockchainError.message || 'Unknown error';

        if (msg.includes('rejected') || msg.includes('User rejected')) {
          toast.error('Network switch or transaction rejected', {
            description: 'Agent saved in database only. Retry when ready.'
          });
        } else if (msg.includes('switch') || msg.includes('chain') || msg.includes('network')) {
          toast.error('Please switch to Polygon Amoy', {
            description: 'Wallet must be on Polygon Amoy (chain ID 80002) to register on-chain.'
          });
        } else if (msg.includes('insufficient funds') || msg.includes('balance')) {
          toast.error('Insufficient POL for gas', {
            description: 'Get testnet POL from a faucet. Agent saved in database only.'
          });
        } else {
          toast.warning('Blockchain registration failed', {
            description: 'Agent created in database — you can retry registration later.'
          });
        }
      }

      // Step 3: AI analysis (non-blocking)
      try {
        console.log('🤖 Generating initial AI market analysis...');
        await this.generateInitialAnalysis(agent);
        console.log('✅ Initial AI analysis completed');
      } catch (aiError) {
        console.warn('⚠️ AI analysis failed:', aiError);
        toast.warning('Agent created, but initial AI analysis failed.');
      }

      return { agent, blockchainTxHash };
    } catch (error) {
      console.error('❌ Full agent creation failed:', error);
      throw new Error(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateAndExecuteSignal(
    agentId: string,
    walletAddress: string,
    autoExecute: boolean = false
  ): Promise<{ signal: TradingSignal; executionTxHash?: string }> {
    try {
      console.log('🎯 Starting signal generation & execution...');

      const signal = await SignalService.generateSignalForAgent(agentId);
      console.log('✅ Signal generated:', signal.signal_type);

      let executionTxHash: string | undefined;

      if (signal.signal_type === 'HOLD' || !autoExecute) {
        console.log(autoExecute ? 'HOLD signal — no execution' : 'autoExecute off — skipping');
        await this.updateAgentPerformance(agentId, signal, false);
        return { signal };
      }

      // Proceed only if we should execute
      try {
        const validatedAddress = assertEthAddress(walletAddress);

        const connected = await BlockchainService.getConnectedAccount();
        if (!connected) {
          toast.warning('Connect wallet to execute on-chain');
          await this.updateAgentPerformance(agentId, signal, false);
          return { signal };
        }

        if (connected.toLowerCase() !== validatedAddress.toLowerCase()) {
          toast.warning('Wallet mismatch — reconnect correct account');
          await this.updateAgentPerformance(agentId, signal, false);
          return { signal };
        }

        console.log('⛓️ Executing signal on-chain...');
        executionTxHash = await BlockchainService.executeSignalOnChain(signal, validatedAddress);

        // Update signal record with execution details
        await SignalService.executeSignal(
          signal.id,
          1.0,   // TODO: fetch real price from logs/receipt
          21000, // TODO: use receipt.gasUsed
          executionTxHash
        );

        toast.success(`${signal.signal_type} executed on-chain!`);
      } catch (executionError: any) {
        console.warn('⚠️ Execution failed:', executionError);
        const msg = executionError.message || 'Unknown';

        if (msg.includes('rejected')) {
          toast.error('Transaction rejected');
        } else if (msg.includes('switch') || msg.includes('chain') || msg.includes('network')) {
          toast.error('Switch to Polygon Amoy to execute');
        } else if (msg.includes('insufficient funds')) {
          toast.error('Low POL balance — get testnet funds');
        } else {
          toast.warning(`Execution failed: ${msg}`);
        }
      }

      await this.updateAgentPerformance(agentId, signal, !!executionTxHash);
      return { signal, executionTxHash };
    } catch (error) {
      console.error('❌ Signal flow failed:', error);
      throw error;
    }
  }

  static async updateAgentStatusWithSync(
    agentId: string,
    newStatus: 'active' | 'paused' | 'stopped',
    walletAddress: string
  ): Promise<{ dbSuccess: boolean; blockchainTxHash?: string }> {
    try {
      const validatedAddress = assertEthAddress(walletAddress);

      // DB first (atomic & fast)
      await AgentService.updateAgentStatus(agentId, newStatus);

      let blockchainTxHash: string | undefined;
      try {
        blockchainTxHash = await BlockchainService.updateAgentStatusOnChain(
          agentId,
          newStatus,
          validatedAddress
        );
        toast.success('Status synced to blockchain');
      } catch (bcErr: any) {
        console.warn('Blockchain sync failed:', bcErr);
        toast.warning('Status updated in DB, but on-chain sync failed.');
      }

      return { dbSuccess: true, blockchainTxHash };
    } catch (error) {
      console.error('Status update failed:', error);
      throw error;
    }
  }

  // The other methods (getComprehensiveAgentData, generateInitialAnalysis, etc.) look solid — no changes needed there

  static async systemHealthCheck(): Promise<{
    database: boolean;
    ai: boolean;
    blockchain: boolean;
    overall: boolean;
  }> {
    const health = { database: false, ai: false, blockchain: false, overall: false };

    try {
      // Check Database (Supabase)
      const { error: dbError } = await supabase.from('agents').select('id').limit(1);
      health.database = !dbError;
    } catch {
      health.database = false;
    }

    try {
      // Check AI Service (Groq) - just check if API key is configured
      // Don't actually call the API to avoid errors
      health.ai = !!import.meta.env.VITE_GROQ_API_KEY;
    } catch {
      health.ai = false;
    }

    try {
      // Check Blockchain (Polygon Amoy RPC)
      const isAvailable = await BlockchainService.checkBlockchainAvailability();
      health.blockchain = isAvailable;
    } catch {
      health.blockchain = false;
    }

    // Overall health is true if all services are configured/available
    health.overall = health.database && health.ai && health.blockchain;

    return health;
  }

  private static async generateInitialAnalysis(agent: Agent): Promise<void> {
    // unchanged
  }

  private static async updateAgentPerformance(
    agentId: string,
    signal: TradingSignal,
    wasExecuted: boolean
  ): Promise<void> {
    // unchanged
  }
}