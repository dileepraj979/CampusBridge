import React from 'react';
import clsx from 'clsx';

export function Badge({ children, variant = 'neutral', size = 'sm', className = '', dot = false }) {
  const variantStyles = {
    neutral: 'bg-white/5 text-slate-300 border-white/10',
    primary: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    primary: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400 animate-pulse',
    rose: 'bg-rose-400',
    purple: 'bg-purple-400'
  };

  const sizeStyles = {
    xs: 'text-[11px] px-1.5 py-0.5 font-medium',
    sm: 'text-xs px-2.5 py-1 font-medium',
    md: 'text-sm px-3 py-1.5 font-medium'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border tracking-wide transition-colors',
        variantStyles[variant] || variantStyles.neutral,
        sizeStyles[size] || sizeStyles.sm,
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant] || dotColors.neutral)} />}
      {children}
    </span>
  );
}

export default Badge;
