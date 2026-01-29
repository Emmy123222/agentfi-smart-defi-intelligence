import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Wallet, Settings, Brain, Zap } from 'lucide-react';

const steps = [
  {
    icon: <Wallet className="w-6 h-6" />,
    title: 'Connect Wallet',
    description: 'Link your MetaMask or WalletConnect compatible wallet to the Polygon network.',
    color: 'purple',
  },
  {
    icon: <Settings className="w-6 h-6" />,
    title: 'Configure Agent',
    description: 'Choose your trading strategy, risk level, and token pairs for your AI agent.',
    color: 'cyan',
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI Analysis',
    description: 'Your agent analyzes market data and generates intelligent trading signals.',
    color: 'pink',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Execute & Track',
    description: 'Trades execute on-chain with full transparency. Track performance in real-time.',
    color: 'green',
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const colorClasses = {
    purple: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
    cyan: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
    pink: 'bg-neon-pink/20 text-neon-pink border-neon-pink/30',
    green: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  };

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Deploy your autonomous AI trading agent in minutes
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Step Number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-mono text-muted-foreground z-10">
                  {index + 1}
                </div>

                <div className="glass-card p-6 rounded-xl text-center pt-8 h-full">
                  <div className={`w-14 h-14 rounded-xl ${colorClasses[step.color as keyof typeof colorClasses]} flex items-center justify-center mx-auto mb-4 border`}>
                    {step.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
