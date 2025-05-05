import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, User, Flame } from 'lucide-react';
import IdWipeCounter, { ClanCount } from '@/components/IdWipeCounter';
import { useToast } from '@/hooks/use-toast';
import IdDetails from '@/components/IdDetails';
import GlassCard from '@/components/GlassCard';

// Mock data for wipe
const mockWipeData: ClanCount[] = [
  { clan: "Arima", faction: "CCG", count: 0 },
  { clan: "Suzuya", faction: "CCG", count: 0 },
  { clan: "Yoshimura", faction: "Ghoul", count: 2 },
  { clan: "Kaneki", faction: "Ghoul", count: 5 },
];

// Mock data for RC
interface RcData {
  rc: string;
  price: number;
}

const mockRcData: RcData[] = [
  { rc: "8.5M", price: 50 },
  { rc: "13M", price: 90 },
  { rc: "26M", price: 150 },
  { rc: "37M", price: 220 },
  { rc: "75M", price: 330 },
  { rc: "95M", price: 420 },
  { rc: "190M", price: 850 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("clans");
  const [wipeData, setWipeData] = useState<ClanCount[]>(mockWipeData);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Auto-refresh data when the component gains focus
  useEffect(() => {
    const loadData = () => {
      const storedWipeData = localStorage.getItem('wipeData');
      if (storedWipeData) {
        setWipeData(JSON.parse(storedWipeData));
      }
    };

    // Load data on mount
    loadData();

    // Set up visibility change listener to refresh data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up focus event to refresh data
    const handleFocus = () => {
      loadData();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes pulse-grow {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-pulse-grow {
            animation: pulse-grow 2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-glass-dark">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="clans" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-glass-dark/40 backdrop-blur-sm border border-pink-300/20 shadow-lg shadow-pink-500/10">
                <TabsTrigger value="clans" className="data-[state=active]:bg-pink-500/80 data-[state=active]:text-white">
                  <Database className="w-4 h-4 mr-2" />
                  Clans
                </TabsTrigger>
                <TabsTrigger value="id" className="data-[state=active]:bg-pink-500/80 data-[state=active]:text-white">
                  <User className="w-4 h-4 mr-2" />
                  ID
                </TabsTrigger>
                <TabsTrigger value="rc" className="data-[state=active]:bg-pink-500/80 data-[state=active]:text-white">
                  <Flame className="w-4 h-4 mr-2" />
                  Rc
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-6">
              <TabsContent value="clans" className="mt-0">
                <IdWipeCounter data={wipeData} loading={loading} />
              </TabsContent>

              <TabsContent value="id" className="mt-0">
                <IdDetails />
              </TabsContent>

              <TabsContent value="rc" className="mt-0">
                <GlassCard className="relative max-w-xs w-full mx-auto border border-pink-300/30 shadow-lg shadow-pink-500/10 p-6">
                  <div className="absolute inset-0 rounded-lg border border-pink-300/30 animate-border-glow pointer-events-none"></div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-glass-light font-medium">
                      <span>Rc</span>
                      <span>Price</span>
                    </div>
                    {mockRcData.map((item, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4">
                        <span className="text-white font-medium">{item.rc}</span>
                        <span className="text-glass-light">
                          $<span className="text-pink-300 font-bold animate-pulse-grow">{item.price}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="https://www.facebook.com/is.Moyx"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="rc-buy-link"
                    className="relative z-10 inline-block bg-pink-300/20 hover:bg-pink-300/30 text-pink-300 font-bold border border-pink-300/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-300/20 px-4 py-1.5 rounded-full text-sm mt-6"
                    onClick={(e) => {
                      console.log('To Buy RC clicked, opening link: https://www.facebook.com/is.Moyx');
                      e.stopPropagation();
                    }}
                  >
                    To Buy
                  </a>
                </GlassCard>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Dashboard;