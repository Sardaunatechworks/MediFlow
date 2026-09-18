'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { queueApi, ApiError } from '@/lib/api';
import { FacilityQueueResponse } from '@/types/api';
import { EnrichedQueueItem } from '@/types/domain';
import { formatTimeAgo, formatWaitTime } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UrgencyBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueueTableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Activity,
  ArrowRight,
  Clock,
  PlusCircle,
  RotateCcw,
  User,
  Users,
  Flame,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function TriageQueuePage() {
  const router = useRouter();
  const { facility } = useAuth();
  const [data, setData] = useState<FacilityQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // GET /facilities/:id/queue
      const res = await queueApi.getFacilityQueue(facility.id);
      setData(res);
    } catch (err: any) {
      console.warn('Queue API error:', err);
      setError(err.message || 'Failed to fetch waiting room queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [facility.id]);

  const queueItems = data?.queue || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Triage Waiting Room & Intake"
        subtitle={`Live monitoring of arrivals and pending clinical triage at ${facility.name}`}
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Triage' },
          { label: 'Waiting Room' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueue}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Link href="/patient/check-in">
              <Button size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                Register Patient
              </Button>
            </Link>
          </div>
        }
      />

      {/* Triage Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="border-[#E2E8E4] bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#66736C] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Waiting</span>
              <Users className="w-4 h-4 text-[#66736C]" />
            </div>
            <div className="text-2xl font-extrabold text-[#17201B] font-mono">
              {isLoading ? '-' : data?.totalWaiting ?? 0}
            </div>
            <span className="text-[10px] text-[#66736C]">Active arrivals</span>
          </CardContent>
        </Card>

        <Card className="border-[#FCE8E6] bg-[#FCE8E6]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#C5221F] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Critical (RED)</span>
              <Flame className="w-4 h-4 text-[#C5221F]" />
            </div>
            <div className="text-2xl font-extrabold text-[#C5221F] font-mono">
              {isLoading ? '-' : data?.criticalRedCount ?? 0}
            </div>
            <span className="text-[10px] text-[#C5221F] font-semibold">Immediate attention</span>
          </CardContent>
        </Card>

        <Card className="border-[#FEF3C7] bg-[#FEF3C7]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#B45309] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Urgent (YELLOW)</span>
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
            </div>
            <div className="text-2xl font-extrabold text-[#B45309] font-mono">
              {isLoading ? '-' : data?.urgentYellowCount ?? 0}
            </div>
            <span className="text-[10px] text-[#B45309] font-semibold">Timely assessment</span>
          </CardContent>
        </Card>

        <Card className="border-[#EAF7EE] bg-[#EAF7EE]/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#006B35] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Stable (GREEN)</span>
              <CheckCircle2 className="w-4 h-4 text-[#006B35]" />
            </div>
            <div className="text-2xl font-extrabold text-[#006B35] font-mono">
              {isLoading ? '-' : data?.stableGreenCount ?? 0}
            </div>
            <span className="text-[10px] text-[#006B35] font-semibold">Standard flow</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Waiting Room Queue List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">Incoming Patients Awaiting Triage Assessment</CardTitle>
            <CardDescription>
              Select a patient to record objective vital signs, red-flag checklists, and compute urgency.
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Auto-ordering via Clinical Triage Priority
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <QueueTableSkeleton rows={4} />
            </div>
          ) : error && queueItems.length === 0 ? (
            <div className="p-6">
              <ErrorState
                title="Could not connect to facility queue"
                message={error}
                onRetry={fetchQueue}
              />
            </div>
          ) : queueItems.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Activity className="w-8 h-8 text-slate-400" />}
                title="Triage Waiting Room is Clear"
                description="No patients are currently waiting for triage assessment at this facility."
                actionLabel="Register Walk-in Patient"
                onAction={() => router.push('/patient/check-in')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F8F5] text-[#66736C] uppercase tracking-wider text-[10px] border-b border-[#E2E8E4]">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Queue Pos.</th>
                    <th className="py-2.5 px-4 font-bold">Patient Information</th>
                    <th className="py-2.5 px-4 font-bold">Presenting Complaint</th>
                    <th className="py-2.5 px-4 font-bold">Acuity Status</th>
                    <th className="py-2.5 px-4 font-bold">Wait Time</th>
                    <th className="py-2.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E4]">
                  {queueItems.map((item: EnrichedQueueItem) => (
                    <tr
                      key={item.encounterId}
                      className="hover:bg-[#F4F8F5]/60 transition-colors group"
                    >
                      {/* Position */}
                      <td className="py-3 px-4">
                        <span
                          className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs ${
                            item.urgency === 'RED'
                              ? 'bg-[#FCE8E6] text-[#C5221F] border border-[#FCE8E6]'
                              : item.urgency === 'YELLOW'
                              ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FEF3C7]'
                              : item.urgency === 'GREEN'
                              ? 'bg-[#EAF7EE] text-[#006B35] border border-[#EAF7EE]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{item.queuePosition}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#17201B] text-sm">{item.patientName}</div>
                        <div className="text-[11px] text-[#66736C] flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[#006B35] font-semibold">{item.patientIdentifier}</span>
                          <span>•</span>
                          <span>
                            {item.gender} {item.age ? `• ${item.age}y` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Presenting Complaint */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-800 font-medium line-clamp-2 leading-relaxed">
                          {item.presentingComplaint}
                        </p>
                      </td>

                      {/* Urgency Badge */}
                      <td className="py-3.5 px-4">
                        {item.urgency ? (
                          <UrgencyBadge urgency={item.urgency} size="sm" />
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Awaiting Assessment
                          </span>
                        )}
                        {item.isCriticalAlert && (
                          <span className="block text-[10px] font-bold text-red-600 mt-1 uppercase">
                            ⚠️ Critical Alert
                          </span>
                        )}
                      </td>

                      {/* Wait Time */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatWaitTime(item.waitingTimeMinutes)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatTimeAgo(item.startedAt)}
                        </span>
                      </td>

                      {/* CTA */}
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/triage/assess/${item.encounterId}`}>
                          <Button
                            variant={item.urgency ? 'outline' : 'primary'}
                            size="sm"
                            rightIcon={<ArrowRight className="w-3 h-3" />}
                          >
                            {item.urgency ? 'Review Vitals' : 'Start Triage'}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
