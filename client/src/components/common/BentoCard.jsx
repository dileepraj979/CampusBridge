import React, { useRef, useState } from 'react';
import clsx from 'clsx';

export function BentoCard({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
  colSpan = 'col-span-12 md:col-span-6',
  noPadding = false
}) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    setMousePos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'bento-card group flex flex-col justify-between relative overflow-hidden',
        colSpan,
        className
      )}
    >
      {/* Subtle radial spotlight gradient */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity: mousePos.opacity,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 80%)`
        }}
      />

      {(title || subtitle || badge || action) && (
        <div className="flex items-start justify-between p-5 pb-3 z-10">
          <div>
            <div className="flex items-center gap-2">
              {title && <h3 className="font-semibold text-slate-100 dark:text-slate-100 text-sm tracking-tight">{title}</h3>}
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={clsx('relative z-10 flex-1', !noPadding && 'p-5 pt-1')}>
        {children}
      </div>
    </div>
  );
}

export default BentoCard;
