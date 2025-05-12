
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import CountBadge from './CountBadge';
import { Button } from '@/components/ui/button';
import PurchaseButton from './PurchaseButton';
import { useAuth } from '@/contexts/UserAuthContext';

interface IdDetail {
  id: string;
  game_id: string;
  gp: number;
  price: number;
  clan: string;
  kagune: string;
  rank: string;
  rc: number;
  is_kagune_v2: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  link?: string | null;
}

const IdDetails = () => {
  const [idDetails, setIdDetails] = useState<IdDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<IdDetail | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchIdDetails();

    // Set up real-time subscription
    const channel = supabase
      .channel('id-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'set_id' 
      }, () => {
        fetchIdDetails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIdDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('set_id')
        .select('*')
        .order('rank', { ascending: false })
        .order('gp', { ascending: false });

      if (error) {
        throw error;
      }

      setIdDetails(data || []);
    } catch (error) {
      console.error('Error fetching ID details:', error);
      toast({
        title: "Error",
        description: "Failed to load ID data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (id: IdDetail) => {
    setSelectedId(id);
    setPurchaseSuccess(false);
  };

  const handlePurchaseComplete = () => {
    setPurchaseSuccess(true);
    // Refresh the data to make sure everything is up to date
    fetchIdDetails();
  };

  const handleCloseModal = () => {
    setSelectedId(null);
    setPurchaseSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {idDetails.map((id) => (
          <GlassCard 
            key={id.id} 
            className={`${id.is_sold_out ? 'opacity-50' : ''} cursor-pointer transition-transform hover:scale-105`}
            onClick={() => handleRowClick(id)}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{id.game_id}</h3>
                  <p className="text-glass-light">Clan: {id.clan}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <StatusBadge status={id.is_active && !id.is_sold_out ? "active" : "inactive"} />
                  {id.is_kagune_v2 && (
                    <CountBadge value="V2" color="indigo" />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="flex flex-col">
                  <span className="text-glass-light">Kagune</span>
                  <span className="text-white">{id.kagune}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-glass-light">Rank</span>
                  <span className="text-white">{id.rank}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-glass-light">GP</span>
                  <span className="text-white">{id.gp}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-glass-light">RC</span>
                  <span className="text-white">{id.rc}</span>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-glass-light/20">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-pink-400">{id.price} THB</span>
                  {id.is_sold_out ? (
                    <span className="text-glass-light px-4 py-1 rounded-full bg-glass-dark/50">Sold Out</span>
                  ) : !user ? (
                    <Button className="bg-pink-500 hover:bg-pink-600 rounded-full text-sm" asChild>
                      <a href="/auth">Login to Purchase</a>
                    </Button>
                  ) : (
                    <Button className="bg-pink-500 hover:bg-pink-600 rounded-full text-sm">
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Modal for ID details */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-glass-dark border border-glass-light/20 rounded-lg shadow-xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">{selectedId.game_id}</h3>
              <StatusBadge status={selectedId.is_active && !selectedId.is_sold_out ? "active" : "inactive"} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-glass-light mb-1">Clan</p>
                <p className="text-white font-medium">{selectedId.clan}</p>
              </div>
              <div>
                <p className="text-glass-light mb-1">Kagune</p>
                <p className="text-white font-medium">{selectedId.kagune}</p>
              </div>
              <div>
                <p className="text-glass-light mb-1">Rank</p>
                <p className="text-white font-medium">{selectedId.rank}</p>
              </div>
              <div>
                <p className="text-glass-light mb-1">RC</p>
                <p className="text-white font-medium">{selectedId.rc}</p>
              </div>
              <div>
                <p className="text-glass-light mb-1">GP</p>
                <p className="text-white font-medium">{selectedId.gp}</p>
              </div>
              <div>
                <p className="text-glass-light mb-1">Kagune Version</p>
                <p className="text-white font-medium">{selectedId.is_kagune_v2 ? "V2" : "V1"}</p>
              </div>
            </div>
            
            <div className="border-t border-glass-light/20 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-pink-400">{selectedId.price} THB</span>
              </div>
              
              {purchaseSuccess ? (
                <div className="text-center p-4 bg-green-500/20 border border-green-500/30 rounded-md mb-4">
                  <p className="text-green-400 font-medium">Purchase successful!</p>
                  {selectedId.link && (
                    <a 
                      href={selectedId.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-400 underline block mt-2"
                    >
                      View access details
                    </a>
                  )}
                </div>
              ) : selectedId.is_sold_out ? (
                <div className="text-center p-4 bg-red-500/20 border border-red-500/30 rounded-md mb-4">
                  <p className="text-red-400 font-medium">This item is sold out</p>
                </div>
              ) : (
                user && (
                  <div className="flex justify-center">
                    <PurchaseButton 
                      itemId={selectedId.id}
                      itemName={`ID: ${selectedId.game_id} (${selectedId.clan}, ${selectedId.kagune})`}
                      price={selectedId.price}
                      onPurchaseComplete={handlePurchaseComplete}
                    />
                  </div>
                )
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCloseModal}
                  className="border-glass-light/20 hover:bg-glass-light/10 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdDetails;
