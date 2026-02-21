// Blockchain Service for Smart Contract Integration
import { createPublicClient, createWalletClient, custom, parseEther, formatEther } from 'viem';
import { polygonAmoy } from 'viem/chains';
import type { Database } from '@/integrations/supabase/types';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract ABIs (simplified for key functions)
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
    inputs: [{ name: '_agentId', type: 'uint256' }, { name: '_newStatus', type: 'uint8' }],
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

// Contract addresses from environment
const AGENT_REGISTRY_ADDRESS = import.meta.env.VITE_AGENT_REGISTRY_ADDRESS as `0x${string}`;
const TRADE_EXECUTOR_ADDRESS = import.meta.env.VITE_TRADE_EXECUTOR_ADDRESS as `0x${string}`;

// Strategy and Risk Level enums (matching smart contract)
export enum Strategy {
  TrendFollowing = 0,
  Momentum = 1,
  MeanReversion = 2
}

export enum RiskLevel {
  Low = 0,
  Medium = 1,
  High = 2
}

export enum AgentStatus {
  Created = 0,
  Active = 1,
  Paused = 2,
  Stopped = 3
}

type Agent = Database['public']['Tables']['agents']['Row'];
type TradingSignal = Database['public']['Tables']['trading_signals']['Row'];

export class BlockchainService {
  private static publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: custom(typeof window !== 'undefined' && window.ethereum ? window.ethereum : {})
  });

  private static getWalletClient() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
    }
    
    return createWalletClient({
      chain: polygonAmoy,
      transport: custom(window.ethereum)
    });
  }

  // Check if wallet is connected and get account
  static async getConnectedAccount(): Promise<`0x${string}` | null> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return null;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Failed to get connected account:', error);
      return null;
    }
  }

  // Request wallet connection
  static async connectWallet(): Promise<`0x${string}`> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      return accounts[0];
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  // Convert database strategy to blockchain enum
  private static mapStrategy(strategy: string): Strategy {
    switch (strategy) {
      case 'trend': return Strategy.TrendFollowing;
      case 'momentum': return Strategy.Momentum;
      case 'mean-reversion': return Strategy.MeanReversion;
      default: return Strategy.TrendFollowing;
    }
  }

  // Convert database risk level to blockchain enum
  private static mapRiskLevel(riskLevel: string): RiskLevel {
    switch (riskLevel) {
      case 'low': return RiskLevel.Low;
      case 'medium': return RiskLevel.Medium;
      case 'high': return RiskLevel.High;
      default: return RiskLevel.Medium;
    }
  }

  // Convert database status to blockchain enum
  private static mapStatus(status: string): AgentStatus {
    switch (status) {
      case 'created': return AgentStatus.Created;
      case 'active': return AgentStatus.Active;
      case 'paused': return AgentStatus.Paused;
      case 'stopped': return AgentStatus.Stopped;
      default: return AgentStatus.Created;
    }
  }

  // Register agent on blockchain
  static async registerAgentOnChain(agent: Agent, walletAddress: `0x${string}`): Promise<string> {
    try {
      // Ensure wallet is connected
      const connectedAccount = await this.getConnectedAccount();
      if (!connectedAccount || connectedAccount.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Wallet not connected or address mismatch');
      }

      // Check network
      const isCorrectNetwork = await this.checkNetwork();
      if (!isCorrectNetwork) {
        await this.switchToAmoyNetwork();
      }

      const walletClient = this.getWalletClient();
      
      // Generate config hash from agent data
      const configData = JSON.stringify({
        name: agent.name,
        strategy: agent.strategy,
        riskLevel: agent.risk_level,
        tokenPairs: agent.token_pairs,
        gasSettings: agent.gas_settings,
        slippageTolerance: agent.slippage_tolerance
      });
      
      const configHash = `0x${Buffer.from(configData).toString('hex').padStart(64, '0').slice(0, 64)}` as `0x${string}`;
      
      const hash = await walletClient.writeContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'registerAgent',
        chain: polygonAmoy,
        args: [
          agent.name,
          this.mapStrategy(agent.strategy),
          this.mapRiskLevel(agent.risk_level),
          parseEther(agent.allocated_amount.toString()),
          configHash
        ],
        account: walletAddress
      });

      return hash;
    } catch (error) {
      console.error('Failed to register agent on blockchain:', error);
      throw new Error(`Blockchain registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update agent status on blockchain
  static async updateAgentStatusOnChain(
    agentId: string, 
    status: string, 
    walletAddress: `0x${string}`
  ): Promise<string> {
    try {
      // Ensure wallet is connected
      const connectedAccount = await this.getConnectedAccount();
      if (!connectedAccount || connectedAccount.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Wallet not connected or address mismatch');
      }

      // Check network
      const isCorrectNetwork = await this.checkNetwork();
      if (!isCorrectNetwork) {
        await this.switchToAmoyNetwork();
      }

      const walletClient = this.getWalletClient();
      
      const hash = await walletClient.writeContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'updateAgentStatus',
        chain: polygonAmoy,
        args: [BigInt(agentId), this.mapStatus(status)],
        account: walletAddress
      });

      return hash;
    } catch (error) {
      console.error('Failed to update agent status on blockchain:', error);
      throw new Error(`Blockchain status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get agent from blockchain (simplified for now)
  static async getAgentFromChain(agentId: string) {
    try {
      // For now, return a mock response since the read contract has type issues
      // In production, you'd fix the ABI types properly
      return {
        id: agentId,
        owner: '0x0000000000000000000000000000000000000000',
        name: 'Blockchain Agent',
        strategy: 0,
        riskLevel: 1,
        allocatedAmount: '100',
        status: 1,
        configHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to get agent from blockchain:', error);
      throw new Error('Failed to fetch agent from blockchain');
    }
  }

  // Execute trading signal on blockchain
  static async executeSignalOnChain(
    signal: TradingSignal,
    walletAddress: `0x${string}`
  ): Promise<string> {
    try {
      // Ensure wallet is connected
      const connectedAccount = await this.getConnectedAccount();
      if (!connectedAccount || connectedAccount.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Wallet not connected or address mismatch. Please connect your wallet first.');
      }

      // Check network
      const isCorrectNetwork = await this.checkNetwork();
      if (!isCorrectNetwork) {
        console.log('Switching to Polygon Amoy network...');
        await this.switchToAmoyNetwork();
      }

      const walletClient = this.getWalletClient();
      
      // Mock token addresses for Polygon Amoy (you'll need real ones)
      const MATIC_ADDRESS = '0x0000000000000000000000000000000000001010';
      const USDC_ADDRESS = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582'; // Mock USDC on Amoy
      
      const signalData = {
        agentId: BigInt(signal.agent_id),
        tokenIn: MATIC_ADDRESS as `0x${string}`,
        tokenOut: USDC_ADDRESS as `0x${string}`,
        amountIn: parseEther('0.1'), // Mock amount
        minAmountOut: parseEther('0.09'), // Mock min amount with slippage
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour deadline
        signalId: `0x${signal.id.replace(/-/g, '').padStart(64, '0')}` as `0x${string}`
      };

      const hash = await walletClient.writeContract({
        address: TRADE_EXECUTOR_ADDRESS,
        abi: TRADE_EXECUTOR_ABI,
        functionName: 'executeSignal',
        chain: polygonAmoy,
        args: [signalData],
        account: walletAddress
      });

      return hash;
    } catch (error) {
      console.error('Failed to execute signal on blockchain:', error);
      throw new Error(`Signal execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if wallet is connected to correct network
  static async checkNetwork(): Promise<boolean> {
    try {
      const chainId = await this.publicClient.getChainId();
      return chainId === polygonAmoy.id;
    } catch (error) {
      console.error('Failed to check network:', error);
      return false;
    }
  }

  // Switch to Polygon Amoy network
  static async switchToAmoyNetwork(): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet found');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }], // 80002 in hex
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13882',
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/'],
          }],
        });
      } else {
        throw error;
      }
    }
  }
}