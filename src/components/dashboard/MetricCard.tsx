import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'critical' | 'warning' | 'healthy' | 'neutral' | 'interactive';
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  critical: 'bg-red-600 text-white border-red-700',
  warning: 'bg-amber-500 text-white border-amber-600',
  healthy: 'bg-green-600 text-white border-green-700',
  neutral: 'bg-card text-foreground border-border',
  interactive: 'bg-card text-foreground border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer',
};

export function MetricCard({
  label,
  value,
  sublabel,
  variant = 'neutral',
  icon: Icon,
  onClick,
  className = '',
}: MetricCardProps) {
  const Component = onClick ? 'button' : 'div';
  const isLight = variant === 'neutral' || variant === 'interactive';

  return (
    <Component
      onClick={onClick}
      className={`
        px-6 py-4 rounded-lg border transition-all
        ${variantStyles[variant]}
        ${onClick ? 'hover:shadow-md' : ''}
        ${className}
      `}
      {...(onClick && { type: 'button' })}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isLight ? 'text-muted-foreground' : 'text-white/80'}`}>
            {label}
          </p>
          <p className="text-3xl font-bold mt-1">
            {value}
          </p>
          {sublabel && (
            <p className={`text-xs mt-1 ${isLight ? 'text-muted-foreground' : 'text-white/70'}`}>
              {sublabel}
            </p>
          )}
        </div>
        {Icon && (
          <Icon className={`w-6 h-6 flex-shrink-0 ml-4 ${isLight ? 'text-muted-foreground' : 'text-white/80'}`} />
        )}
      </div>
    </Component>
  );
}
