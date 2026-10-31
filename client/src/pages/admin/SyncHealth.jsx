import React, { useState, useEffect } from 'react';
import { useSync } from '../../context/SyncContext.jsx';
import api from '../../services/api.js';
import { db } from '../../db/dexieDb.js';
import BentoCard from '../../components/common/BentoCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import {
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  X,
  History,
  Check,
  ChevronRight,
  ShieldAlert,
  Layers,
  Database
} from 'lucide-react';
import clsx from 'clsx';

export function SyncHealth() {
  const {
    isOnline,
    triggerSync,
    resolveActiveConflict,
    activeConflicts: localConflicts,
    refreshCounts,
    simulateConcurrencyConflict
  } = useSync();

  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conflicts'); // 'conflicts' | 'devices' | 'queue'
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [auditReason, setAuditReason] = useState('');
  const [resolutionSuccess, setResolutionSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [localMutations, setLocalMutations] = useState([]);

  // Fetch campus sync health from server API
  const fetchHealthData = async () => {
    try {
      const res = await api.request('/v1/sync/health');
      if (res.success && res.data) {
        setHealthData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load server sync health, using local data', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalMutations = async () => {
    const mutations = await db.offlineMutations.toArray();
    setLocalMutations(mutations);
  };

  useEffect(() => {
    fetchHealthData();
    fetchLocalMutations();
  }, []);

  // Revoke device handler
  const handleRevokeDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to revoke offline sync authorization for this device?')) return;
    try {
      await api.revokeDevice(deviceId);
      await fetchHealthData();
    } catch (err) {
      alert('Failed to revoke device: ' + err.message);
    }
  };

  // Open Conflict Resolver
  const openConflictResolver = (conflict) => {
    setSelectedConflict(conflict);
    setAuditReason('');
    setResolutionSuccess(null);
  };

  // Execute Resolution
  const handleResolve = async (strategy, overridePayload = null) => {
    if (!selectedConflict) return;

    if (strategy === 'force_override' && (!auditReason || auditReason.trim().length < 5)) {
      alert('Audit Reason (at least 5 characters) is required to force an offline override on academic data.');
      return;
    }

    setSubmitting(true);
    try {
      await resolveActiveConflict(
        selectedConflict.operationId,
        strategy,
        overridePayload || selectedConflict.conflictData?.clientPayload || selectedConflict.payload,
        auditReason
      );

      setResolutionSuccess(`Successfully resolved conflict via '${strategy}'`);
      await fetchHealthData();
      await fetchLocalMutations();
      await refreshCounts();

      setTimeout(() => {
        setSelectedConflict(null);
        setResolutionSuccess(null);
      }, 1200);
    } catch (err) {
      alert('Resolution error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Merge server & local conflicts for display
  const combinedConflicts = [
    ...(healthData?.conflicts || []).map(c => ({
      ...c,
      source: 'server',
      conflictData: c.conflictData || {}
    })),
    ...localConflicts.filter(lc => !(healthData?.conflicts || []).some(sc => sc.operationId === lc.operationId)).map(lc => ({
      ...lc,
      source: 'client',
      conflictData: lc.conflictData || {}
    }))
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">IndexedDB & Server Concurrency Hub</Badge>
            <span className="text-xs text-slate-400 font-mono">Web Locks API • Optimistic Locking</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Offline Data Integrity & Conflict Resolution Center
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Campus-wide synchronization telemetry, registered offline tablet health, and side-by-side diff reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              triggerSync();
              fetchHealthData();
              fetchLocalMutations();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Cloud Telemetry</span>
          </button>

          <button
            onClick={simulateConcurrencyConflict}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Conflict</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Registered Sync Devices */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Registered Sync Devices</span>
            <Laptop className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {healthData?.overview?.totalDevices || 1}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{healthData?.overview?.activeDevices || 1} Active • 0 Revoked</span>
          </div>
        </div>

        {/* Card 2: Campus Sync Health Score */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Concurrency Health Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {combinedConflicts.length === 0 ? '100%' : '92%'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {combinedConflicts.length === 0 ? 'Zero version divergence' : `${combinedConflicts.length} divergence(s) flagged`}
          </div>
        </div>

        {/* Card 3: Active Divergent Conflicts */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Conflicts (Unresolved)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {combinedConflicts.length}
          </div>
          <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
            <span>Action Required: Side-by-Side Diff</span>
          </div>
        </div>

        {/* Card 4: Local Mutation Queue */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Local Dexie Queue</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">
            {localMutations.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Idempotency tracked via UUID v4
          </div>
        </div>

      </div>

      {/* Main Tabbed Interface */}
      <div className="space-y-4">
        
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('conflicts')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeTab === 'conflicts'
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Active Conflicts ({combinedConflicts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeTab === 'devices'
                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-400" />
            <span>Registered Offline Devices</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeTab === 'queue'
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Local & Server Mutation Trail ({localMutations.length})</span>
          </button>
        </div>

        {/* Tab 1: Active Conflicts */}
        {activeTab === 'conflicts' && (
          <div className="space-y-3">
            {combinedConflicts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#12141C] border border-white/5 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-90" />
                <h3 className="text-sm font-semibold text-white">All Academic Records Synchronized</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  There are currently zero optimistic concurrency divergences. Every classroom tablet and workstation is aligned with cloud truth.
                </p>
                <button
                  onClick={simulateConcurrencyConflict}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10 transition-colors"
                >
                  Click here to simulate a test concurrency conflict
                </button>
              </div>
            ) : (
              combinedConflicts.map((conf, idx) => (
                <div
                  key={conf.operationId || idx}
                  className="p-5 rounded-2xl bg-[#12141C] border border-rose-500/30 hover:border-rose-500/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="rose" size="xs">Divergence Detected</Badge>
                      <span className="font-mono text-xs text-slate-300 font-semibold">{conf.entityType}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono text-[11px] text-slate-400">ID: {conf.entityId}</span>
                    </div>

                    <div className="text-xs text-slate-300">
                      Client attempted mutation at <span className="font-mono font-semibold text-amber-300">v{conf.clientBaseVersion || conf.baseVersion || 1}</span>, but Cloud Server has advanced to <span className="font-mono font-semibold text-rose-300">v{conf.serverVersion || 2}</span>.
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Operation UUID: {conf.operationId}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openConflictResolver(conf)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Open Side-by-Side Diff Resolver</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Registered Offline Devices */}
        {activeTab === 'devices' && (
          <div className="rounded-2xl bg-[#12141C] border border-white/[0.08] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                Registered Offline-Capable Browsers & Tablets
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Device Name</th>
                    <th className="py-3 px-4">Browser & OS</th>
                    <th className="py-3 px-4">Assigned User</th>
                    <th className="py-3 px-4">Offline Stores</th>
                    <th className="py-3 px-4">Last Sync</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {(healthData?.devices || [
                    {
                      _id: 'dev_mock_01',
                      deviceName: 'Faculty Air 15" (Classroom Lab)',
                      browser: 'Chrome 130 / macOS',
                      os: 'macOS',
                      userId: { name: 'Prof. Ananya Sen', activeRole: 'FACULTY' },
                      cachedStores: [{ storeName: 'attendanceRecords', recordCount: 60 }],
                      lastSyncAt: new Date().toISOString(),
                      revokedAt: null
                    }
                  ]).map((dev) => (
                    <tr key={dev._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{dev.deviceName || 'Academic Terminal'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {dev.browser} • {dev.os}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{dev.userId?.name || 'Authorized Staff'}</div>
                        <span className="text-[10px] font-mono text-indigo-400">{dev.userId?.activeRole || 'FACULTY'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {dev.cachedStores?.length ? `${dev.cachedStores.length} stores cached` : '10 Phase 2 Stores'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {dev.lastSyncAt ? new Date(dev.lastSyncAt).toLocaleTimeString() : 'Just now'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={dev.revokedAt ? 'rose' : 'emerald'} size="xs" dot>
                          {dev.revokedAt ? 'Revoked' : 'Authorized'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!dev.revokedAt ? (
                          <button
                            onClick={() => handleRevokeDevice(dev._id)}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors"
                          >
                            Revoke Device
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Local & Server Mutation Queue */}
        {activeTab === 'queue' && (
          <div className="rounded-2xl bg-[#12141C] border border-white/[0.08] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                IndexedDB Local Mutation Ledger (Idempotent UUID v4)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Operation ID</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Base Version</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {localMutations.map((mut) => (
                    <tr key={mut.operationId} className="hover:bg-white/[0.02] transition-colors font-mono text-[11px]">
                      <td className="py-3 px-4 text-indigo-300">{mut.operationId.slice(0, 16)}...</td>
                      <td className="py-3 px-4 text-white font-medium">{mut.entityType}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{mut.operationType}</td>
                      <td className="py-3 px-4 text-slate-400">v{mut.baseVersion}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(mut.createdAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={mut.status === 'conflict' ? 'rose' : mut.status === 'queued' ? 'amber' : 'emerald'}
                          size="xs"
                        >
                          {mut.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Side-by-Side Diff Conflict Resolver Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedConflict(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-4xl rounded-2xl bg-[#12141C] border border-white/15 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="rose" size="xs">Concurrency Conflict</Badge>
                    <span className="font-mono text-xs text-indigo-400">{selectedConflict.entityType}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-0.5">
                    Side-by-Side Conflict Diff & Resolution Console
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedConflict(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Side-by-Side Diff Comparison */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Version Banner */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Target Record ID:</span>
                  <span className="font-mono font-semibold text-white ml-2">{selectedConflict.entityId}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Client Base: v{selectedConflict.clientBaseVersion || selectedConflict.baseVersion || 1}
                  </span>
                  <span>➔</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    Server Current: v{selectedConflict.serverVersion || 2}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Column 1: Client Mutation Attempt */}
                <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-amber-500/20">
                    <span className="font-semibold text-amber-300">Client Mutation (Offline Queue)</span>
                    <Badge variant="amber" size="xs">Local Attempt</Badge>
                  </div>
                  <pre className="font-mono text-xs text-amber-200/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {JSON.stringify(selectedConflict.conflictData?.clientPayload || selectedConflict.payload || {}, null, 2)}
                  </pre>
                </div>

                {/* Column 2: Current Server State */}
                <div className="p-4 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-indigo-500/20">
                    <span className="font-semibold text-indigo-300">Server State (Cloud Truth)</span>
                    <Badge variant="primary" size="xs">Server v{selectedConflict.serverVersion || 2}</Badge>
                  </div>
                  <pre className="font-mono text-xs text-indigo-200/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {JSON.stringify(selectedConflict.conflictData?.serverCurrentState || { note: 'Server record modified concurrently' }, null, 2)}
                  </pre>
                </div>

              </div>

              {/* Field-level Discrepancy Breakdown Table */}
              {selectedConflict.conflictData?.fieldDiffs?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Field-Level Discrepancy Breakdown
                  </h4>
                  <div className="rounded-xl border border-white/5 overflow-hidden text-xs">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-white/[0.03] text-slate-400 text-[11px] border-b border-white/5">
                        <tr>
                          <th className="p-3">Field Name</th>
                          <th className="p-3 text-amber-300">Client Value</th>
                          <th className="p-3 text-indigo-300">Server Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[11px]">
                        {selectedConflict.conflictData.fieldDiffs.map((diff, i) => (
                          <tr key={i} className="hover:bg-white/[0.01]">
                            <td className="p-3 font-semibold text-slate-300">{diff.field}</td>
                            <td className="p-3 text-amber-200 bg-amber-500/5">{JSON.stringify(diff.clientValue)}</td>
                            <td className="p-3 text-indigo-200 bg-indigo-500/5">{JSON.stringify(diff.serverValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resolution Form: Mandatory Audit Reason for Override */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Audit Justification Reason <span className="text-rose-400">*</span>
                  <span className="text-[11px] font-normal text-slate-400 ml-2">
                    (Compulsory when forcing local override to satisfy institutional compliance)
                  </span>
                </label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g. Verified with physical signed classroom attendance sheet during Wi-Fi drop"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {resolutionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{resolutionSuccess}</span>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-white/10 bg-black/30 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setSelectedConflict(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5">
                {/* 1. Accept Server */}
                <button
                  onClick={() => handleResolve('accept_server')}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
                >
                  Accept Server Truth
                </button>

                {/* 2. Manual Merge */}
                <button
                  onClick={() => handleResolve('manual_merge')}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
                >
                  Merge Client Fields
                </button>

                {/* 3. Force Local Override */}
                <button
                  onClick={() => handleResolve('force_override')}
                  disabled={submitting || !auditReason || auditReason.trim().length < 5}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md',
                    auditReason && auditReason.trim().length >= 5
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                      : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Force Local Override (Audited)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default SyncHealth;
