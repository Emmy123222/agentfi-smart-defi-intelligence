import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

export function CTASection() {
  const { isConnected } = useAccount();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Deploy Your{' '}
            <span className="gradient-text">AI Agent</span>?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join the future of autonomous DeFi trading. Create your first agent and 
            start generating AI-powered trading signals today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-purple group px-8"
              asChild
            >
              <Link to={isConnected ? "/create" : "#"}>
                <Zap className="w-5 h-5 mr-2" />
                {isConnected ? 'Create Agent Now' : 'Connect Wallet to Start'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-border hover:bg-secondary"
              asChild
            >
              <a href="https://docs.polygon.technology/" target="_blank" rel="noopener noreferrer">
                Learn About Polygon
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Testnet available • Full documentation
          </p>
        </motion.div>
      </div>
    </section>
  );
}
