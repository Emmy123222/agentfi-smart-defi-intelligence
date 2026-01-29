import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Zap, Shield, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

export function HeroSection() {
  const { isConnected } = useAccount();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px]" />
      
      {/* Animated Orbs */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-4 h-4 bg-neon-cyan rounded-full"
        animate={{
          y: [0, -30, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-neon-pink rounded-full"
        animate={{
          y: [0, 20, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-2 h-2 bg-neon-green rounded-full"
        animate={{
          y: [0, -15, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/30 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-neon-green pulse-dot" />
            <span className="text-sm text-muted-foreground">Powered by AI on Polygon</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Deploy{' '}
            <span className="gradient-text">Autonomous AI Agents</span>
            {' '}on Polygon
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Create intelligent trading agents that analyze crypto markets, generate signals, 
            and execute DeFi strategies transparently on-chain.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-purple group"
              asChild
            >
              <Link to={isConnected ? "/create" : "#"}>
                <Zap className="w-5 h-5 mr-2" />
                {isConnected ? 'Create Your Agent' : 'Connect to Start'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-border hover:bg-secondary"
              asChild
            >
              <Link to="/leaderboard">
                View Live Agents
              </Link>
            </Button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FeatureCard
              icon={<Bot className="w-6 h-6" />}
              title="AI Intelligence"
              description="Advanced ML models analyze market trends and generate trading signals"
              color="purple"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="On-Chain Execution"
              description="Transparent, verifiable trades executed via smart contracts"
              color="cyan"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Performance Tracking"
              description="Real-time PnL, trade history, and agent leaderboards"
              color="green"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'purple' | 'cyan' | 'green';
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    purple: 'bg-neon-purple/10 text-neon-purple border-neon-purple/20',
    cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20',
    green: 'bg-neon-green/10 text-neon-green border-neon-green/20',
  };

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50 hover:border-border transition-colors">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4 mx-auto`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
