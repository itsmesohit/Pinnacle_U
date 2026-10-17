import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    outline: 'border border-border text-foreground',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-semibold tracking-wide',
    md: 'text-xs px-2.5 py-1 rounded-md font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border transition-colors select-none capitalize',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'secondary', label: 'Inactive' },
    graduated: { variant: 'info', label: 'Graduated' },
    suspended: { variant: 'destructive', label: 'Suspended' },
    enrolled: { variant: 'success', label: 'Enrolled' },
    dropped: { variant: 'destructive', label: 'Dropped' },
    completed: { variant: 'info', label: 'Completed' },
    present: { variant: 'success', label: 'Present' },
    absent: { variant: 'destructive', label: 'Absent' },
    late: { variant: 'warning', label: 'Late' },
    excused: { variant: 'secondary', label: 'Excused' },
    on_leave: { variant: 'warning', label: 'On Leave' },
    retired: { variant: 'secondary', label: 'Retired' },
    terminated: { variant: 'destructive', label: 'Terminated' },
    upcoming: { variant: 'warning', label: 'Upcoming' },
  };

  const info = map[status.toLowerCase()] || { variant: 'default', label: status };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
