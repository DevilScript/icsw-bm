
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  authenticate: () => void;
  logout: () => void;
  verifySession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Enhanced device fingerprinting
export const generateDeviceFingerprint = (): string => {
  try {
    const screenProps = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const languages = navigator.languages ? navigator.languages.join(',') : navigator.language;
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // WebGL fingerprinting (more reliable across browsers)
    let webglFingerprint = 'no-webgl';
    try {
      const canvas = document.createElement('canvas');
      // Explicitly cast to WebGLRenderingContext to access WebGL methods
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          webglFingerprint = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) + 
                             gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        }
      }
    } catch (e) {
      // WebGL not available
    }
    
    // Combine all fingerprint data and hash it
    const fingerprintData = `${screenProps}|${timeZone}|${languages}|${userAgent}|${platform}|${webglFingerprint}`;
    
    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `fp_${Math.abs(hash).toString(16)}`;
  } catch (error) {
    // Fallback fingerprinting
    const fallbackData = navigator.userAgent + (new Date().getTimezoneOffset());
    let hash = 0;
    for (let i = 0; i < fallbackData.length; i++) {
      const char = fallbackData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `fb_${Math.abs(hash).toString(16)}`;
  }
};

// Functions for secure storage
const secureStorage = {
  // Secure storage in a cross-browser compatible way
  // Modern browsers support sessionStorage, others fall back to encrypted localStorage
  
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Verify session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await verifySession();
        setIsAuthenticated(authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up a timer to periodically verify the session (every 5 minutes)
    const intervalId = setInterval(async () => {
      try {
        const authenticated = await verifySession();
        if (!authenticated) {
          // Session expired
          setIsAuthenticated(false);
          secureStorage.removeItem('admin_session');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
  const authenticate = () => {
    // This function is called when authentication is successful
    // It doesn't actually perform the authentication - that's in AdminAuth component
    setIsAuthenticated(true);
  };
  
  const logout = async () => {
    try {
      const session = JSON.parse(secureStorage.getItem('admin_session') || '{}');
      const deviceFingerprint = generateDeviceFingerprint();
      
      if (session.token) {
        // Call the logout endpoint
        await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://tnwgtlyuabpmxsqiyjof.supabase.co'}/functions/v1/admin-auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRud2d0bHl1YWJwbXhzcWl5am9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjE5NjgsImV4cCI6MjA2MjAzNzk2OH0.4YzXbSFRNp_qqPH_3pTltCJue7Mwsgh5GRHI0ZIjZ64'}`
          },
          body: JSON.stringify({
            sessionToken: session.token,
            deviceFingerprint
          })
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear session data
      secureStorage.removeItem('admin_session');
      setIsAuthenticated(false);
      
      toast({
        title: "ออกจากระบบ",
        description: "คุณได้ออกจากระบบเรียบร้อยแล้ว",
        duration: 5000,
      });
    }
  };
  
  const verifySession = async (): Promise<boolean> => {
    try {
      const session = JSON.parse(secureStorage.getItem('admin_session') || '{}');
      if (!session.token) return false;
      
      const deviceFingerprint = generateDeviceFingerprint();
      
      // Verify the session with the server
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://tnwgtlyuabpmxsqiyjof.supabase.co'}/functions/v1/admin-auth/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRud2d0bHl1YWJwbXhzcWl5am9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjE5NjgsImV4cCI6MjA2MjAzNzk2OH0.4YzXbSFRNp_qqPH_3pTltCJue7Mwsgh5GRHI0ZIjZ64'}`
        },
        body: JSON.stringify({
          sessionToken: session.token,
          deviceFingerprint
        })
      });
      
      const data = await response.json();
      return data.success && data.valid;
    } catch (error) {
      console.error('Error verifying session:', error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      authenticate,
      logout,
      verifySession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
