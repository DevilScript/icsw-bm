
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
          // Load set_id data
          supabase.from('set_id').select('count').limit(1),
          // Load set_rc data
          supabase.from('set_rc').select('count').limit(1),
          // Load set_clan data
          supabase.from('set_clan').select('count').limit(1),
          // Simulate loading assets
          new Promise(resolve => setTimeout(resolve, 500))
        ];
        
        // Update progress as promises resolve
        let completed = 0;
        const totalTasks = promises.length;
        
        // Create a promise for each task that updates the progress
        const progressPromises = promises.map(promise => 
          Promise.resolve(promise).then(() => {
            completed++;
            setProgress(Math.floor((completed / totalTasks) * 100));
          })
        );
        
        // Wait for all promises to resolve
        await Promise.all(progressPromises);
        
        // Small delay before hiding the loading screen for better UX
        setTimeout(() => {
          setIsLoaded(true);
          
          // After animation completes, update body style
          setTimeout(() => {
            document.body.style.overflow = 'auto';
          }, 1000);
        }, 500);
      } catch (error) {
        console.error('Error loading resources:', error);
        // If there's an error, still hide the loading screen after a delay
        setTimeout(() => {
          setIsLoaded(true);
          document.body.style.overflow = 'auto';
        }, 2000);
      }
    };
    
    // Prevent scrolling during loading
    document.body.style.overflow = 'hidden';
    
    loadResources();
  }, []);
  
  return (
    <div 
      className={`fixed top-0 left-0 w-full h-full bg-black z-50 flex flex-col justify-center items-center transition-opacity duration-1000 ${
        isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-6xl font-bold text-white">
            ICS
            <span className="text-pink-300 animate-pulse-glow">
              W
            </span>
          </h1>
        </div>
        
        <div className="w-64 h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-300 to-pink-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-white text-sm">Loading... {progress}%</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
