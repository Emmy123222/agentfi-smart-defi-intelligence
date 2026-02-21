import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { IntegrationService } from './integrationService';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentInsert = Database['public']['Tables']['agents']['Insert'];
type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export interface CreateAgentData {
  name: string;
  strategy: 'trend' | 'momentum' | 'mean-reversion';
  riskLevel: 'low' | 'medium' | 'high';
  allocatedAmount: number;
  tokenPairs?: string[];
  gasSettings?: any;
  slippageTolerance?: number;
}

export class AgentService {
  // Create agent with full integration (database + blockchain + AI)
  static async createAgentWithIntegration(walletAddress: string, data: CreateAgentData): Promise<{ agent: Agent; blockchainTxHash?: string }> {
    return IntegrationService.createAgentWithFullIntegration({
      name: data.name,
      strategy: data.strategy,
      riskLevel: data.riskLevel,
      allocatedAmount: data.allocatedAmount,
      tokenPairs: data.tokenPairs || ['MATIC/USDC', 'ETH/USDC'],
      gasSettings: data.gasSettings || { maxFeePerGas: '30', maxPriorityFeePerGas: '2' },
      slippageTolerance: data.slippageTolerance || 0.5,
      walletAddress: walletAddress
    });
  }

  // Update agent status with blockchain sync
  static async updateAgentStatusWithSync(
    agentId: string, 
    newStatus: 'active' | 'paused' | 'stopped',
    walletAddress: string
  ): Promise<{ dbSuccess: boolean; blockchainTxHash?: string }> {
    return IntegrationService.updateAgentStatusWithSync(agentId, newStatus, walletAddress);
  }

  // Get comprehensive agent data from all sources
  static async getComprehensiveAgentData(agentId: string) {
    return IntegrationService.getComprehensiveAgentData(agentId);
  }
  static async createAgent(walletAddress: string, data: CreateAgentData): Promise<Agent> {
    // First, ensure user profile exists
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: walletAddress,
        total_agents: 0,
        total_balance: 0,
        total_pnl: 0,
      });

    if (profileError) {
      console.warn('Profile upsert warning:', profileError);
    }

    const agentData: AgentInsert = {
      wallet_address: walletAddress,
      name: data.name,
      strategy: data.strategy,
      risk_level: data.riskLevel,
      allocated_amount: data.allocatedAmount,
      status: 'created',
      token_pairs: data.tokenPairs || ['MATIC/USDC', 'ETH/USDC'],
      gas_settings: data.gasSettings || { maxFeePerGas: '30', maxPriorityFeePerGas: '2' },
      slippage_tolerance: data.slippageTolerance || 0.5,
      current_balance: data.allocatedAmount,
      total_pnl: 0,
      total_trades: 0,
      win_rate: 0,
    };

    const { data: agent, error } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create agent: ${error.message}`);
    }

    // Update user profile
    await this.updateUserProfile(walletAddress);

    return agent;
  }

  static async getAgentsByWallet(walletAddress: string): Promise<Agent[]> {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch agents: ${error.message}`);
    }

    return agents || [];
  }

  static async getAgentById(id: string): Promise<Agent | null> {
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }

    return agent;
  }

  static async updateAgentStatus(id: string, status: Agent['status']): Promise<Agent> {
    const { data: agent, error } = await supabase
      .from('agents')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update agent status: ${error.message}`);
    }

    return agent;
  }

  static async updateAgentBalance(id: string, balance: number, pnl: number): Promise<Agent> {
    const { data: agent, error } = await supabase
      .from('agents')
      .update({ 
        current_balance: balance,
        total_pnl: pnl,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update agent balance: ${error.message}`);
    }

    return agent;
  }

  static async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete agent: ${error.message}`);
    }
  }

  private static async updateUserProfile(walletAddress: string): Promise<void> {
    // Get current agents count and totals
    const { data: agents } = await supabase
      .from('agents')
      .select('allocated_amount, total_pnl')
      .eq('wallet_address', walletAddress);

    const totalAgents = agents?.length || 0;
    const totalBalance = agents?.reduce((sum, agent) => sum + agent.allocated_amount, 0) || 0;
    const totalPnL = agents?.reduce((sum, agent) => sum + agent.total_pnl, 0) || 0;

    // Upsert user profile
    await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: walletAddress,
        total_agents: totalAgents,
        total_balance: totalBalance,
        total_pnl: totalPnL,
        updated_at: new Date().toISOString(),
      });
  }
}