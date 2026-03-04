// Blockchain Service for Smart Contract Integration
import {
  createPublicClient,
  parseEther,
  formatEther,
  http,
  keccak256,
  toBytes
} from 'viem';
import { polygonAmoy } from 'viem/chains';
import { getWalletClient } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import type { Database } from '@/integrations/supabase/types';

declare global {
  interface Window { ethereum?: any; }
}

const AGENT_REGISTRY_ABI = [
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_strategy', type: 'uint8' },
      { name: '_riskLevel', type: 'uint8' },
      { name: '_allocatedAmount', type: 'uint256' },
      { name: '_configHash', type: 'bytes32' }
    ],
    name: 'registerAgent',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_agentId', type: 'uint256' },
      { name: '_newStatus', type: 'uint8' }
    ],
    name: 'updateAgentStatus',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_agentId', type: 'uint256' }],
    name: 'getAgent',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'strategy', type: 'uint8' },
          { name: 'riskLevel', type: 'uint8' },
          { name: 'allocatedAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'configHash', type: 'bytes32' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' }
        ],
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const TRADE_EXECUTOR_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'agentId', type: 'uint256' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'minAmountOut', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'signalId', type: 'bytes32' }
        ],
        name: '_signal',
        type: 'tuple'
      }
    ],
    name: 'executeSignal',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

const AGENT_REGISTRY_ADDRESS = import.meta.env.VITE_AGENT_REGISTRY_ADDRESS as `0x${string}`;
const TRADE_EXECUTOR_ADDRESS  = import.meta.env.VITE_TRADE_EXECUTOR_ADDRESS  as `0x${string}`;
const AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology';

export enum Strategy    { TrendFollowing = 0, Momentum = 1, MeanReversion = 2 }
export enum RiskLevel   { Low = 0, Medium = 1, High = 2 }
export enum AgentStatus { Created = 0, Active = 1, Paused = 2, Stopped = 3 }

type Agent         = Database['public']['Tables']['agents']['Row'];
type TradingSignal = Database['public']['Tables']['trading_signals']['Row'];

interface BlockchainAgent {
  id: bigint;
  owner: `0x${string}`;
  name: string;
  strategy: number;
  riskLevel: number;
  allocatedAmount: bigint;
  status: number;
  configHash: `0x${string}`;
  createdAt: bigint;
  updatedAt: bigint;
}

export class BlockchainService {

  /** HTTP transport for reads — never depends on wallet chain state. */
  private static getPublicClient() {
    return createPublicClient({
      chain: polygonAmoy,
      transport: http(AMOY_RPC_URL)
    });
  }

  /**
   * Wallet client for writes.
   * Uses wagmi to get the active wallet client (supports Injected, WalletConnect, etc.)
   */
  private static async getWalletClient() {
    return await getWalletClient(config, { chainId: polygonAmoy.id });
  }

  private static mapStrategy(s: string): Strategy {
    if (s === 'trend')          return Strategy.TrendFollowing;
    if (s === 'momentum')       return Strategy.Momentum;
    if (s === 'mean-reversion') return Strategy.MeanReversion;
    return Strategy.TrendFollowing;
  }

  private static mapRiskLevel(r: string): RiskLevel {
    if (r === 'low')  return RiskLevel.Low;
    if (r === 'high') return RiskLevel.High;
    return RiskLevel.Medium;
  }

  private static mapStatus(s: string): AgentStatus {
    if (s === 'active')  return AgentStatus.Active;
    if (s === 'paused')  return AgentStatus.Paused;
    if (s === 'stopped') return AgentStatus.Stopped;
    return AgentStatus.Created;
  }

  private static uuidToBigInt(uuid: string): bigint {
    return BigInt(keccak256(toBytes(uuid)));
  }

  // ─── Public read helpers ──────────────────────────────────────────────────

  static async getConnectedAccount(): Promise<`0x${string}` | null> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return null;
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0 ? accounts[0] : null;
    } catch {
      return null;
    }
  }

  static async connectWallet(): Promise<`0x${string}`> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask.');
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length === 0) throw new Error('No accounts found. Please connect your wallet.');
    return accounts[0];
  }

  static async checkBlockchainAvailability(): Promise<boolean> {
    try {
      const block = await this.getPublicClient().getBlockNumber();
      console.log('✅ RPC accessible. Latest block:', block.toString());
      return block > 0n;
    } catch (error) {
      console.error('❌ Blockchain RPC check failed:', error);
      return false;
    }
  }

  // ─── Contract writes ──────────────────────────────────────────────────────

  static async registerAgentOnChain(
    agent: Agent,
    walletAddress: `0x${string}`
  ): Promise<{ txHash: string; blockchainAgentId?: bigint }> {
    try {
      console.log('🔗 Registering agent on-chain:', agent.name);

      if (!walletAddress || walletAddress === '0x') {
        throw new Error('Wallet address is required.');
      }
      const walletClient = await this.getWalletClient();

      const configHash = keccak256(toBytes(JSON.stringify({
        name:              agent.name,
        strategy:          agent.strategy,
        riskLevel:         agent.risk_level,
        tokenPairs:        agent.token_pairs,
        gasSettings:       agent.gas_settings,
        slippageTolerance: agent.slippage_tolerance
      })));

      console.log('📝 Sending registerAgent transaction to:', AGENT_REGISTRY_ADDRESS);

      const hash = await walletClient.writeContract({
        address:      AGENT_REGISTRY_ADDRESS,
        abi:          AGENT_REGISTRY_ABI,
        functionName: 'registerAgent',
        chain:        polygonAmoy,
        args: [
          agent.name,
          this.mapStrategy(agent.strategy),
          this.mapRiskLevel(agent.risk_level),
          parseEther(agent.allocated_amount.toString()),
          configHash
        ],
        account: walletAddress
      });

      console.log('✅ TX sent:', hash);
      console.log('🔍 https://amoy.polygonscan.com/tx/' + hash);

      const receipt = await this.getPublicClient().waitForTransactionReceipt({ hash });
      console.log('✅ Confirmed. Block:', receipt.blockNumber);

      let blockchainAgentId: bigint | undefined;
      if (receipt.logs?.length > 0) {
        console.log('📋 Logs:', receipt.logs);
        // TODO: decode AgentRegistered event to extract on-chain agent ID
      }

      return { txHash: hash, blockchainAgentId };
    } catch (error: any) {
      console.error('❌ registerAgentOnChain failed:', error);
      if (error.message?.includes('User rejected'))     throw new Error('Transaction rejected by user');
      if (error.message?.includes('insufficient funds')) throw new Error('Insufficient MATIC balance');
      if (error.message?.includes('Wrong network'))     throw error; // Pass through our custom error
      throw new Error(`Blockchain registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateAgentStatusOnChain(
    agentId: string,
    status: string,
    walletAddress: `0x${string}`
  ): Promise<string> {
    try {
      console.log('🔗 Updating agent status on-chain. ID:', agentId, 'Status:', status);

      if (!walletAddress || walletAddress === '0x') throw new Error('Wallet address is required.');
      const walletClient = await this.getWalletClient();
      const blockchainId = this.uuidToBigInt(agentId);

      const hash = await walletClient.writeContract({
        address:      AGENT_REGISTRY_ADDRESS,
        abi:          AGENT_REGISTRY_ABI,
        functionName: 'updateAgentStatus',
        chain:        polygonAmoy,
        args:         [blockchainId, this.mapStatus(status)],
        account:      walletAddress
      });

      console.log('✅ TX sent:', hash);
      const receipt = await this.getPublicClient().waitForTransactionReceipt({ hash });
      console.log('✅ Confirmed. Block:', receipt.blockNumber);
      return hash;
    } catch (error: any) {
      console.error('❌ updateAgentStatusOnChain failed:', error);
      if (error.message?.includes('User rejected'))     throw new Error('Transaction rejected by user');
      if (error.message?.includes('insufficient funds')) throw new Error('Insufficient MATIC balance');
      throw new Error(`Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async executeSignalOnChain(
    signal: TradingSignal,
    walletAddress: `0x${string}`
  ): Promise<string> {
    try {
      console.log('🔗 Executing signal on-chain:', signal.id);

      if (!walletAddress || walletAddress === '0x') throw new Error('Wallet address is required.');
      const walletClient = await this.getWalletClient();

      const MATIC_ADDRESS = '0x0000000000000000000000000000000000001010';
      const USDC_ADDRESS  = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';

      const hash = await walletClient.writeContract({
        address:      TRADE_EXECUTOR_ADDRESS,
        abi:          TRADE_EXECUTOR_ABI,
        functionName: 'executeSignal',
        chain:        polygonAmoy,
        args: [{
          agentId:      this.uuidToBigInt(signal.agent_id),
          tokenIn:      MATIC_ADDRESS as `0x${string}`,
          tokenOut:     USDC_ADDRESS  as `0x${string}`,
          amountIn:     parseEther('0.1'),
          minAmountOut: parseEther('0.09'),
          deadline:     BigInt(Math.floor(Date.now() / 1000) + 3600),
          signalId:     keccak256(toBytes(signal.id))
        }],
        account: walletAddress
      });

      console.log('✅ TX sent:', hash);
      const receipt = await this.getPublicClient().waitForTransactionReceipt({ hash });
      console.log('✅ Confirmed. Block:', receipt.blockNumber);
      return hash;
    } catch (error: any) {
      console.error('❌ executeSignalOnChain failed:', error);
      if (error.message?.includes('User rejected'))     throw new Error('Transaction rejected by user');
      if (error.message?.includes('insufficient funds')) throw new Error('Insufficient MATIC balance');
      throw new Error(`Signal execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAgentFromChain(agentId: string) {
    try {
      console.log('📖 Reading agent from blockchain. ID:', agentId);
      
      const publicClient = this.getPublicClient();
      const blockchainId = this.uuidToBigInt(agentId);

      const result = await publicClient.readContract({
        address:      AGENT_REGISTRY_ADDRESS,
        abi:          AGENT_REGISTRY_ABI,
        functionName: 'getAgent',
        args:         [blockchainId]
      } as any) as BlockchainAgent;

      console.log('✅ Agent data from blockchain:', result);

      return {
        id:              agentId,
        owner:           result.owner,
        name:            result.name,
        strategy:        result.strategy,
        riskLevel:       result.riskLevel,
        allocatedAmount: formatEther(result.allocatedAmount),
        status:          result.status,
        configHash:      result.configHash,
        createdAt:       new Date(Number(result.createdAt) * 1000),
        updatedAt:       new Date(Number(result.updatedAt) * 1000)
      };
    } catch (error) {
      console.error('❌ Failed to read agent from blockchain:', error);
      throw new Error(`Failed to read agent from blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
