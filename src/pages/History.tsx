
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/UserAuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Purchase {
  id: string;
  item_type: string;
  item_name: string;
  price: number;
  login_id: string | null;
  login_pass: string | null;
  purchased_at: string;
}

const History = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .order('purchased_at', { ascending: false });

        if (error) {
          throw error;
        }

        setPurchases(data || []);
      } catch (error: any) {
        console.error('Error fetching purchases:', error);
        toast({
          title: 'Error',
          description: 'Failed to load purchase history',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user, toast]);

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-glass-dark">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Purchase History</h1>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : purchases.length > 0 ? (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div 
                key={purchase.id} 
                className="bg-glass-dark/60 border border-gray-700/30 rounded-lg p-4 shadow-lg backdrop-blur-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{purchase.item_name}</h2>
                    <p className="text-glass-light text-sm">{purchase.item_type.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-300">{purchase.price} THB</p>
                    <p className="text-glass-light text-xs">
                      {format(new Date(purchase.purchased_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
                
                {purchase.login_id && purchase.login_pass && (
                  <div className="mt-4 pt-3 border-t border-gray-700/30">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Access Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-900/50 p-2 rounded">
                        <p className="text-xs text-glass-light">Login ID</p>
                        <p className="text-sm font-mono text-white break-all">{purchase.login_id}</p>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded">
                        <p className="text-xs text-glass-light">Password</p>
                        <p className="text-sm font-mono text-white break-all">{purchase.login_pass}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-glass-dark/40 rounded-lg border border-gray-700/30">
            <h2 className="text-xl text-glass-light">No purchase history found</h2>
            <p className="text-glass-light mt-2">Your purchases will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
