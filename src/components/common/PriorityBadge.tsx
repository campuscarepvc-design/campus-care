import React from 'react';
import { ComplaintPriority } from '../../types';
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  switch (priority) {
    case 'Critical':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200/90 font-bold ${sizeClasses}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          Critical
        </span>
      );
    case 'High':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-semibold ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          High
        </span>
      );
    case 'Medium':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-medium ${sizeClasses}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-sky-600" />
          Medium
        </span>
      );
    case 'Low':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium ${sizeClasses}`}
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Low
        </span>
      );
    default:
      return null;
  }
};
