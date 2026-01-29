import { http, createConfig } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - users can replace with their own
const projectId = 'agentfi-demo';

export const config = createConfig({
  chains: [polygon, polygonAmoy],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
