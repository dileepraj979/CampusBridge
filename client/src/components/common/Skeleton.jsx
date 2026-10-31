import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className = '', variant = 'text' }) {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    card: 'h-36 w-full rounded-2xl',
    chart: 'h-64 w-full rounded-2xl'
  };

  return (
    <div
      className={clsx(
        'skeleton-shimmer',
        variantStyles[variant] || 'rounded',
        className
      )}
    />
  );
}

export function BentoSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-6 animate-pulse">
      <div className="col-span-12 md:col-span-8 h-80 rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <Skeleton className="w-1/3 h-6 mb-4" />
        <Skeleton className="w-full h-56" variant="chart" />
      </div>
      <div className="col-span-12 md:col-span-4 h-80 rounded-2xl bg-white/[0.03] border border-white/5 p-6 space-y-4">
        <Skeleton className="w-1/2 h-6" />
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
      </div>
      <div className="col-span-12 md:col-span-4 h-48 rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <Skeleton className="w-1/2 h-5 mb-3" />
        <Skeleton className="w-3/4 h-10 mb-2" />
        <Skeleton className="w-1/3 h-4" />
      </div>
      <div className="col-span-12 md:col-span-4 h-48 rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <Skeleton className="w-1/2 h-5 mb-3" />
        <Skeleton className="w-3/4 h-10 mb-2" />
        <Skeleton className="w-1/3 h-4" />
      </div>
      <div className="col-span-12 md:col-span-4 h-48 rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <Skeleton className="w-1/2 h-5 mb-3" />
        <Skeleton className="w-3/4 h-10 mb-2" />
        <Skeleton className="w-1/3 h-4" />
      </div>
    </div>
  );
}

export default Skeleton;
