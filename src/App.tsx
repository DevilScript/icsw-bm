
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminAuth from "./components/AdminAuth";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Contributors from '@/pages/Contributors';
import LoadingScreen from "./components/LoadingScreen";

// Create a QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Define the App component as a function component
const App = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appReady, setAppReady] = useState<boolean>(false);

  useEffect(() => {
    const loadApp = async () => {
      try {
        // Add a minimum loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mark app as loaded
        setIsLoading(false);
        
        // Small delay before showing content for smooth transition
        setTimeout(() => setAppReady(true), 500);
      } catch (error) {
        console.error("Error during app initialization:", error);
        setIsLoading(false);
        setAppReady(true);
      }
    };
    
    loadApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Loading screen */}
        {isLoading && <LoadingScreen onLoadComplete={() => setIsLoading(false)} />}
        
        {/* Main app content */}
        <AnimatePresence>
          {appReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen bg-glass-dark"
            >
              <BrowserRouter>
                <Navbar />
                <div className="pt-16"> {/* Add padding for fixed navbar */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/contributors" element={<Contributors />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin-auth" element={<AdminAuth />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </BrowserRouter>
            </motion.div>
          )}
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
