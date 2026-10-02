import React from 'react';
import { ComplaintCategory } from '../../types';
import {
  Zap,
  Droplet,
  Sparkles,
  School,
  FlaskConical,
  Wifi,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface CategoryIconProps {
  category: ComplaintCategory;
  className?: string;
  showBackground?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  className = 'w-4 h-4',
  showBackground = false,
}) => {
  const getIcon = () => {
    switch (category) {
      case 'Electrical':
        return <Zap className={className} />;
      case 'Water':
        return <Droplet className={className} />;
      case 'Cleaning':
        return <Sparkles className={className} />;
      case 'Classroom':
        return <School className={className} />;
      case 'Laboratory':
        return <FlaskConical className={className} />;
      case 'Internet':
        return <Wifi className={className} />;
      case 'Safety':
        return <ShieldCheck className={className} />;
      case 'Other':
      default:
        return <HelpCircle className={className} />;
    }
  };

  const getColorStyles = () => {
    switch (category) {
      case 'Electrical':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Water':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Cleaning':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'Classroom':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Laboratory':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Internet':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Safety':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Other':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (showBackground) {
    return (
      <div className={`p-2 rounded-xl border flex items-center justify-center ${getColorStyles()}`}>
        {getIcon()}
      </div>
    );
  }

  return getIcon();
};
