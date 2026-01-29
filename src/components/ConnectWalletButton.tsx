import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectWalletButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== polygon.id;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const openExplorer = () => {
    if (address) {
      window.open(`https://polygonscan.com/address/${address}`, '_blank');
    }
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: polygon.id });
  };

  if (isConnected && address) {
    if (isWrongNetwork) {
      return (
        <Button 
          onClick={handleSwitchNetwork}
          className="bg-neon-orange/20 border border-neon-orange text-neon-orange hover:bg-neon-orange/30"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Switch to Polygon
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="glass-card border-primary/30 hover:border-primary/60 hover:bg-primary/10"
          >
            <div className="w-2 h-2 rounded-full bg-neon-green mr-2 pulse-dot" />
            <span className="font-mono">{truncateAddress(address)}</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-card border-border w-48">
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openExplorer} className="cursor-pointer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => disconnect()} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground glow-purple"
          disabled={isConnecting || isPending}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnecting || isPending ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-border w-56">
        {connectors.map((connector) => (
          <DropdownMenuItem
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="cursor-pointer"
          >
            {connector.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
