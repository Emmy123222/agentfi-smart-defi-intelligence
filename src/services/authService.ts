import { supabase } from '@/integrations/supabase/client';

export class AuthService {
  static async signInWithWallet(walletAddress: string): Promise<void> {
    try {
      // Create a custom JWT token with wallet address
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            wallet_address: walletAddress
          }
        }
      });

      if (error) {
        throw new Error(`Authentication failed: ${error.message}`);
      }

      // Create or update user profile
      await this.createOrUpdateUserProfile(walletAddress);
    } catch (error) {
      console.error('Wallet authentication failed:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async getWalletAddress(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.user_metadata?.wallet_address || null;
  }

  private static async createOrUpdateUserProfile(walletAddress: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: walletAddress,
        total_agents: 0,
        total_balance: 0,
        total_pnl: 0,
      });

    if (error) {
      console.error('Failed to create user profile:', error);
    }
  }
}