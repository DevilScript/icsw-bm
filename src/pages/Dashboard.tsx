
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, User, Flame } from 'lucide-react';
import IdWipeCounter, { ClanCount } from '@/components/IdWipeCounter';
import { useToast } from '@/hooks/use-toast';
import IdDetails from '@/components/IdDetails';
import GlassCard from '@/components/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/UserAuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogClose } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface RcData {
  rc: string;
  price: number;
}

interface ClanId {
  id: string;
  clan: string;
  price: number;
  user_id: string | null;
  user_pass: string | null;
  is_active: boolean;
  is_sold_out: boolean;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("clans");
  const [wipeData, setWipeData] = useState<ClanCount[]>([]);
  const [rcData, setRcData] = useState<RcData[]>([]);
  const [clanData, setClanData] = useState<ClanId[]>([]);
  const [selectedClan, setSelectedClan] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [selectedClanId, setSelectedClanId] = useState<ClanId | null>(null);
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch clan data from Supabase
        const { data: clanData, error: clanError } = await supabase
          .from('set_clan')
          .select('clan, faction, count')
          .order('faction', { ascending: true });

        if (clanError) {
          throw clanError;
        }

        const formattedClanData: ClanCount[] = clanData.map(item => ({
          clan: item.clan,
          faction: item.faction,
          count: item.count
        }));

        setWipeData(formattedClanData);

        // Fetch RC data from Supabase
        const { data: rcResult, error: rcError } = await supabase
          .from('set_rc')
          .select('rc, price')
          .order('price', { ascending: true });

        if (rcError) {
          throw rcError;
        }

        setRcData(rcResult);
        
        // Fetch clan ID data
        const { data: clanIdResult, error: clanIdError } = await supabase
          .from('set_clan_id')
          .select('*')
          .order('price', { ascending: true });
          
        if (clanIdError) {
          throw clanIdError;
        }
        
        setClanData(clanIdResult || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data from the server.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Setup real-time subscriptions for all tables
    const clanChannel = supabase
      .channel('clan-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'set_clan' 
      }, (payload) => {
        fetchData();
      })
      .subscribe();

    const idChannel = supabase
      .channel('id-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'set_id' 
      }, (payload) => {
        if (activeTab === "id") {
          fetchData();
        }
      })
      .subscribe();

    const rcChannel = supabase
      .channel('rc-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'set_rc' 
      }, (payload) => {
        if (activeTab === "rc") {
          fetchData();
        }
      })
      .subscribe();
      
    const clanIdChannel = supabase
      .channel('clan-id-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'set_clan_id' 
      }, (payload) => {
        fetchData();
      })
      .subscribe();

    // Set up visibility change listener to refresh data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up focus event to refresh data
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);

    // Setup poll interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      supabase.removeChannel(clanChannel);
      supabase.removeChannel(idChannel);
      supabase.removeChannel(rcChannel);
      supabase.removeChannel(clanIdChannel);
    };
  }, [toast, activeTab]);
  
  const handleClanSelect = (clan: string) => {
    const clanIds = clanData.filter(item => item.clan === clan && !item.is_sold_out && item.is_active);
    if (clanIds.length > 0) {
      setSelectedClan(clan);
      setSelectedClanId(clanIds[0]);
    } else {
      toast({
        title: "No available accounts",
        description: `No available ${clan} accounts found`,
        variant: "destructive"
      });
    }
  };
  
  const handlePurchase = async () => {
    if (!selectedClanId || !user || !profile) return;
    
    if (profile.balance < selectedClanId.price) {
      toast({
        title: "Insufficient balance",
        description: `You need ${selectedClanId.price} THB to purchase this clan account. Please top up your balance.`,
        variant: "destructive"
      });
      return;
    }
    
    setPurchaseLoading(true);
    
    try {
      // Step 1: Record the purchase
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          item_type: 'clan',
          item_name: `Clan: ${selectedClanId.clan}`,
          price: selectedClanId.price,
          login_id: selectedClanId.user_id,
          login_pass: selectedClanId.user_pass
        });

      if (purchaseError) throw purchaseError;

      // Step 2: Update the user's balance
      const { error: balanceError } = await supabase
        .from('set_user')
        .update({
          balance: profile.balance - selectedClanId.price,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Step 3: Mark the clan ID as sold out
      const { error: idError } = await supabase
        .from('set_clan_id')
        .update({
          is_sold_out: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClanId.id);

      if (idError) throw idError;

      // Step 4: Refresh profile to update balance
      await refreshProfile();
      
      setPurchaseSuccess(true);
      
      toast({
        title: "Purchase successful",
        description: `You've successfully purchased a ${selectedClanId.clan} account`,
      });
    } catch (error: any) {
      console.error('Error making purchase:', error);
      toast({
        title: "Purchase failed",
        description: error.message || "An error occurred during purchase",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-glass-dark">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="clans" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-glass-dark/40 backdrop-blur-sm border border-gray-700/20 shadow-lg shadow-gray-900/10">
              <TabsTrigger value="clans" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
                <Database className="w-4 h-4 mr-2" />
                Clans
              </TabsTrigger>
              <TabsTrigger value="id" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
                <User className="w-4 h-4 mr-2" />
                ID
              </TabsTrigger>
              <TabsTrigger value="rc" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
                <Flame className="w-4 h-4 mr-2" />
                Rc
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="clans" className="mt-0">
              <IdWipeCounter data={wipeData} loading={loading} onClanSelect={handleClanSelect} />
              
              <Dialog>
                <DialogTrigger asChild>
                  <div className="hidden">Open</div>
                </DialogTrigger>
                <DialogContent className="bg-glass-dark border border-gray-700/30 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Purchase {selectedClanId?.clan} Account</DialogTitle>
                    <DialogDescription className="text-glass-light">
                      Complete your purchase by clicking the button below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {purchaseSuccess ? (
                    <div className="py-4">
                      <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-lg text-center mb-4">
                        <p className="text-green-400 font-semibold">Purchase Successful!</p>
                        <p className="text-sm text-glass-light mt-2">
                          Check your purchase history for login details.
                        </p>
                      </div>
                      <div className="flex justify-center mt-4">
                        <Button asChild className="bg-gray-800 hover:bg-gray-700">
                          <a href="/history">View Purchase History</a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="py-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-glass-light">Clan:</span>
                          <span className="font-semibold">{selectedClanId?.clan}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-glass-light">Price:</span>
                          <span className="font-bold text-gray-300">{selectedClanId?.price} THB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-glass-light">Your Balance:</span>
                          <span className={`font-bold ${profile && profile?.balance >= (selectedClanId?.price || 0) ? 'text-green-400' : 'text-red-400'}`}>
                            {profile?.balance.toFixed(0)} THB
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                          <Button variant="outline" className="border-gray-700/30">Cancel</Button>
                        </DialogClose>
                        <Button 
                          onClick={handlePurchase}
                          disabled={purchaseLoading || !profile || !selectedClanId || profile.balance < selectedClanId.price}
                          className={`${profile && selectedClanId && profile.balance >= selectedClanId.price ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-600 cursor-not-allowed'}`}
                        >
                          {purchaseLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                            </>
                          ) : !profile ? (
                            'Please log in'
                          ) : profile.balance < (selectedClanId?.price || 0) ? (
                            'Insufficient Balance'
                          ) : (
                            'Purchase'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="id" className="mt-0">
              <IdDetails />
            </TabsContent>

            <TabsContent value="rc" className="mt-0">
              <GlassCard className="relative max-w-xs w-full mx-auto border border-gray-700/30 shadow-lg shadow-gray-900/10 p-6">
                <div className="absolute inset-0 rounded-lg border border-gray-700/30 animate-border-glow pointer-events-none"></div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-glass-light font-medium">
                    <span>Rc</span>
                    <span>Price</span>
                  </div>
                  {loading ? (
                    <div className="text-center py-4 text-glass-light">Loading...</div>
                  ) : (
                    rcData.map((item, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4">
                        <span className="text-white font-medium">{item.rc}</span>
                        <span className="text-glass-light">
                          $<span className="text-gray-300 font-bold animate-pulse-grow">{item.price}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <a
                  href="https://www.facebook.com/is.Moyx"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="rc-buy-link"
                  className="relative z-10 inline-block bg-gray-800/80 hover:bg-gray-700 text-white font-bold border border-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gray-900/20 px-4 py-1.5 rounded-full text-sm mt-6"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  Purchase
                </a>
              </GlassCard>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
