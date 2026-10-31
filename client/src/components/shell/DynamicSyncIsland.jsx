import React from 'react';
import { useSync } from '../../context/SyncContext.jsx';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Database } from 'lucide-react';
import clsx from 'clsx';

export function DynamicSyncIsland() {
  const { isOnline, syncStatus, pendingCount, lastSyncTime, isSyncing, conflictCount, openDrawer } = useSync();

  return (
    <button
      onClick={openDrawer}
      title="Click to view Local IndexedDB Offline Cache & Sync Recovery"
      className={clsx(
        'group relative inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ease-out shadow-sm backdrop-blur-md',
        // State 1: Conflict
        conflictCount > 0 && 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50',
        // State 2: Offline or Pending
        conflictCount === 0 && (!isOnline || pendingCount > 0) && 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50',
        // State 3: Online & Synced
        conflictCount === 0 && isOnline && pendingCount === 0 && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50'
      )}
    >
      {/* Morphing Status Dot & Icon */}
      <span className="relative flex h-2 w-2">
        {conflictCount > 0 ? (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400" />
        ) : !isOnline ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </>
        ) : pendingCount > 0 ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        )}
      </span>

      {/* Main State Text */}
      <span className="font-semibold tracking-tight flex items-center gap-1.5">
        {conflictCount > 0 ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{conflictCount} Conflict{conflictCount > 1 ? 's' : ''} — Review</span>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Offline {pendingCount > 0 && `• ${pendingCount} Pending`}</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw className={clsx('w-3.5 h-3.5 text-amber-400', isSyncing && 'animate-spin')} />
            <span>{pendingCount} Pending Push</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Online • Synced</span>
          </>
        )}
      </span>

      {/* Separator */}
      <span className="h-3 w-px bg-white/10" />

      {/* Timestamp in JetBrains Mono font */}
      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-400 tabular-nums">
        {lastSyncTime}
      </span>

      {/* Database indicator */}
      <Database className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors ml-0.5" />
    </button>
  );
}

export default DynamicSyncIsland;
