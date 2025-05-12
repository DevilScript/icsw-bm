
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Redirect to homepage
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Error during auth callback:', error);
        navigate('/auth', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-glass-dark">
      <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
      <p className="mt-4 text-lg text-white">Processing login...</p>
    </div>
  );
};

export default AuthCallback;
