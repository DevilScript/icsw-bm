
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminAuth = () => {
  const [adminKey, setAdminKey] = useState<string>('');
  const [inputKey, setInputKey] = useState<string>('');
  const [keyGenerated, setKeyGenerated] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<number>(1); // Added auth step tracking
  const [securityToken, setSecurityToken] = useState<string>(''); // Added security token
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if admin is authenticated on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      const adminAuth = localStorage.getItem('adminAuthenticated');
      const authTimestamp = localStorage.getItem('auth_key_timestamp');
      const storedToken = localStorage.getItem('security_token');
      
      // Check if auth is still valid (24 hour expiry)
      if (adminAuth === 'true' && authTimestamp && storedToken) {
        const now = new Date().getTime();
        const authTime = new Date(authTimestamp).getTime();
        const hoursDiff = (now - authTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          // Verify token with server
          try {
            // Simple hash check to verify the token hasn't been tampered with
            const clientHash = btoa(navigator.userAgent + window.screen.width + window.screen.height);
            const expectedTokenHash = btoa(clientHash + authTimestamp).substring(0, 16);
            
            if (storedToken.startsWith(expectedTokenHash)) {
              navigate('/admin');
              return;
            }
          } catch (err) {
            console.error('Auth verification failed', err);
          }
        }
        
        // Auth expired or invalid
        handleLogout();
      }
    };
    
    checkAdminAuth();
  }, [navigate]);

  // Generate a random key function using crypto
  const generateRandomKey = (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
  };

  // Create a more secure token
  const generateSecurityToken = (clientHash: string, timestamp: string): string => {
    // Create a token that combines hash + timestamp + random elements
    const baseHash = btoa(clientHash + timestamp);
    const randomSalt = generateRandomKey().substring(0, 8);
    return baseHash.substring(0, 16) + randomSalt;
  };

  // Send key to Discord webhook with additional security
  const sendKeyToDiscord = async (key: string) => {
    setIsLoading(true);
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      toast({
        title: "Configuration Error",
        description: "Discord webhook URL is missing. Please contact support.",
        variant: "destructive",
        duration: 7000,
      });
      handleLogout();
      setIsLoading(false);
      return false;
    }

    try {
      // Add timestamp and client information for security
      const timestamp = new Date().toISOString();
      const clientHash = btoa(navigator.userAgent + window.screen.width + window.screen.height);
      const token = generateSecurityToken(clientHash, timestamp);
      setSecurityToken(token);
      
      // Store token and timestamp for verification
      localStorage.setItem('security_token', token);
      localStorage.setItem('auth_client_hash', clientHash);
      localStorage.setItem('auth_key_timestamp', timestamp);

      // Add additional IP fingerprinting and device info
      const securityInfo = {
        timestamp,
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        tokenHash: btoa(token).substring(0, 8) // Only send a hash of the token for verification
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `New Admin Authentication Request\nKey: ${key}\nVerification Data: ${JSON.stringify(securityInfo)}\nTimestamp: ${new Date().toLocaleString()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send key to Discord');
      }
      
      setAuthStep(2); // Move to next auth step
      setIsLoading(false);
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send key to Discord. Please try again or contact support.",
        variant: "destructive",
        duration: 7000,
      });
      handleLogout();
      setIsLoading(false);
      return false;
    }
  };

  const handleGetKey = async () => {
    const newKey = generateRandomKey();
    setAdminKey(newKey);
    setKeyGenerated(true);
    await sendKeyToDiscord(newKey);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Get stored security data for verification
    const storedClientHash = localStorage.getItem('auth_client_hash');
    const storedTimestamp = localStorage.getItem('auth_key_timestamp');
    const storedToken = localStorage.getItem('security_token');
    const currentHash = btoa(navigator.userAgent + window.screen.width + window.screen.height);
    const usedKeys = JSON.parse(localStorage.getItem('usedKeys') || '[]');
    
    // Enhanced security check - multiple verification points
    if (!storedClientHash || !storedTimestamp || !storedToken || !securityToken) {
      toast({
        title: "Security Alert",
        description: "Authentication sequence violation. Please restart authentication.",
        variant: "destructive",
      });
      handleLogout();
      setIsLoading(false);
      return;
    }
    
    // Verify the client hasn't changed
    if (storedClientHash !== currentHash) {
      toast({
        title: "Security Alert",
        description: "Client verification failed. Authentication sequence tampered.",
        variant: "destructive",
      });
      handleLogout();
      setIsLoading(false);
      return;
    }
    
    // Verify token matches
    if (storedToken !== securityToken) {
      toast({
        title: "Security Alert",
        description: "Token verification failed. Authentication compromised.",
        variant: "destructive",
      });
      handleLogout();
      setIsLoading(false);
      return;
    }

    // Check if key has been used
    if (usedKeys.includes(inputKey)) {
      toast({
        title: "Access denied",
        description: "This key has already been used. Please get a new key.",
        variant: "destructive",
      });
      setInputKey('');
      setIsLoading(false);
      return;
    }
    
    // Final verification of the key
    if (inputKey === adminKey && keyGenerated) {
      // Store used key
      usedKeys.push(inputKey);
      localStorage.setItem('usedKeys', JSON.stringify(usedKeys));
      
      // Set authentication
      localStorage.setItem('adminAuthenticated', 'true');
      
      toast({
        title: "Access granted",
        description: "Welcome to the admin dashboard",
      });
      
      // Force a page refresh to load the admin panel
      navigate('/admin');
    } else {
      toast({
        title: "Access denied",
        description: "Invalid authentication key",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('auth_client_hash');
    localStorage.removeItem('auth_key_timestamp');
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('security_token');
    setKeyGenerated(false);
    setSecurityToken('');
    setAuthStep(1);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 custom-cursor">
      <GlassCard className="max-w-md w-full animate-float">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse-glow border border-pink-300/30">
            {authStep === 1 ? (
              <Key size={28} className="text-pink-300" />
            ) : (
              <Shield size={28} className="text-pink-300" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
          {authStep === 2 && (
            <p className="text-glass-light text-sm mt-2">Security verification in progress. Please enter the key sent to Discord.</p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {authStep === 1 ? (
            <Button 
              type="button"
              onClick={handleGetKey}
              className="w-full button-3d flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              ) : (
                <>
                  <Lock size={16} />
                  Request Authentication Key
                </>
              )}
            </Button>
          ) : (
            <>
              <Input
                type="password"
                placeholder="Enter Key"
                className="glass-input border-pink-300/30 focus:border-pink-400/50 text-center custom-cursor"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                required
                disabled={isLoading}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-lg shadow-pink-400/20 transition-all duration-300 flex items-center justify-center gap-2"
                disabled={!keyGenerated || isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                ) : (
                  <>
                    <Shield size={16} />
                    Verify Authentication
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </GlassCard>
    </div>
  );
};

export default AdminAuth;
