
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

const GlassCard = ({ children, className, animate = false, onClick }: GlassCardProps) => {
  return (
    <div 
      className={cn(
        'glass-panel p-6', 
        animate ? 'animate-fade-in' : '',
        onClick ? 'cursor-pointer hover:scale-105 transition-all duration-300' : '',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
