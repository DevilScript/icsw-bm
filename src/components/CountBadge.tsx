
import React from 'react';
import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count?: number;
  value?: string;
  color?: string;
  className?: string;
  label?: string;
}

const CountBadge = ({ count, value, color, className, label }: CountBadgeProps) => {
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
      color ? `bg-${color}-500/20 text-${color}-400` : 
        (count && count > 0 ? 'bg-glass-accent/20 text-glass-accent' : 'bg-glass-medium/30 text-glass-light'),
      className
    )}>
      <span className="font-bold text-lg">{value || count}</span>
      {label && <span className="text-glass-light">{label}</span>}
    </div>
  );
};

export default CountBadge;
