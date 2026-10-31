import React from 'react';
import { useSync } from '../../context/SyncContext.jsx';
import {
  X,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
  HardDrive,
  Cloud,
  Layers,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import Badge from '../common/Badge.jsx';
import clsx from 'clsx';

export function SyncDrawer({ onNavigateToSyncHealth }) {
  const {
    isDrawerOpen,
    closeDrawer,
    isOnline,
    simulatedOffline,
    toggleOfflineSimulation,
    syncStatus,
    pendingCount,
    conflictCount,
    lastSyncTime,
    isSyncing,
    triggerSync,
    queueTestAttendance,
    queueTestAssignment,
    simulateConcurrencyConflict,
    storesData,
    storageEstimate
  } = useSync();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#12141C] border-l border-white/10 shadow-2xl flex flex-col text-slate-100">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/25">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Offline Sync & Storage Engine</h2>
                <p className="text-xs text-slate-400 font-mono">Dexie.js IndexedDB • Web Locks Guarded</p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Quick Status Pill & Storage Quota Meter */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Network Connectivity</span>
                <Badge
                  variant={isOnline ? 'emerald' : 'amber'}
                  dot
                >
                  {isOnline ? 'Connected to Internet' : 'Offline Simulation Active'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Last Synced Timestamp</span>
                <span className="font-mono text-xs text-indigo-300 font-semibold">{lastSyncTime}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Pending Mutations</span>
                <span className="font-mono text-xs font-semibold text-amber-400">
                  {pendingCount} record{pendingCount === 1 ? '' : 's'} queued
                </span>
              </div>

              {conflictCount > 0 && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{conflictCount} Concurrency Conflict{conflictCount > 1 ? 's' : ''}</span>
                  </div>
                  {onNavigateToSyncHealth && (
                    <button
                      onClick={() => {
                        closeDrawer();
                        onNavigateToSyncHealth();
                      }}
                      className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline flex items-center gap-0.5"
                    >
                      Resolve Diff
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Live Browser Storage Quota Meter */}
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                    IndexedDB Storage Quota
                  </span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {storageEstimate.usageMB} MB / {storageEstimate.quotaMB} MB ({storageEstimate.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, storageEstimate.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Simulation Switch */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {simulatedOffline ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                  <span className="text-xs font-medium">Simulate Offline Mode</span>
                </div>
                <button
                  onClick={toggleOfflineSimulation}
                  className={clsx(
                    'relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    simulatedOffline ? 'bg-amber-500' : 'bg-slate-700'
                  )}
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      simulatedOffline ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Actions: Sync & Test Mutation Generation */}
            <div className="space-y-2">
              <button
                onClick={triggerSync}
                disabled={isSyncing || !isOnline}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all shadow-md',
                  isOnline
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                )}
              >
                <RefreshCw className={clsx('w-4 h-4', isSyncing && 'animate-spin')} />
                {isSyncing ? 'Synchronizing with Campus Cloud...' : 'Force Full Bidirectional Sync'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={queueTestAttendance}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Attendance Draft</span>
                </button>

                <button
                  onClick={queueTestAssignment}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>+ Assignment Draft</span>
                </button>
              </div>

              {/* Trigger Deliberate Conflict */}
              <button
                onClick={simulateConcurrencyConflict}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Simulate Concurrency Conflict (Side-by-Side Diff)</span>
              </button>

              {onNavigateToSyncHealth && (
                <button
                  onClick={() => {
                    closeDrawer();
                    onNavigateToSyncHealth();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors"
                >
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Open Full Sync Health & Conflict Center</span>
                </button>
              )}
            </div>

            {/* Matrix: Locally Available IndexedDB Stores vs Online Features */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Dexie.js Stores (Phase 2 Architecture)
                </h3>
                <span className="text-[11px] font-mono text-slate-500">10 Stores Active</span>
              </div>

              <div className="space-y-2">
                {storesData.map((store, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {store.offlineCapable ? (
                          <HardDrive className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Cloud className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">{store.label}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {store.offlineCapable ? `${store.count} records • ${store.size}` : store.size}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={store.offlineCapable ? (store.status.includes('Conflict') ? 'rose' : store.status.includes('Queued') ? 'amber' : 'emerald') : 'purple'}
                      size="xs"
                    >
                      {store.offlineCapable ? 'Offline Ready' : 'Cloud Only'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline-First Security Guarantee */}
            <div className="p-4 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Web Locks & Optimistic Concurrency</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                IndexedDB synchronization is locked across browser tabs via the Web Locks API. Academic records are version-checked on the server — never silently overwritten.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/20 text-center text-[11px] text-slate-500 font-mono">
            CampusBridge Sync Engine • v2.0.0
          </div>

        </div>
      </div>
    </div>
  );
}

export default SyncDrawer;
