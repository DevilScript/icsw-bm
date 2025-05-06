
import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface IdData {
  id: string;
  game_id: string;
  clan: string;
  kagune: string;
  is_kagune_v2: boolean;
  rank: string;
  rc: number;
  gp: number;
  price: number;
  is_active: boolean;
  link?: string;
}

const IdDetails = () => {
  const [idData, setIdData] = useState<IdData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadIdData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('set_id')
          .select('*')
          .eq('is_active', true);

        if (error) {
          throw error;
        }

        setIdData(data || []);
      } catch (error) {
        console.error('Error fetching ID data:', error);
        toast({
          title: "Error",
          description: "Failed to load ID data from the server.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadIdData();

    // Setup real-time subscription for ID table
    const idChannel = supabase
      .channel('id-details-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'set_id' 
      }, (payload) => {
        loadIdData(); // Reload data when changes occur
      })
      .subscribe();

    // Setup visibility and focus handlers for real-time updates
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadIdData();
      }
    };

    const handleFocus = () => {
      loadIdData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Auto-refresh data every 30 seconds
    const intervalId = setInterval(() => {
      loadIdData();
    }, 30000);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      supabase.removeChannel(idChannel);
    };
  }, [toast]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <GlassCard className="min-h-[200px] flex items-center justify-center animate-pulse">
        <div className="text-glass-light">Loading ID data...</div>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {idData.length === 0 ? (
        <div className="col-span-full flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p className="text-2xl font-bold text-glass-light">Out of ID. Please wait.</p>
        </div>
      ) : (
        idData.map((data) => (
          <GlassCard
            key={data.id}
            className="relative overflow-visible border border-pink-300/30 shadow-lg shadow-pink-500/10 bordered-glow"
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">{data.game_id}</h3>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-glass-light">Clan:</span>
                <span className="font-medium text-white">{data.clan}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-glass-light">Kagune:</span>
                <span className="font-medium text-white">
                  {data.kagune}
                  {data.is_kagune_v2 && (
                    <span className="ml-1 inline-flex items-center justify-center h-4 w-4 text-xs bg-green-300/20 text-green-300 rounded-full">
                      v2
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-glass-light">Rank:</span>
                <span className="font-medium text-pink-300">{data.rank}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-glass-light">RC:</span>
                <span className="font-medium text-white">{data.rc.toLocaleString()}M</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-glass-light">GP:</span>
                <span className="font-medium text-white">{data.gp.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 gap-4">
              {data.link && isValidUrl(data.link) ? (
                <a
                  href={data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="buy-link"
                  className="relative z-10 bg-pink-300/20 hover:bg-pink-300/30 text-pink-300 font-bold border border-pink-300/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-300/20 px-4 py-1.5 rounded-full text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  To Buy
                </a>
              ) : (
                <span className="text-glass-light text-sm">No purchase link available</span>
              )}

              <div className="min-w-[60px] bg-pink-300/20 px-4 py-1.5 rounded-full border border-pink-300/30 hover:bg-pink-300/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-300/20 text-center">
                <span className="text-pink-300 font-bold text-sm">${data.price}</span>
              </div>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
};

export default IdDetails;
