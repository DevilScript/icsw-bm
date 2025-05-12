
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/UserAuthContext';
import { Wallet, LogIn } from 'lucide-react';

const styles = `
  @keyframes pulseGlow {
    0% {
      text-shadow: 0 0 5px rgba(255, 192, 203, 0.4), 0 0 10px rgba(255, 192, 203, 0.2);
    }
    50% {
      text-shadow: 0 0 15px rgba(255, 192, 203, 0.8), 0 0 20px rgba(255, 192, 203, 0.4);
    }
    100% {
      text-shadow: 0 0 5px rgba(255, 192, 203, 0.4), 0 0 10px rgba(255, 192, 203, 0.2);
    }
  }
  .animate-pulse-glow {
    animation: pulseGlow 2s ease-in-out infinite;
  }
`;

const Navbar = () => {
  const { user, profile } = useAuth();

  return (
    <nav className="w-full py-4 px-6 bg-glass-dark/60 backdrop-blur-md border-b border-glass-light/10 fixed top-0 left-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <style>{styles}</style>
          <span className="text-xl font-bold text-white">
            ICS
            <span className="text-pink-300 animate-pulse-glow">
              W
            </span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50 animate-float">
            <Link to="/">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50 animate-float">
            <Link to="/contributors">Contributors</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50 animate-float">
                <Link to="/topup">
                  <Wallet className="mr-1 h-4 w-4" />
                  {profile ? `${profile.balance.toFixed(0)} THB` : 'Top Up'}
                </Link>
              </Button>
              <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50 animate-float">
                <Link to="/admin">Admin</Link>
              </Button>
            </>
          ) : (
            <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50 animate-float">
              <Link to="/auth">
                <LogIn className="mr-1 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
