
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key, Lock, Shield, Fingerprint, Mail, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PuffLoader } from 'react-spinners';
import * as CryptoJS from 'crypto-js';

// Auth step states
enum AuthStep {
  REQUEST_KEY = 1,
  ENTER_KEY = 2,
  TWO_FACTOR = 3
}

interface FingerPrintData {
  screen: string;
  colorDepth: number;
  timezone: string;
  language: string;
  userAgent: string;
  webglFingerprint?: string;
  plugins?: string;
  fonts?: string;
  canvas?: string;
  hardware?: string;
}

const AdminAuth: React.FC = () => {
  // State variables
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.REQUEST_KEY);
  const [inputKey, setInputKey] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [contactMethod, setContactMethod] = useState<string>('email');
  const [contactValue, setContactValue] = useState<string>('phuset.zzii@gmail.com');
  const [authAttempts, setAuthAttempts] = useState<number>(0);
  const [keyExpiry, setKeyExpiry] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate an enhanced fingerprint using available browser properties
  const generateFingerprint = useCallback(async (): Promise<string> => {
    try {
      const fingerprint: FingerPrintData = {
        screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        userAgent: navigator.userAgent,
      };

      // Add WebGL fingerprint if available
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            fingerprint.webglFingerprint = 
              gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + '~' +
              gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
          
          // Canvas fingerprinting
          canvas.width = 220;
          canvas.height = 30;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.font = '11pt Arial';
            ctx.fillText("GhoulRe", 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.font = '18pt Arial';
            ctx.fillText("GhoulRe", 4, 17);
            fingerprint.canvas = canvas.toDataURL();
          }
        }
      } catch (e) {
        console.error("WebGL fingerprinting failed:", e);
      }

      // Add hardware info 
      try {
        if (navigator.hardwareConcurrency) {
          fingerprint.hardware = `cores:${navigator.hardwareConcurrency}`;
        }
      } catch (e) {}

      // Create a hash of all collected data
      const fingerprintString = JSON.stringify(fingerprint);
      const hash = CryptoJS.SHA256(fingerprintString).toString();
      
      return hash;
    } catch (error) {
      console.error("Error generating fingerprint:", error);
      return CryptoJS.SHA256(navigator.userAgent + Date.now().toString()).toString();
    }
  }, []);

  // Get client IP address using an external service for demo purposes
  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Could not get IP address:", error);
      return null;
    }
  };

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session token from sessionStorage (more secure than localStorage)
        const sessionToken = sessionStorage.getItem('admin_session');
        
        if (!sessionToken) return;
        
        // Get device fingerprint
        const deviceFingerprint = await generateFingerprint();
        
        // Validate session with backend
        const response = await supabase.functions.invoke('admin-auth', {
          body: {
            action: 'validateSession',
            data: { sessionToken, deviceFingerprint }
          }
        });
        
        if (response.data.success) {
          navigate('/admin');
        } else {
          // Clear invalid session
          sessionStorage.removeItem('admin_session');
        }
      } catch (error) {
        console.error("Auth check error:", error);
        sessionStorage.removeItem('admin_session');
      }
    };
    
    checkAuth();
  }, [generateFingerprint, navigate]);

  // Request authentication key
  const handleGetKey = async () => {
    try {
      setIsLoading(true);
      setAuthAttempts(prev => prev + 1);

      // Generate device fingerprint
      const deviceFingerprint = await generateFingerprint();
      const ipAddress = await getClientIP();

      // Request key from backend
      const response = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'generateKey',
          data: { deviceFingerprint, ipAddress }
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate authentication key');
      }
      
      // Store nonce for verification
      setNonce(response.data.data.nonce);
      
      // Set key expiry
      if (response.data.data.expires) {
        setKeyExpiry(new Date(response.data.data.expires));
      }
      
      // Move to next auth step
      setAuthStep(AuthStep.ENTER_KEY);
      
      // Start expiry timer
      if (response.data.data.expires) {
        const expiryTime = new Date(response.data.data.expires).getTime() - Date.now();
        if (expiryTime > 0) {
          setTimeout(() => {
            if (authStep === AuthStep.ENTER_KEY) {
              toast({
                title: "Key expired",
                description: "Your authentication key has expired. Please request a new one.",
                variant: "destructive",
                duration: 5000,
              });
              setAuthStep(AuthStep.REQUEST_KEY);
            }
          }, expiryTime);
        }
      }
      
      toast({
        title: "Key requested",
        description: "Authentication key has been sent to Discord. Please check Discord and enter the key.",
        duration: 7000,
      });
    } catch (error) {
      console.error("Error generating key:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request authentication key",
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the entered key
  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputKey || !nonce) {
      toast({
        title: "Error",
        description: "Authentication key is required",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Generate device fingerprint
      const deviceFingerprint = await generateFingerprint();
      const ipAddress = await getClientIP();
      
      // Verify key with backend
      const response = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'verifyKey',
          data: { 
            key: inputKey,
            nonce,
            deviceFingerprint,
            ipAddress
          }
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Authentication failed');
      }
      
      // Store session token in sessionStorage (more secure than localStorage)
      sessionStorage.setItem('admin_session', response.data.data.sessionToken);
      
      // Proceed to 2FA
      setAuthStep(AuthStep.TWO_FACTOR);
      
      // Initiate 2FA authentication
      await send2FACode();
      
    } catch (error) {
      console.error("Key verification error:", error);
      
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Invalid authentication key",
        variant: "destructive",
        duration: 5000,
      });
      
      // Handle too many failed attempts
      if (authAttempts >= 3) {
        toast({
          title: "Too many attempts",
          description: "Too many failed attempts. Please try again later.",
          variant: "destructive",
          duration: 7000,
        });
        setAuthStep(AuthStep.REQUEST_KEY);
        setAuthAttempts(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Send 2FA code to email or phone number
  const send2FACode = async () => {
    try {
      setIsLoading(true);
      
      const response = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'send2FACode',
          data: { 
            contactMethod,
            contactValue: contactMethod === 'email' ? 'phuset.zzii@gmail.com' : '0653835988'
          }
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send verification code');
      }
      
      toast({
        title: "Verification code sent",
        description: `A verification code has been sent to your ${contactMethod}`,
        duration: 5000,
      });
    } catch (error) {
      console.error("2FA code sending error:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 2FA code
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'verify2FACode',
          data: { 
            contactMethod,
            contactValue: contactMethod === 'email' ? 'phuset.zzii@gmail.com' : '0653835988',
            authCode: otpCode
          }
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '2FA verification failed');
      }
      
      toast({
        title: "Authentication successful",
        description: "Welcome to the admin dashboard",
        duration: 5000,
      });
      
      // Navigate to admin panel
      navigate('/admin');
    } catch (error) {
      console.error("2FA verification error:", error);
      
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout (clear session)
  const handleLogout = async () => {
    try {
      const sessionToken = sessionStorage.getItem('admin_session');
      
      if (sessionToken) {
        await supabase.functions.invoke('admin-auth', {
          body: {
            action: 'logout',
            data: { sessionToken }
          }
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      sessionStorage.removeItem('admin_session');
      setAuthStep(AuthStep.REQUEST_KEY);
      setNonce('');
      setInputKey('');
      setOtpCode('');
    }
  };

  // Toggle contact method (email/phone)
  const toggleContactMethod = () => {
    setContactMethod(prev => prev === 'email' ? 'phone' : 'email');
    setContactValue(contactMethod === 'email' ? '0653835988' : 'phuset.zzii@gmail.com');
  };

  // Format remaining time for key expiry
  const formatRemainingTime = () => {
    if (!keyExpiry) return '';
    
    const now = new Date();
    const diff = keyExpiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render content based on current auth step
  const renderAuthContent = () => {
    switch (authStep) {
      case AuthStep.REQUEST_KEY:
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse-glow border border-pink-300/30">
                <Key size={28} className="text-pink-300" />
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
              <p className="text-glass-light text-sm mt-2">Request an authentication key to continue</p>
            </div>
            
            <Button 
              type="button"
              onClick={handleGetKey}
              className="w-full button-3d flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <PuffLoader size={20} color="#ffffff" />
              ) : (
                <>
                  <Lock size={16} />
                  Request Authentication Key
                </>
              )}
            </Button>
          </>
        );
      
      case AuthStep.ENTER_KEY:
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse-glow border border-pink-300/30">
                <Shield size={28} className="text-pink-300" />
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
              <p className="text-glass-light text-sm mt-2">Enter the authentication key sent to Discord</p>
              {keyExpiry && (
                <p className="text-pink-300 text-xs mt-1">Key expires in: {formatRemainingTime()}</p>
              )}
            </div>
            
            <form onSubmit={handleKeySubmit} className="space-y-4">
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <PuffLoader size={20} color="#ffffff" />
                ) : (
                  <>
                    <Shield size={16} />
                    Verify Authentication
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                variant="ghost" 
                className="w-full mt-2 text-glass-light hover:text-white hover:bg-transparent"
                onClick={() => setAuthStep(AuthStep.REQUEST_KEY)}
                disabled={isLoading}
              >
                Back
              </Button>
            </form>
          </>
        );
      
      case AuthStep.TWO_FACTOR:
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse-glow border border-pink-300/30">
                <Fingerprint size={28} className="text-pink-300" />
              </div>
              <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
              <p className="text-glass-light text-sm mt-2">
                Enter the verification code sent to your {contactMethod}
              </p>
              <Button
                variant="link"
                className="text-pink-300 text-xs p-0 mt-1 h-auto"
                onClick={toggleContactMethod}
              >
                Use {contactMethod === 'email' ? 'phone' : 'email'} instead
              </Button>
            </div>
            
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="border-pink-300/30 focus:border-pink-400/80 text-white" />
                    <InputOTPSlot index={1} className="border-pink-300/30 focus:border-pink-400/80 text-white" />
                    <InputOTPSlot index={2} className="border-pink-300/30 focus:border-pink-400/80 text-white" />
                    <InputOTPSlot index={3} className="border-pink-300/30 focus:border-pink-400/80 text-white" />
                    <InputOTPSlot index={4} className="border-pink-300/30 focus:border-pink-400/80 text-white" />
                    <InputOTPSlot index={5} className="border-pink-300/30 focus:border-pink-400/80 text-white" />
                  </InputOTPGroup>
                </InputOTP>
                
                <Button
                  type="button"
                  variant="outline"
                  className="border-pink-300/30 text-pink-300 hover:bg-pink-300/10"
                  onClick={send2FACode}
                  disabled={isLoading}
                >
                  <Mail size={16} className="mr-2" />
                  Resend code
                </Button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-lg shadow-pink-400/20 transition-all duration-300 flex items-center justify-center gap-2"
                disabled={isLoading || otpCode.length !== 6}
              >
                {isLoading ? (
                  <PuffLoader size={20} color="#ffffff" />
                ) : (
                  <>
                    <Send size={16} />
                    Verify Code
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                variant="ghost" 
                className="w-full mt-2 text-glass-light hover:text-white hover:bg-transparent"
                onClick={handleLogout}
                disabled={isLoading}
              >
                Start Over
              </Button>
            </form>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 custom-cursor">
      <GlassCard className="max-w-md w-full animate-float">
        {renderAuthContent()}
      </GlassCard>
    </div>
  );
};

export default AdminAuth;
