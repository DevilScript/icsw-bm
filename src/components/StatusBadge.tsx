
import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface StatusBadgeProps {
  isActive: boolean;
  className?: string;
  label?: string;
}

const StatusBadge = ({ isActive, className, label }: StatusBadgeProps) => {
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
      isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400',
      className
    )}>
      {isActive ? (
        <Check size={16} className="animate-pulse" />
      ) : (
        <X size={16} />
      )}
      <span>{label || (isActive ? 'Active' : 'Inactive')}</span>
    </div>
  );
};

export default StatusBadge;
