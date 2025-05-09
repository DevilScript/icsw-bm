
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminAuth from "./components/AdminAuth";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Contributors from '@/pages/Contributors';
import { AuthProvider } from './contexts/AuthContext';
import LoadingScreen from './components/LoadingScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Improve performance by preventing refetch on window focus
      staleTime: 5 * 60 * 1000, // 5 minutes of cache freshness
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    // After an appropriate amount of time, mark the initial load as complete
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {isInitialLoad && <LoadingScreen />}
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
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
