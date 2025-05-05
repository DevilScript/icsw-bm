
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full text-center py-12 animate-float">
        <h1 className="text-6xl font-bold text-glass-accent mb-4">404</h1>
        <p className="text-xl text-glass-light mb-6">Oops! Page not found</p>
        <Button asChild className="bg-glass-accent hover:bg-glass-accent/80 text-white">
          <a href="/">Return to Dashboard</a>
        </Button>
      </GlassCard>
    </div>
  );
};

export default NotFound;
