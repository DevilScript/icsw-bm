
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange the auth code for a session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Close this window after successful authentication in popup mode
        if (window.opener) {
          window.close();
        } else {
          // If not in a popup (fallback), redirect to homepage
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error during auth callback:', error);
        
        // Close this window on error in popup mode
        if (window.opener) {
          window.close();
        } else {
          // If not in a popup (fallback), redirect to auth page
          window.location.href = '/auth';
        }
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-glass-dark">
      <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
      <p className="mt-4 text-lg text-white">Processing login...</p>
    </div>
  );
};

export default AuthCallback;
