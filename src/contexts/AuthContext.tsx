import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedWallet = localStorage.getItem('wallet_address');
    if (storedWallet) {
      loadUser(storedWallet);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (address: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', address)
      .maybeSingle();

    if (data) {
      setUser(data);
      setWalletAddress(address);
    }
    setLoading(false);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0].toLowerCase();

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle();

      if (existingUser) {
        setUser(existingUser);
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            wallet_address: address,
            kyc_status: 'none',
          })
          .select()
          .single();

        if (error) throw error;
        setUser(newUser);
      }

      setWalletAddress(address);
      localStorage.setItem('wallet_address', address);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setUser(null);
    setWalletAddress(null);
    localStorage.removeItem('wallet_address');
  };

  const value = {
    user,
    walletAddress,
    connectWallet,
    disconnectWallet,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
