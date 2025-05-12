
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UserAuthContext';
import TopUpForm from '@/components/TopUpForm';
import UserProfile from '@/components/UserProfile';
import { Loader2 } from 'lucide-react';

const TopUpPage = () => {
  const { isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-glass-dark">
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
        <p className="mt-4 text-lg text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-glass-dark">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Top Up Your Balance</h1>
        
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md mb-8">
            <UserProfile />
          </div>
          
          <div className="w-full max-w-md">
            <div className="mb-8 rounded-lg overflow-hidden border border-pink-300/30 bg-glass-dark/60 backdrop-blur-md">
              <img 
                src="https://img5.pic.in.th/file/secure-sv1/ayee_topupea09efd0c4c2153b.webp" 
                alt="TrueMoney Voucher Instructions" 
                className="w-full h-auto"
              />
            </div>
            
            <TopUpForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpPage;
