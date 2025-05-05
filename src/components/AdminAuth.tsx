import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';

const AdminAuth = () => {
  const [adminKey, setAdminKey] = useState<string>('');
  const [inputKey, setInputKey] = useState<string>('');
  const [keyGenerated, setKeyGenerated] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate a random key function using crypto
  const generateRandomKey = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
  };

  // Send key to Discord webhook with additional security
  const sendKeyToDiscord = async (key: string) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      toast({
        title: "Configuration Error",
        description: "Discord webhook URL is missing. Please contact support.",
        variant: "destructive",
        duration: 7000,
      });
      localStorage.removeItem('auth_client_hash');
      localStorage.removeItem('auth_key_timestamp');
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('usedKeys');
      return false;
    }

    try {
      // Add timestamp and client information for security
      const securityInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        clientHash: btoa(navigator.userAgent + window.screen.width + window.screen.height)
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `New Admin Authentication Key: ${key}\nSecurity Info: ${JSON.stringify(securityInfo)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send key to Discord');
      }
      
      // Store client hash with the key for verification
      localStorage.setItem('auth_client_hash', securityInfo.clientHash);
      localStorage.setItem('auth_key_timestamp', securityInfo.timestamp);
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send key to Discord. Please try again or contact support.",
        variant: "destructive",
        duration: 7000,
      });
      localStorage.removeItem('auth_client_hash');
      localStorage.removeItem('auth_key_timestamp');
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('usedKeys');
      return false;
    }
  };

  const handleGetKey = async () => {
    const newKey = generateRandomKey();
    setAdminKey(newKey);
    setKeyGenerated(true);
    const success = await sendKeyToDiscord(newKey);
    
    if (success) {
      toast({
        title: "New Key Generated",
        description: "A new authentication key has been sent to Discord.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get stored client hash for verification
    const storedClientHash = localStorage.getItem('auth_client_hash');
    const currentHash = btoa(navigator.userAgent + window.screen.width + window.screen.height);
    const usedKeys = JSON.parse(localStorage.getItem('usedKeys') || '[]');
    
    // Security check - verify client hasn't changed
    if (storedClientHash && storedClientHash !== currentHash) {
      toast({
        title: "Security Alert",
        description: "Client verification failed. Please get a new key.",
        variant: "destructive",
      });
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
      return;
    }
    
    if (inputKey === adminKey && keyGenerated) {
      usedKeys.push(inputKey);
      localStorage.setItem('usedKeys', JSON.stringify(usedKeys));
      localStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: "Access granted",
        description: "Welcome to the admin dashboard",
      });
      
      // Force a page refresh to load the admin panel
      window.location.href = '/admin';
    } else {
      toast({
        title: "Access denied",
        description: "Invalid authentication key",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <GlassCard className="max-w-md w-full animate-float">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse-glow border border-pink-300/30">
            <Key size={28} className="text-pink-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter Key"
            className="glass-input border-pink-300/30 focus:border-pink-400/50 text-center"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            required
          />
          
          <div className="flex gap-2">
            <Button 
              type="button"
              onClick={handleGetKey}
              className="flex-1 button-3d"
            >
              Get Key
            </Button>
            
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-lg shadow-pink-400/20 transition-all duration-300"
              disabled={!keyGenerated}
            >
              Authenticate
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default AdminAuth;