import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { CreateAgentWizard } from '@/components/agent/CreateAgentWizard';
import { ArrowLeft, Bot } from 'lucide-react';

const CreateAgent = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">Connect your wallet to create trading agents</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create AI Trading Agent</h1>
          <p className="text-muted-foreground">
            Deploy an autonomous agent to trade on your behalf
          </p>
        </div>

        <CreateAgentWizard />
      </div>
    </div>
  );
};

export default CreateAgent;