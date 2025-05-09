
import React, { useEffect, useState } from 'react';
import { PuffLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onLoadComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // When progress reaches 100%, wait a bit then hide
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
        if (onLoadComplete) onLoadComplete();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [progress, onLoadComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex flex-col items-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-6xl font-bold mb-8 relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-400">
                ICSW
              </span>
              <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-300/0 via-pink-300 to-pink-300/0"></div>
            </div>
            
            <PuffLoader color="#ec4899" size={60} speedMultiplier={1.2} />
            
            <div className="mt-8 w-64 relative">
              <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-pink-300 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>
              <div className="mt-2 text-sm text-pink-300 text-center">
                Loading... {Math.round(progress)}%
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
