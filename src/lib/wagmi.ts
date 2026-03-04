import { http, createConfig } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - replace with your own from https://cloud.walletconnect.com
const projectId = 'agentfi-demo';

export const config = createConfig({
  // Testnet only — polygon mainnet removed to prevent MetaMask defaulting
  // to chain ID 1 and causing ChainMismatchError on writeContract calls.
  chains: [polygonAmoy],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    // Explicit RPC URL required — http() with no args uses a slow public
    // fallback that causes useChainId() to return stale values after a switch.
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}