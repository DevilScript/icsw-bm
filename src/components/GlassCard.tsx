
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

const GlassCard = ({ children, className, animate = false }: GlassCardProps) => {
  return (
    <div className={cn(
      'glass-panel p-6', 
      animate ? 'animate-fade-in' : '',
      className
    )}>
      {children}
    </div>
  );
};

export default GlassCard;