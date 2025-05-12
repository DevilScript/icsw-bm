
import React from 'react';
import { useAuth } from '@/contexts/UserAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet } from 'lucide-react';

const UserProfile = () => {
  const { user, profile, signOut } = useAuth();

  if (!user || !profile) {
    return null;
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 rounded-lg border border-pink-300/30 bg-glass-dark/60 backdrop-blur-md shadow-lg shadow-pink-500/10">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-pink-500/50">
          <AvatarImage src={user.user_metadata.avatar_url} />
          <AvatarFallback className="bg-pink-500/20 text-white">
            {getInitials(profile.username)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h2 className="text-xl font-semibold text-white">{profile.nickname || profile.username}</h2>
          <p className="text-glass-light text-sm">{profile.email}</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 rounded-lg bg-glass-dark/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-pink-400" />
          <span className="text-glass-light">Balance:</span>
        </div>
        <span className="text-xl font-bold text-pink-400">{profile.balance.toFixed(2)} THB</span>
      </div>
      
      <div className="mt-6">
        <Button 
          variant="outline" 
          className="w-full border-pink-300/30 hover:bg-pink-500/20 text-white"
          onClick={signOut}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
