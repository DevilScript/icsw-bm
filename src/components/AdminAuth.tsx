import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key, Lock, Shield, Fingerprint, MailCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth, generateDeviceFingerprint } from '@/contexts/AuthContext';

// Types
type AuthStep = 'key' | 'verification' | '2fa';

interface SecureStorageSession {
  token: string;
  expiry: string;
}

// Secure storage helper
const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      // Try to use sessionStorage first (more secure)
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return;
      }
      
      // Fall back to encrypted localStorage
      const encryptedValue = btoa(value); // Simple encoding, not true encryption
      localStorage.setItem(key, encryptedValue);
    } catch (e) {
      console.error('Error storing data:', e);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      // Try sessionStorage first
      if (window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
      
      // Fall back to encrypted localStorage
      const value = localStorage.getItem(key);
      if (!value) return null;
      
      return atob(value); // Simple decoding
    } catch (e) {
      console.error('Error retrieving data:', e);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      // Remove from both storages to be sure
      if (window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing data:', e);
    }
  }
};

const AdminAuth = () => {
  // State
  const [authStep, setAuthStep] = useState<AuthStep>('key');
  const [inputKey, setInputKey] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authAttempts, setAuthAttempts] = useState<number>(0);
  const [contactMethod, setContactMethod] = useState<string>('');
  const [contactValue, setContactValue] = useState<string>('');
  
  // Hooks
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, authenticate } = useAuth();
  
  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://tnwgtlyuabpmxsqiyjof.supabase.co'}/functions/v1/admin-auth`;
  const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRud2d0bHl1YWJwbXhzcWl5am9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjE5NjgsImV4cCI6MjA2MjAzNzk2OH0.4YzXbSFRNp_qqPH_3pTltCJue7Mwsgh5GRHI0ZIjZ64';
  
  // Check if admin is authenticated on mount
  useEffect(() => {
    // If already authenticated, redirect to admin page
    if (isAuthenticated === true) {
      navigate('/admin');
    }
    
    // Clean up old localStorage (migration)
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('auth_client_hash');
    localStorage.removeItem('auth_key_timestamp');
    localStorage.removeItem('security_token');
    localStorage.removeItem('auth_fingerprint');
    localStorage.removeItem('usedKeys');
  }, [isAuthenticated, navigate]);
  
  // CSP setup (Content Security Policy)
  useEffect(() => {
    // This would ideally be in meta tags and server headers
    // For demo purposes, we'll just add a meta tag dynamically
    const metaCSP = document.createElement('meta');
    metaCSP.httpEquiv = 'Content-Security-Policy';
    metaCSP.content = "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; connect-src *;";
    document.head.appendChild(metaCSP);
    
    return () => {
      document.head.removeChild(metaCSP);
    };
  }, []);
  
  // Handle key request
  const handleGetKey = async () => {
    setIsLoading(true);
    
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      
      const response = await fetch(`${API_BASE_URL}/request-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          deviceFingerprint
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get authentication key');
      }
      
      // Store the key, nonce, and timestamp temporarily (they won't be visible in UI)
      setInputKey(data.key);
      setNonce(data.nonce);
      
      // CSRF token generation (for added security)
      const csrfToken = generateCSRFToken();
      secureStorage.setItem('csrf_token', csrfToken);
      
      toast({
        title: "รหัสยืนยันตัวตนถูกสร้างแล้ว",
        description: "รหัสถูกส่งไปยังผู้ดูแลระบบเพื่อตรวจสอบ กรุณารอรับรหัสจากผู้ดูแลระบบ",
        duration: 7000,
      });
      
      setAuthStep('verification');
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างรหัสยืนยันตัวตนได้ โปรดลองอีกครั้ง",
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle verification submit
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const csrfToken = secureStorage.getItem('csrf_token');
      
      if (!csrfToken) {
        throw new Error('CSRF token missing. Please restart the authentication process.');
      }
      
      const response = await fetch(`${API_BASE_URL}/verify-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({
          key: inputKey,
          nonce: nonce,
          deviceFingerprint
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Key verification failed');
      }
      
      // Store contact method for 2FA
      setContactMethod(data.contactMethod);
      setContactValue(data.contactValue);
      
      toast({
        title: "ยืนยันรหัสสำเร็จ",
        description: `รหัสยืนยัน 2 ขั้นตอนได้ถูกส่งไปยัง ${data.contactMethod}: ${data.contactValue}`,
        duration: 7000,
      });
      
      // For development: auto-fill the 2FA code
      if (import.meta.env.DEV && data.code) {
        setTwoFactorCode(data.code);
      }
      
      setAuthStep('2fa');
    } catch (error: any) {
      // Increment failed attempts counter
      setAuthAttempts(prev => prev + 1);
      
      // If too many failed attempts, reset
      if (authAttempts >= 2) {
        handleReset('Too many failed attempts');
      } else {
        toast({
          title: "การยืนยันรหัสล้มเหลว",
          description: error.message || "รหัสไม่ถูกต้องหรือหมดอายุ",
          variant: "destructive",
          duration: 7000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle 2FA submit
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const csrfToken = secureStorage.getItem('csrf_token');
      
      if (!csrfToken) {
        throw new Error('CSRF token missing. Please restart the authentication process.');
      }
      
      const response = await fetch(`${API_BASE_URL}/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({
          code: twoFactorCode,
          deviceFingerprint,
          contactMethod,
          contactValue
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Two-factor authentication failed');
      }
      
      // Store session token securely
      const session: SecureStorageSession = {
        token: data.sessionToken,
        expiry: new Date(Date.now() + data.expiresIn * 1000).toISOString()
      };
      
      secureStorage.setItem('admin_session', JSON.stringify(session));
      
      // Update auth context
      authenticate();
      
      toast({
        title: "การยืนยันตัวตนสำเร็จ",
        description: "ยินดีต้อนรับเข้าสู่หน้าจัดการระบบ",
        duration: 5000,
      });
      
      // Clean up CSRF token
      secureStorage.removeItem('csrf_token');
      
      // Navigate to admin page
      navigate('/admin');
    } catch (error: any) {
      // Increment failed attempts counter
      setAuthAttempts(prev => prev + 1);
      
      // If too many failed attempts, reset
      if (authAttempts >= 2) {
        handleReset('Too many failed attempts');
      } else {
        toast({
          title: "การยืนยัน 2 ขั้นตอนล้มเหลว",
          description: error.message || "รหัสไม่ถูกต้องหรือหมดอายุ",
          variant: "destructive",
          duration: 7000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset authentication process
  const handleReset = (reason?: string) => {
    setAuthStep('key');
    setInputKey('');
    setNonce('');
    setTwoFactorCode('');
    setAuthAttempts(0);
    secureStorage.removeItem('csrf_token');
    
    if (reason) {
      toast({
        title: "การยืนยันตัวตนถูกรีเซ็ต",
        description: reason,
        variant: "destructive",
        duration: 7000,
      });
    }
  };
  
  // Generate a CSRF token
  const generateCSRFToken = (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 custom-cursor">
      <GlassCard className="max-w-md w-full animate-float relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 animate-pulse-glow border border-pink-300/30">
            {authStep === 'key' && (
              <Key size={28} className="text-pink-300" />
            )}
            {authStep === 'verification' && (
              <Fingerprint size={28} className="text-pink-300" />
            )}
            {authStep === '2fa' && (
              <MailCheck size={28} className="text-pink-300" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
          
          {authStep === 'key' && (
            <p className="text-glass-light text-sm mt-2 text-center">
              ส่งคำขอการยืนยันตัวตนไปยังผู้ดูแลระบบ
            </p>
          )}
          
          {authStep === 'verification' && (
            <p className="text-glass-light text-sm mt-2 text-center">
              ป้อนรหัสยืนยันตัวตนที่ได้รับจากผู้ดูแลระบบ
            </p>
          )}
          
          {authStep === '2fa' && (
            <p className="text-glass-light text-sm mt-2 text-center">
              ป้อนรหัสยืนยัน 2 ขั้นตอนที่ส่งไปยัง {contactValue}
            </p>
          )}
        </div>
        
        {/* Step 1: Request Key */}
        {authStep === 'key' && (
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
                ขอรหัสยืนยันตัวตน
              </>
            )}
          </Button>
        )}
        
        {/* Step 2: Verify Key */}
        {authStep === 'verification' && (
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="ป้อนรหัสยืนยันตัวตน"
              className="glass-input border-pink-300/30 focus:border-pink-400/50 text-center custom-cursor"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="off" // Prevent browser from storing
              autoCorrect="off"
              spellCheck="false"
            />
            
            <div className="flex space-x-2">
              <Button 
                type="button"
                className="w-1/3 bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 hover:text-pink-300 border border-pink-300/30 shadow-md transition-all duration-200"
                onClick={() => handleReset()}
                disabled={isLoading}
              >
                ย้อนกลับ
              </Button>
              
              <Button 
                type="submit" 
                className="w-2/3 bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-lg shadow-pink-400/20 transition-all duration-300 flex items-center justify-center gap-2"
                disabled={!inputKey || isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                ) : (
                  <>
                    <Shield size={16} />
                    ยืนยันรหัส
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        
        {/* Step 3: Two-Factor Authentication */}
        {authStep === '2fa' && (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="ป้อนรหัส 2FA"
              className="glass-input border-pink-300/30 focus:border-pink-400/50 text-center custom-cursor"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              maxLength={6}
            />
            
            <div className="flex space-x-2">
              <Button 
                type="button"
                className="w-1/3 bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 hover:text-pink-300 border border-pink-300/30 shadow-md transition-all duration-200"
                onClick={() => handleReset()}
                disabled={isLoading}
              >
                ย้อนกลับ
              </Button>
              
              <Button 
                type="submit" 
                className="w-2/3 bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-lg shadow-pink-400/20 transition-all duration-300 flex items-center justify-center gap-2"
                disabled={!twoFactorCode || isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                ) : (
                  <>
                    <Shield size={16} />
                    ยืนยันตัวตน
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
};

export default AdminAuth;
