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

  // Check authentication status on mount with slight delay to avoid race conditions
  useEffect(() => {
    const checkAuth = setTimeout(() => {
      const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
      console.log('AdminAuth: isAuthenticated on mount:', isAuthenticated);
      if (isAuthenticated) {
        console.log('Already authenticated, navigating to /admin');
        navigate('/admin', { replace: true });
      } else {
        toast({
          title: "Authentication Required",
          description: "Please enter the authentication key to access the admin dashboard.",
          duration: 5000,
        });
      }
    }, 100); // 100ms delay to ensure sessionStorage is ready

    return () => clearTimeout(checkAuth); // Cleanup timeout on unmount
  }, [navigate, toast]);

  const generateRandomKey = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
  };

  const sendKeyToDiscord = async (key: string) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    console.log('Webhook URL:', webhookUrl);

    if (!webhookUrl) {
      console.error('Discord webhook URL is not configured');
      toast({
        title: "Configuration Error",
        description: "Discord webhook URL is missing. Please contact support.",
        variant: "destructive",
        duration: 7000,
      });
      // Clear sessionStorage to prevent inconsistent state
      sessionStorage.removeItem('auth_client_hash');
      sessionStorage.removeItem('auth_key_timestamp');
      sessionStorage.removeItem('adminAuthenticated');
      return false;
    }

    try {
      const securityInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        clientHash: btoa(navigator.userAgent + window.screen.width + window.screen.height),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `New Admin Authentication Key: ${key}\nSecurity Info: ${JSON.stringify(securityInfo)}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send key to Discord: ${response.statusText}`);
      }

      sessionStorage.setItem('auth_client_hash', securityInfo.clientHash);
      sessionStorage.setItem('auth_key_timestamp', securityInfo.timestamp);
      console.log('Stored auth_client_hash:', securityInfo.clientHash);
      return true;
    } catch (error) {
      console.error('Failed to send key to Discord:', error);
      toast({
        title: "Error",
        description: "Failed to send key to Discord. Please try again or contact support.",
        variant: "destructive",
        duration: 7000,
      });
      // Clear sessionStorage to prevent inconsistent state
      sessionStorage.removeItem('auth_client_hash');
      sessionStorage.removeItem('auth_key_timestamp');
      sessionStorage.removeItem('adminAuthenticated');
      return false;
    }
  };

  const handleGetKey = async () => {
    const newKey = generateRandomKey();
    setAdminKey(newKey);
    setKeyGenerated(true);
    const success = await sendKeyToDiscord(newKey);
    console.log('Generated Key:', newKey);
    console.log('Key Generated State:', true);
    if (success) {
      toast({
        title: "New Key Generated",
        description: "A new authentication key has been sent to Discord. Please check and enter it below.",
        duration: 7000,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const storedClientHash = sessionStorage.getItem('auth_client_hash');
    const currentHash = btoa(navigator.userAgent + window.screen.width + window.screen.height);

    console.log('Input Key:', inputKey);
    console.log('Admin Key:', adminKey);
    console.log('Key Generated:', keyGenerated);
    console.log('Stored Client Hash:', storedClientHash);
    console.log('Current Hash:', currentHash);

    if (storedClientHash && storedClientHash !== currentHash) {
      toast({
        title: "Security Alert",
        description: "Client verification failed. Please get a new key.",
        variant: "destructive",
        duration: 7000,
      });
      // Clear sessionStorage and reset state
      sessionStorage.removeItem('auth_client_hash');
      sessionStorage.removeItem('auth_key_timestamp');
      sessionStorage.removeItem('adminAuthenticated');
      setKeyGenerated(false);
      setAdminKey('');
      setInputKey('');
      return;
    }

    if (inputKey === adminKey && keyGenerated) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      console.log('Authentication successful, adminAuthenticated set:', sessionStorage.getItem('adminAuthenticated'));
      console.log('Navigating to /admin');
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard!",
        duration: 5000,
      });
      navigate('/admin', { replace: true });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid authentication key. Please try again or get a new key.",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-glass-dark">
      <GlassCard className="max-w-md w-full animate-float border border-pink-300/30 shadow-lg shadow-pink-500/10">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse-glow border border-pink-300/30">
            <Key size={28} className="text-pink-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter Authentication Key"
            className="glass-input border-pink-300/30 focus:border-pink-400/50 text-center"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            required
          />
          {!keyGenerated && (
            <p className="text-sm text-pink-300 text-center">
              Please click "Get Key" to receive an authentication key via Discord.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleGetKey}
              className="flex-1 bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 border border-pink-300/30 transition-all duration-300"
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