import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadResources = async () => {
      try {
        // Simulate loading data from Supabase
        const promises = [
          supabase.from('set_id').select('count').limit(1),
          supabase.from('set_rc').select('count').limit(1),
          supabase.from('set_clan').select('count').limit(1),
          new Promise(resolve => setTimeout(resolve, 500)),
        ];

        // Update progress as promises resolve
        let completed = 0;
        const totalTasks = promises.length;

        const progressPromises = promises.map(promise =>
          Promise.resolve(promise).then(() => {
            completed++;
            setProgress(Math.floor((completed / totalTasks) * 100));
          })
        );

        await Promise.all(progressPromises);

        // Small delay before hiding the loading screen
        setTimeout(() => {
          setIsLoaded(true);
          setTimeout(() => {
            document.body.style.overflow = 'auto';
          }, 1000);
        }, 500);
      } catch (error) {
        console.error('Error loading resources:', error);
        setTimeout(() => {
          setIsLoaded(true);
          document.body.style.overflow = 'auto';
        }, 2000);
      }
    };

    document.body.style.overflow = 'hidden';
    loadResources();

    // Cleanup to ensure body style is reset
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 w-full h-full bg-black z-[9999] flex flex-col justify-center items-center transition-opacity duration-1000 ${
        isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ display: isLoaded ? 'none' : 'flex' }} // Ensure hidden when loaded
    >
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-6xl font-bold text-white">
            ICS
            <span className="text-pink-300 animate-pulse-glow">W</span>
          </h1>
        </div>

        <div className="w-64 h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-300 to-pink-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-white text-sm">{progress}%</p>
      </div>
    </div>
  );
};

export default LoadingScreen;