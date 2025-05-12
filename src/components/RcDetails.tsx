
import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import PurchaseButton from './PurchaseButton';

interface RcData {
  id: string;
  rc: string;
  price: number;
}

const RcDetails = () => {
  const [rcData, setRcData] = useState<RcData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch RC data from Supabase
        const { data: rcResult, error: rcError } = await supabase
          .from('set_rc')
          .select('id, rc, price')
          .order('price', { ascending: true });

        if (rcError) {
          throw rcError;
        }

        setRcData(rcResult);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load RC data from the server.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Setup real-time subscription
    const rcChannel = supabase
      .channel('rc-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'set_rc' 
      }, () => {
        fetchData();
      })
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(rcChannel);
    };
  }, [toast]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
      {loading ? (
        <div className="col-span-full flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      ) : (
        rcData.map((item) => (
          <GlassCard key={item.id} className="relative border border-pink-300/30 shadow-lg shadow-pink-500/10 p-6">
            <div className="absolute inset-0 rounded-lg border border-pink-300/30 animate-border-glow pointer-events-none"></div>
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Flame className="h-8 w-8 text-pink-400" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">{item.rc} RC</h3>
                <p className="text-pink-400 font-bold text-lg mt-1">
                  ${item.price}
                </p>
              </div>
              
              <div className="pt-2 flex justify-center">
                {!user ? (
                  <a
                    href="/auth"
                    className="inline-block bg-pink-300/20 hover:bg-pink-300/30 text-pink-300 font-bold border border-pink-300/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-300/20 px-4 py-1.5 rounded-full text-sm"
                  >
                    Login to Purchase
                  </a>
                ) : (
                  <PurchaseButton 
                    itemId={item.id}
                    itemName={`${item.rc} RC`}
                    price={item.price}
                  />
                )}
              </div>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
};

export default RcDetails;
