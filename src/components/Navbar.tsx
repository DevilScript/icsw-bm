
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/UserAuthContext';
import { Wallet, LogIn, Menu, X, User, History, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

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
  const { user, profile, signOut, purchaseHistory } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (username?: string) => {
    return username ? username.slice(0, 2).toUpperCase() : 'U';
  };

  return (
    <nav className="w-full py-3 px-4 sm:px-6 bg-glass-dark/60 backdrop-blur-md border-b border-glass-light/10 fixed top-0 left-0 z-10">
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
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-glass-light hover:bg-glass-dark/50"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50">
            <Link to="/">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50">
            <Link to="/contributors">Contributors</Link>
          </Button>
          
          {user ? (
            <div className="flex items-center gap-4">
              {/* User profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-2 text-white hover:bg-glass-dark/50 pr-8">
                    <Avatar className="h-8 w-8 border border-pink-500/50">
                      <AvatarImage src={user.user_metadata.avatar_url} />
                      <AvatarFallback className="bg-pink-500/20 text-white text-xs">
                        {getInitials(profile?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {profile?.nickname || profile?.username || 'User'}
                      </span>
                      {profile && (
                        <span className="text-xs text-pink-400 font-medium">
                          {profile.balance.toFixed(0)} THB
                        </span>
                      )}
                    </div>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-glass-dark border border-glass-light/20 text-white" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.username}</p>
                      <p className="text-xs leading-none text-glass-light">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-glass-light/20" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-pink-500/20">
                      <Wallet className="w-4 h-4 text-pink-400" />
                      <span>Balance: {profile?.balance.toFixed(0)} THB</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-glass-light/20" />
                  <DropdownMenuLabel className="font-medium text-glass-light">
                    Purchase History
                  </DropdownMenuLabel>
                  {purchaseHistory.length > 0 ? (
                    <div className="max-h-36 overflow-y-auto py-1">
                      {purchaseHistory.slice(0, 5).map((purchase) => (
                        <DropdownMenuItem key={purchase.id} className="flex flex-col items-start gap-1 cursor-default focus:bg-transparent">
                          <span className="text-sm font-medium text-white">{purchase.item_name}</span>
                          <div className="flex justify-between w-full text-xs">
                            <span className="text-pink-400">{purchase.amount} THB</span>
                            <span className="text-glass-light">
                              {format(new Date(purchase.created_at), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 py-1 text-sm text-glass-light">No purchases yet</div>
                  )}
                  <DropdownMenuSeparator className="bg-glass-light/20" />
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer focus:bg-pink-500/20"
                    asChild
                  >
                    <Link to="/topup">
                      <Wallet className="w-4 h-4" />
                      <span>Top Up</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer focus:bg-pink-500/20 text-red-400"
                    onClick={signOut}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" asChild className="text-glass-light hover:text-white hover:bg-glass-dark/50 animate-float">
                <Link to="/topup">
                  <Wallet className="mr-1 h-4 w-4" />
                  Top Up
                </Link>
              </Button>
            </div>
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
      
      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-glass-dark/95 backdrop-blur-md border-b border-glass-light/10 p-4 flex flex-col gap-2 animate-slide-in">
          <Button variant="ghost" asChild className="w-full justify-start text-glass-light hover:text-white hover:bg-glass-dark/50"
            onClick={() => setMobileMenuOpen(false)}>
            <Link to="/">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full justify-start text-glass-light hover:text-white hover:bg-glass-dark/50"
            onClick={() => setMobileMenuOpen(false)}>
            <Link to="/contributors">Contributors</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" asChild className="w-full justify-start text-glass-light hover:text-white hover:bg-glass-dark/50"
                onClick={() => setMobileMenuOpen(false)}>
                <Link to="/topup">
                  <Wallet className="mr-2 h-4 w-4" />
                  Top Up ({profile?.balance.toFixed(0)} THB)
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-glass-light hover:text-white hover:bg-glass-dark/50">
                    <User className="mr-2 h-4 w-4" />
                    {profile?.nickname || profile?.username || 'Profile'}
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-glass-dark border border-glass-light/20 text-white">
                  <DropdownMenuLabel>Purchase History</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-glass-light/20" />
                  {purchaseHistory.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto">
                      {purchaseHistory.slice(0, 5).map((purchase) => (
                        <DropdownMenuItem key={purchase.id} className="flex flex-col items-start gap-1 cursor-default focus:bg-transparent">
                          <span className="text-sm font-medium text-white">{purchase.item_name}</span>
                          <div className="flex justify-between w-full text-xs">
                            <span className="text-pink-400">{purchase.amount} THB</span>
                            <span className="text-glass-light">
                              {format(new Date(purchase.created_at), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 py-1 text-sm text-glass-light">No purchases yet</div>
                  )}
                  <DropdownMenuSeparator className="bg-glass-light/20" />
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer text-red-400"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="ghost" asChild className="w-full justify-start text-glass-light hover:text-white hover:bg-glass-dark/50"
              onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
