import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';

export interface IdData {
  id: string;
  clan: string;
  kagune: string;
  isKaguneV2: boolean;
  rank: string;
  rc: number;
  gp: number;
  price: number;
  isActive: boolean;
  link?: string;
}

const IdDetails = () => {
  const [idData, setIdData] = useState<IdData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadIdData = () => {
      const storedData = localStorage.getItem('idData');
      let data: IdData[] = [];

      if (storedData) {
        try {
          data = JSON.parse(storedData);
          data = data.map(item => ({
            ...item,
            link: item.link && isValidUrl(item.link) ? item.link : 'https://www.facebook.com/is.Moyx'
          }));
          console.log('Loaded idData from localStorage:', data);
        } catch (error) {
          console.error('Error parsing idData from localStorage:', error);
          toast({
            title: "Error",
            description: "Failed to load ID data.",
            variant: "destructive",
            duration: 7000,
          });
        }
      }

      setIdData(data.filter(item => item.isActive));
      setLoading(false);
    };

    loadIdData();
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
              <h3 className="text-xl font-bold text-white">{data.id}</h3>
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
                  {data.isKaguneV2 && (
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
                    console.log('To Buy clicked, opening link:', data.link);
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