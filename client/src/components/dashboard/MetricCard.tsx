import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label: string;
  };
  iconBgColor?: string;
  iconColor?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  iconBgColor = 'bg-primary-100',
  iconColor = 'text-primary-600',
  onClick
}) => {
  return (
    <div 
      className={cn(
        "relative bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm ring-1 ring-slate-200/60 rounded-xl",
        "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-blue-600",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      )}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-lg p-3 shadow-sm ring-1 ring-inset ring-white/40", iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-xl font-medium text-neutral-500 whitespace-normal">
                {title}
              </dt>
              <dd>
                <div className="text-3xl font-semibold text-neutral-900 tabular-nums">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
          {onClick && (
            <div className="flex-shrink-0 self-start ml-2 text-neutral-400 opacity-0 group-hover:opacity-100">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 border-t border-slate-100 px-5 py-3">
        <div className="flex items-center justify-between h-6">
          {trend && (
            <div className="flex items-center overflow-hidden mr-2">
              <span className={cn(
                "font-medium mr-2 flex items-center flex-shrink-0",
                trend.isPositive ? 'text-success' : 'text-error'
              )}>
                <svg 
                  className="h-4 w-4 mr-1" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d={trend.isPositive 
                      ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                      : "M19 14l-7 7m0 0l-7-7m7 7V3"
                    } 
                  />
                </svg>
                {trend.value}
              </span>
              <span className="text-neutral-600 truncate text-xl">{trend.label}</span>
            </div>
          )}
          {onClick && (
            <span className="text-primary-600 font-medium text-base whitespace-nowrap ml-auto">
              Click for details
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
