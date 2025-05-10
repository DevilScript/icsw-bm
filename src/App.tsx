import React, { useState, useEffect } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleLoaded = () => {
    setIsInitialLoad(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          {isInitialLoad ? (
            <LoadingScreen onLoaded={handleLoaded} />
          ) : (
            <BrowserRouter>
              <Navbar />
              <div className="pt-16">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/contributors" element={<Contributors />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin-auth" element={<AdminAuth />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;