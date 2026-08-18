import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLink?: string;
}

export default function SectionHeader({
  title,
  icon: Icon,
  iconBgColor = 'bg-brand-50',
  iconTextColor = 'text-brand-600',
  actionLabel,
  onAction,
  actionLink,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`${iconBgColor} ${iconTextColor} p-1.5 rounded-lg`}>
            <Icon size={20} />
          </div>
        )}
        <h2 className="text-lg md:text-xl font-bold text-text">{title}</h2>
      </div>
      
      {actionLabel && (
        actionLink ? (
          <Link to={actionLink} className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors touch-target">
            {actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors touch-target">
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
