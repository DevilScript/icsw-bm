import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  nickname: string | null;
  balance: number;
}

interface PurchaseHistory {
  id: string;
  item_name: string;
  amount: number;
  created_at: string;
}

interface AuthContextType {
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  purchaseHistory: PurchaseHistory[];
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshPurchaseHistory: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const { toast } = useToast();

  // Function to refresh user profile data
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('set_user')
        .select('id, username, email, nickname, balance')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  // Function to fetch purchase history
  const refreshPurchaseHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('balance_purchases')
        .select('id, item_name, amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching purchase history:', error);
        return;
      }
      
      setPurchaseHistory(data || []);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state change:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setTimeout(() => {
            refreshProfile();
            refreshPurchaseHistory();
          }, 0);
        } else {
          setProfile(null);
          setPurchaseHistory([]);
        }
      }
    );

    // Then check for existing session
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession?.user) {
          await refreshProfile();
          await refreshPurchaseHistory();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "Registration successful",
        description: "Your account has been created. Please check your email for verification.",
        duration: 5000,
      });
      
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
        duration: 3000,
      });
      
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    }
  };

  // Update Discord sign-in to use a popup
  const signInWithDiscord = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // This enables popup mode
        },
      });

      if (error) throw error;
      
      if (data.url) {
        // Open the URL in a popup
        const popup = window.open(
          data.url, 
          'discord-login', 
          'width=600,height=700,left=200,top=100'
        );
        
        if (!popup) {
          toast({
            title: "Popup blocked",
            description: "Please allow popups for this site to log in with Discord",
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
        
        // Poll the popup to check if it's been redirected to our callback URL
        const pollPopup = setInterval(() => {
          try {
            // If the popup is closed or redirected to a different origin
            if (popup.closed || popup.location.origin === window.location.origin) {
              clearInterval(pollPopup);
              
              // If just closed without completing the flow
              if (popup.closed) {
                toast({
                  title: "Login canceled",
                  description: "Discord login was canceled",
                  variant: "destructive",
                  duration: 3000,
                });
              } else {
                // Otherwise, we've been redirected back to our site
                popup.close();
              }
            }
          } catch (e) {
            // This will throw an error due to CORS when the popup is on discord.com
            // Just continue polling
          }
        }, 500);
      }
      
    } catch (error: any) {
      console.error('Error signing in with Discord:', error);
      toast({
        title: "Discord login failed",
        description: error.message || "An error occurred during Discord login",
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        session,
        profile,
        purchaseHistory,
        signUp,
        signIn,
        signInWithDiscord,
        signOut,
        refreshProfile,
        refreshPurchaseHistory
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
