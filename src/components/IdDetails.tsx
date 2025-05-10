import React, { useState, useEffect } from 'react';
import { XCircle, Lock } from 'lucide-react';
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
  is_sold_out: boolean;
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
        toast({
          title: "Error",
          description: "Failed to load ID data from the server.",
          variant: "destructive",
          duration: 7000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadIdData();

    const idChannel = supabase
      .channel('id-details-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'set_id' },
        () => {
          loadIdData();
        }
      )
      .subscribe();

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

    const intervalId = setInterval(() => {
      loadIdData();
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      supabase.removeChannel(idChannel);
    };
  }, [toast]);

  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
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
            className={`relative overflow-visible border border-pink-300/30 shadow-lg shadow-pink-500/10 transition-all duration-500 ${
              data.is_sold_out
                ? 'cursor-not-allowed animate-sold-out'
                : 'hover:scale-105 hover:shadow-pink-300/20'
            } ${data.is_sold_out ? 'sold-out-glow' : ''}`}
          >
            {data.is_sold_out && (
              <>
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-300 text-white p-2 rounded-full flex items-center animate-shake-slow z-20 shadow-lg shadow-red-500/30">
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-pink-900/30 backdrop-blur-sm rounded-lg pointer-events-none z-10"></div>
              </>
            )}
            <div className="relative z-20 mb-4">
              <h3 className={`text-xl font-semibold ${data.is_sold_out ? 'text-red-400 text-shadow-red' : 'text-white'}`}>
                {data.game_id}
              </h3>
            </div>

            <div className="relative z-20 space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-glass-light">Clan:</span>
                <span className="font-medium text-white">{data.clan}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-glass-light">Weapon:</span>
                <span className="font-medium text-white">
                  {data.kagune || 'None'}
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

            <div className="relative z-20 flex justify-between items-center mt-4 gap-4">
              {data.is_sold_out ? (
                <span className="text-red-400 font-medium text-sm flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  This ID is sold out
                </span>
              ) : data.link && isValidUrl(data.link) ? (
                <a
                  href={data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="buy-link"
                  className="bg-pink-300/20 hover:bg-pink-300/30 text-pink-300 font-bold border border-pink-300/30 px-4 py-1.5 rounded-full text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-300/20"
                >
                  To Buy
                </a>
              ) : (
                <span className="text-glass-light text-sm">No purchase link available</span>
              )}

              <div
                className={`min-w-[60px] bg-pink-300/20 px-4 py-1.5 rounded-full border border-pink-300/30 text-center transition-all duration-300 ${
                  data.is_sold_out ? 'opacity-50' : 'hover:bg-pink-300/30 hover:scale-105 hover:shadow-lg hover:shadow-pink-300/20'
                }`}
              >
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