import { Link } from 'react-router-dom';
import { ConnectWalletButton } from './ConnectWalletButton';
import { Bot, BarChart3, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">AgentFi</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/create">
                <Zap className="w-4 h-4 mr-2" />
                Create Agent
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/leaderboard">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Link>
            </Button>
          </div>

          {/* Wallet Connection */}
          <ConnectWalletButton />
        </div>
      </div>
    </nav>
  );
}
