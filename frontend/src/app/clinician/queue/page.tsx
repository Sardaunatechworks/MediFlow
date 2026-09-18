'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { queueApi, ApiError } from '@/lib/api';
import { FacilityQueueResponse } from '@/types/api';
import { EnrichedQueueItem, UrgencyLevel } from '@/types/domain';
import { formatTimeAgo, formatWaitTime, getEncounterStatusConfig } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UrgencyBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueueTableSkeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import {
  Stethoscope,
  ArrowRight,
  Clock,
  RotateCcw,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Users,
  Activity,
  HeartPulse,
  Filter,
  Check,
  Pause,
  Play,
  ShieldCheck,
} from 'lucide-react';

// Static demonstration reference data from backend seed.ts for offline resilience
const STATIC_SEEDED_QUEUE: EnrichedQueueItem[] = [
  {
    queuePosition: 1,
    encounterId: 'seed-enc-red-001',
    patientId: 'seed-pt-red-001',
    patientIdentifier: 'MF-PT-100003',
    patientName: 'Musa Danladi',
    age: 62,
    gender: 'MALE',
    presentingComplaint: 'Crushing retrosternal chest pain radiating to left arm and severe dyspnea',
    status: 'ESCALATED',
    urgency: 'RED',
    priorityScore: 1005008,
    waitingTimeMinutes: 8,
    startedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    isCriticalAlert: true,
    latestVitals: {
      temperature: 37.1,
      bloodPressure: '84/52',
      pulseRate: 138,
      respiratoryRate: 34,
      oxygenSaturation: 86,
    },
    triageReasoning: [
      'Critical red-flag detected: Severe Respiratory Distress',
      'Critical red-flag detected: Severe Chest Pain',
      'Critical red-flag detected: Signs Of Shock',
      'SpO2 is 86% (severe hypoxemia < 90%)',
      'Respiratory rate is 34/min (severe tachypnea > 30)',
      'Pulse rate is 138 bpm (severe tachycardia > 130 bpm)',
      'Systolic BP is 84 mmHg (severe hypotension / shock < 90 mmHg)',
    ],
    escalationReason: 'Clinical Escalation',
  },
  {
    queuePosition: 2,
    encounterId: 'seed-enc-yellow-002',
    patientId: 'seed-pt-yellow-002',
    patientIdentifier: 'MF-PT-100002',
    patientName: 'Emeka Okonkwo',
    age: 36,
    gender: 'MALE',
    presentingComplaint: 'High fever, rigors, and moderate abdominal cramps for 3 days',
    status: 'WAITING',
    urgency: 'YELLOW',
    priorityScore: 10035,
    waitingTimeMinutes: 35,
    startedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    isCriticalAlert: false,
    latestVitals: {
      temperature: 39.2,
      bloodPressure: '132/86',
      pulseRate: 108,
      respiratoryRate: 22,
      oxygenSaturation: 94,
    },
    triageReasoning: [
      'SpO2 is 94% (moderate hypoxemia 90-94%)',
      'Respiratory rate is 22/min (tachypnea 21-30)',
      'Pulse rate is 108 bpm (tachycardia 101-130 bpm)',
      'Temperature is 39.2°C (high fever >= 38.5°C)',
    ],
    escalationReason: null,
  },
  {
    queuePosition: 3,
    encounterId: 'seed-enc-green-003',
    patientId: 'seed-pt-green-003',
    patientIdentifier: 'MF-PT-100001',
    patientName: 'Fatima Bello',
    age: 28,
    gender: 'FEMALE',
    presentingComplaint: 'Mild tension headache and nasal congestion',
    status: 'WAITING',
    urgency: 'GREEN',
    priorityScore: 175,
    waitingTimeMinutes: 75,
    startedAt: new Date(Date.now() - 75 * 60000).toISOString(),
    isCriticalAlert: false,
    latestVitals: {
      temperature: 36.8,
      bloodPressure: '118/78',
      pulseRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
    },
    triageReasoning: [
      'All measured vital signs are within normal clinical thresholds with no critical red flags',
    ],
    escalationReason: null,
  },
];

export default function ClinicianQueuePage() {
  const router = useRouter();
  const { facility, setActiveEncounterId, setActivePatientId } = useAuth();

  const [data, setData] = useState<FacilityQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineDemo, setIsOfflineDemo] = useState(false);

  // Polling settings
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | UrgencyLevel>('ALL');

  const fetchQueue = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        // GET /facilities/:id/queue
        const res = await queueApi.getFacilityQueue(facility.id);
        setData(res);
        setIsOfflineDemo(false);
        setLastRefreshedAt(new Date());
      } catch (err: any) {
        console.warn('Clinician Queue fetch error:', err);

        if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
          setIsOfflineDemo(true);
          setData({
            facilityId: facility.id,
            totalWaiting: 3,
            criticalRedCount: 1,
            urgentYellowCount: 1,
            stableGreenCount: 1,
            inConsultationCount: 0,
            queue: STATIC_SEEDED_QUEUE,
          });
          setLastRefreshedAt(new Date());
          return;
        }

        setError(err.message || 'Failed to retrieve live acuity queue from backend.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [facility.id]
  );

  // Initial load
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Periodic polling every 12 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchQueue(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchQueue]);

  const handleOpenConsultation = (item: EnrichedQueueItem) => {
    setActiveEncounterId(item.encounterId);
    setActivePatientId(item.patientId);
    router.push(`/clinician/consultation/${item.encounterId}`);
  };

  const rawQueue = data?.queue || [];
  const filteredQueue =
    urgencyFilter === 'ALL'
      ? rawQueue
      : rawQueue.filter((item) => item.urgency === urgencyFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Prioritized Patient Consultation Queue"
        subtitle={`Real-time acuity ranking at ${facility.name} • Strictly ordered by Clinical Priority (RED > YELLOW > GREEN) + Wait Duration`}
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Clinician Workspace' },
          { label: 'Consultation Queue' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium border transition-colors ${
                autoRefresh
                  ? 'bg-sky-50 border-sky-200 text-brand-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {autoRefresh ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{autoRefresh ? 'Live Poll (12s)' : 'Polling Paused'}</span>
            </button>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchQueue(false)}
              isLoading={isRefreshing}
              leftIcon={<RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Offline Demo Notice if Backend Unavailable */}
      {isOfflineDemo && (
        <Alert variant="warning" title="Demo Mode — Backend Offline">
          Could not connect to the live NestJS backend at <code>http://localhost:3000</code>. Displaying the
          official seeded clinical demonstration scenario (Musa Danladi - RED, Emeka Okonkwo - YELLOW, Fatima
          Bello - GREEN) from <code>seed.ts</code>.
        </Alert>
      )}

      {/* Top Level Acuity & Volume KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-[#E2E8E4] bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-[#66736C] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Waiting</span>
              <Users className="w-3.5 h-3.5 text-[#66736C]" />
            </div>
            <div className="text-xl font-extrabold text-[#17201B] font-mono">
              {isLoading ? '-' : data?.totalWaiting ?? 0}
            </div>
            <span className="text-[10px] text-[#66736C]">Queue volume</span>
          </CardContent>
        </Card>

        <Card className="border-[#FCE8E6] bg-[#FCE8E6]/25">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-[#C5221F] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Critical (RED)</span>
              <Flame className="w-3.5 h-3.5 text-[#C5221F]" />
            </div>
            <div className="text-xl font-extrabold text-[#C5221F] font-mono">
              {isLoading ? '-' : data?.criticalRedCount ?? 0}
            </div>
            <span className="text-[10px] text-[#C5221F] font-semibold">Immediate attention</span>
          </CardContent>
        </Card>

        <Card className="border-[#FEF3C7] bg-[#FEF3C7]/25">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-[#B45309] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Urgent (YELLOW)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
            </div>
            <div className="text-xl font-extrabold text-[#B45309] font-mono">
              {isLoading ? '-' : data?.urgentYellowCount ?? 0}
            </div>
            <span className="text-[10px] text-[#B45309] font-semibold">Timely clinical care</span>
          </CardContent>
        </Card>

        <Card className="border-[#EAF7EE] bg-[#EAF7EE]/30">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-[#006B35] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Stable (GREEN)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006B35]" />
            </div>
            <div className="text-xl font-extrabold text-[#006B35] font-mono">
              {isLoading ? '-' : data?.stableGreenCount ?? 0}
            </div>
            <span className="text-[10px] text-[#006B35] font-semibold">Standard flow</span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8E4] bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-[#66736C] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Consultation</span>
              <Stethoscope className="w-3.5 h-3.5 text-[#006B35]" />
            </div>
            <div className="text-xl font-extrabold text-[#17201B] font-mono">
              {isLoading ? '-' : data?.inConsultationCount ?? 0}
            </div>
            <span className="text-[10px] text-[#66736C]">With clinician</span>
          </CardContent>
        </Card>
      </div>

      {/* Queue Filter Bar & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-card border border-[#E2E8E4]">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#66736C]" />
          <span className="text-[11px] font-bold text-[#17201B] uppercase tracking-wider">Filter:</span>
          <div className="flex items-center gap-1">
            {(['ALL', 'RED', 'YELLOW', 'GREEN'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setUrgencyFilter(filter)}
                className={`px-2.5 py-0.5 rounded-control text-xs font-semibold transition-all ${
                  urgencyFilter === filter
                    ? 'bg-[#006B35] text-white shadow-2xs'
                    : 'bg-[#F4F8F5] text-[#66736C] hover:bg-[#E2E8E4]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#66736C]">
          <span>Acuity Sorted</span>
          <span>•</span>
          <span>Updated: {lastRefreshedAt.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Prioritized Queue Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <span>Prioritized Patient Consultation List</span>
            </CardTitle>
            <CardDescription>
              Backend-calculated score factors clinical acuity weight (Red: 1M pts, Yellow: 10K pts, Green: 100 pts)
              + escalation bonus + arrival wait time.
            </CardDescription>
          </div>
          <span className="text-xs font-mono font-semibold text-brand-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
            {filteredQueue.length} {filteredQueue.length === 1 ? 'Patient' : 'Patients'} Queued
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && !data ? (
            <div className="p-6">
              <QueueTableSkeleton rows={3} />
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Stethoscope className="w-8 h-8 text-slate-400" />}
                title="No Patients Matching Filter"
                description="There are currently no patients in the consultation queue matching the selected urgency filter."
                actionLabel="View All Patients"
                onAction={() => setUrgencyFilter('ALL')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F8F5] text-[#66736C] uppercase tracking-wider text-[10px] border-b border-[#E2E8E4]">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Pos.</th>
                    <th className="py-2.5 px-4 font-bold">Patient Information</th>
                    <th className="py-2.5 px-4 font-bold">Chief Complaint & Clinical Reasoning</th>
                    <th className="py-2.5 px-4 font-bold">Acuity Status</th>
                    <th className="py-2.5 px-4 font-bold">Latest Vitals</th>
                    <th className="py-2.5 px-4 font-bold">Score & Wait</th>
                    <th className="py-2.5 px-4 font-bold text-right">Consultation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E4]">
                  {filteredQueue.map((item: EnrichedQueueItem) => {
                    const isRed = item.urgency === 'RED';
                    const isYellow = item.urgency === 'YELLOW';
                    const isInConsultation = item.status === 'IN_CONSULTATION';
                    const statusConfig = getEncounterStatusConfig(item.status);

                    return (
                      <tr
                        key={item.encounterId}
                        className={`transition-colors hover:bg-[#F4F8F5]/70 ${
                          isRed
                            ? 'bg-[#FCE8E6]/25'
                            : isYellow
                            ? 'bg-[#FEF3C7]/15'
                            : isInConsultation
                            ? 'bg-purple-50/20'
                            : ''
                        }`}
                      >
                        {/* Queue Position */}
                        <td className="py-3 px-4 align-top">
                          <span
                            className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shadow-2xs ${
                              isRed
                                ? 'bg-[#C5221F] text-white ring-2 ring-red-200'
                                : isYellow
                                ? 'bg-[#B45309] text-white'
                                : 'bg-[#006B35] text-white'
                            }`}
                          >
                            #{item.queuePosition}
                          </span>
                        </td>

                        {/* Patient Identity */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-bold text-[#17201B] text-sm">{item.patientName}</div>
                          <div className="text-[11px] text-[#66736C] flex items-center gap-1.5 mt-0.5 font-mono">
                            <span className="text-[#006B35] font-semibold">{item.patientIdentifier}</span>
                            <span>•</span>
                            <span>
                              {item.gender} {item.age ? `• ${item.age}y` : ''}
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </td>

                        {/* Complaint & Reasoning Summary */}
                        <td className="py-4 px-4 align-top max-w-xs">
                          <p className="text-slate-900 font-semibold text-xs leading-snug line-clamp-2">
                            &ldquo;{item.presentingComplaint}&rdquo;
                          </p>

                          {/* Reasoning Bullet Summary */}
                          {item.triageReasoning && item.triageReasoning.length > 0 && (
                            <div className="mt-1.5 text-[11px] text-slate-600 bg-white/80 p-1.5 rounded-control border border-slate-200/80">
                              <span className="font-semibold text-slate-700 block text-[10px] uppercase">
                                Triage Finding:
                              </span>
                              <span className="line-clamp-2">{item.triageReasoning[0]}</span>
                            </div>
                          )}
                        </td>

                        {/* Urgency Badge & Critical Flags */}
                        <td className="py-4 px-4 align-top">
                          <UrgencyBadge urgency={item.urgency} size="sm" />
                          {item.isCriticalAlert && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1 uppercase bg-red-100/80 px-2 py-0.5 rounded-full">
                              <Flame className="w-3 h-3" /> Critical Alert
                            </span>
                          )}
                          {item.escalationReason && (
                            <span className="block text-[10px] font-bold text-purple-700 mt-1">
                              ⚡ {item.escalationReason}
                            </span>
                          )}
                        </td>

                        {/* Vitals Snapshot */}
                        <td className="py-4 px-4 align-top">
                          {item.latestVitals ? (
                            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-700">
                              <span className="bg-white px-1.5 py-0.5 rounded border">
                                BP: <strong>{item.latestVitals.bloodPressure}</strong>
                              </span>
                              <span className="bg-white px-1.5 py-0.5 rounded border">
                                HR: <strong>{item.latestVitals.pulseRate}</strong>
                              </span>
                              <span className="bg-white px-1.5 py-0.5 rounded border">
                                RR: <strong>{item.latestVitals.respiratoryRate}</strong>
                              </span>
                              <span className="bg-white px-1.5 py-0.5 rounded border">
                                SpO2:{' '}
                                <strong className={item.latestVitals.oxygenSaturation && item.latestVitals.oxygenSaturation < 90 ? 'text-red-600' : ''}>
                                  {item.latestVitals.oxygenSaturation ? `${item.latestVitals.oxygenSaturation}%` : 'N/A'}
                                </strong>
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No vitals recorded</span>
                          )}
                        </td>

                        {/* Score & Waiting Time */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {item.priorityScore.toLocaleString()} pts
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatWaitTime(item.waitingTimeMinutes)} wait</span>
                          </div>
                        </td>

                        {/* Action CTA */}
                        <td className="py-4 px-4 align-top text-right">
                          <Button
                            variant={isRed ? 'danger' : isInConsultation ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleOpenConsultation(item)}
                            rightIcon={<ArrowRight className="w-3 h-3" />}
                            className="shadow-xs font-bold"
                          >
                            {isInConsultation ? 'Resume Visit' : isRed ? 'Attend Critical' : 'Start Visit'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
