'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { encounterApi, queueApi, ApiError } from '@/lib/api';
import { Encounter, EnrichedQueueItem } from '@/types/domain';
import { formatTimeAgo, formatWaitTime, getUrgencyConfig, getEncounterStatusConfig } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UrgencyBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  HeartPulse,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
  Building2,
  Flame,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function PatientQueuePage() {
  const router = useRouter();
  const { activeEncounterId, facility } = useAuth();

  const [inputEncounterId, setInputEncounterId] = useState(activeEncounterId || '');
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [queueItem, setQueueItem] = useState<EnrichedQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientEncounter = useCallback(async (encId: string) => {
    if (!encId.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch encounter details from backend
      const enc = await encounterApi.getById(encId.trim());
      setEncounter(enc);

      // 2. Fetch live queue from backend to find queue position
      try {
        const queueRes = await queueApi.getFacilityQueue(enc.facilityId || facility.id);
        const match = queueRes.queue.find((q) => q.encounterId === encId.trim());
        if (match) {
          setQueueItem(match);
        }
      } catch {
        // Queue telemetry non-critical
      }
    } catch (err: any) {
      console.warn('Patient queue tracking error:', err);

      // Fallback check session storage for demo mode
      const stored = sessionStorage.getItem(`mediflow_enc_${encId.trim()}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setEncounter(parsed);
          return;
        } catch {
          // Ignored
        }
      }

      setError(err.message || 'Could not locate active encounter record on backend.');
    } finally {
      setIsLoading(false);
    }
  }, [facility.id]);

  useEffect(() => {
    if (activeEncounterId) {
      setInputEncounterId(activeEncounterId);
      fetchPatientEncounter(activeEncounterId);
    }
  }, [activeEncounterId, fetchPatientEncounter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputEncounterId.trim()) {
      fetchPatientEncounter(inputEncounterId.trim());
    }
  };

  // Determine active care journey step based strictly on backend encounter status & triage presence
  const getJourneyStep = () => {
    if (!encounter) return 1;
    if (encounter.status === 'COMPLETED') return 5;
    if (encounter.status === 'IN_CONSULTATION') return 4;
    if (encounter.triageAssessments && encounter.triageAssessments.length > 0) return 3;
    return 2; // Checked in, awaiting triage
  };

  const currentStep = getJourneyStep();
  const latestTriage = encounter?.triageAssessments?.[0];
  const urgency = encounter?.priority || latestTriage?.finalUrgency || null;
  const statusConfig = getEncounterStatusConfig(encounter?.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Patient Care Journey & Queue Tracking"
        subtitle="Live telemetry tracking your clinical progress, queue position, and consultation status"
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Patient Portal' },
          { label: 'Care Journey Tracker' },
        ]}
      />

      {/* Tracker Lookup Bar */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Enter Encounter ID or Patient Token (e.g. paste encounter ID)..."
                value={inputEncounterId}
                onChange={(e) => setInputEncounterId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-control text-xs py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                leftIcon={<Search className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Track Journey
              </Button>
              <Link href="/patient/check-in" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto">
                  New Check-In
                </Button>
              </Link>
            </div>
          </form>

          {/* Seed demo quick jumps */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Test Demo Encounters:</span>
            <button
              type="button"
              onClick={() => {
                setInputEncounterId('seed-enc-red-001');
                fetchPatientEncounter('seed-enc-red-001');
              }}
              className="text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 font-medium"
            >
              Musa Danladi (RED)
            </button>
            <button
              type="button"
              onClick={() => {
                setInputEncounterId('seed-enc-yellow-002');
                fetchPatientEncounter('seed-enc-yellow-002');
              }}
              className="text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 font-medium"
            >
              Emeka Okonkwo (YELLOW)
            </button>
            <button
              type="button"
              onClick={() => {
                setInputEncounterId('seed-enc-green-003');
                fetchPatientEncounter('seed-enc-green-003');
              }}
              className="text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-medium"
            >
              Fatima Bello (GREEN)
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="error" title="Tracking Notice">
          {error}
        </Alert>
      )}

      {/* Main Journey Experience */}
      {encounter ? (
        <div className="space-y-6">
          {/* Active Status Card */}
          <Card className="border-[#E2E8E4] bg-white overflow-hidden shadow-2xs">
            <div className="bg-[#003D20] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#EAF7EE]/80">
                  Patient Health Telemetry
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                  {encounter.patient?.firstName} {encounter.patient?.lastName}
                </h2>
                <p className="text-xs text-white/70 flex items-center gap-2 mt-0.5 font-mono">
                  <span>ID: {encounter.patient?.patientIdentifier || 'MF-PT-PENDING'}</span>
                  <span>•</span>
                  <span>Facility: {facility.name}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {queueItem ? (
                  <div className="bg-[#004D27] border border-[#006B35] rounded-card px-3.5 py-2 text-center">
                    <span className="text-[9px] text-white/70 uppercase tracking-wider block">Queue Position</span>
                    <span className="text-lg font-bold font-mono text-white">#{queueItem.queuePosition}</span>
                  </div>
                ) : (
                  <div className="bg-[#004D27] border border-[#006B35] rounded-card px-3.5 py-2 text-center">
                    <span className="text-[9px] text-white/70 uppercase tracking-wider block">Status</span>
                    <span className="text-xs font-bold text-white capitalize">
                      {statusConfig.label}
                    </span>
                  </div>
                )}
                <div className="text-right">
                  <span className="text-[9px] text-white/70 uppercase tracking-wider block mb-0.5">Acuity Tier</span>
                  <UrgencyBadge urgency={urgency} size="md" />
                </div>
              </div>
            </div>

            {/* 5-Step Healthcare Care Journey Stepper */}
            <CardContent className="p-4 sm:p-5 bg-surface-tint border-t border-[#E2E8E4]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#66736C] mb-3">
                Clinical Workflow Progress
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {[
                  { step: 1, title: 'Registered', desc: 'Demographics' },
                  { step: 2, title: 'Checked In', desc: 'Encounter started' },
                  { step: 3, title: 'Triage Done', desc: 'Acuity set' },
                  { step: 4, title: 'In Consultation', desc: 'Attending doctor' },
                  { step: 5, title: 'Completed', desc: 'Care concluded' },
                ].map((st) => {
                  const isDone = currentStep > st.step;
                  const isCurrent = currentStep === st.step;

                  return (
                    <div
                      key={st.step}
                      className={`p-2.5 rounded-card border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'border-[#006B35] bg-white ring-2 ring-[#006B35]/20 shadow-2xs'
                          : isDone
                          ? 'border-[#EAF7EE] bg-[#EAF7EE]/40'
                          : 'border-[#E2E8E4] bg-white opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            isCurrent
                              ? 'bg-[#006B35] text-white'
                              : isDone
                              ? 'bg-[#004D27] text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-3 h-3" /> : st.step}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#006B35] bg-[#EAF7EE] px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-900 leading-tight">{st.title}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{st.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>

            {/* Encounter Details & Next Steps */}
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white border-t border-slate-100">
              <div className="text-xs text-slate-600">
                <span>Presenting Complaint: </span>
                <strong className="text-slate-900">&ldquo;{encounter.presentingComplaint}&rdquo;</strong>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {currentStep < 3 ? (
                  <Link href={`/triage/assess/${encounter.id}`} className="w-full sm:w-auto">
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Complete Triage
                    </Button>
                  </Link>
                ) : (
                  <Link href="/patient/prescriptions" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5 text-brand-600" />}
                    >
                      View Prescriptions
                    </Button>
                  </Link>
                )}
                <Link href="/patient/search" className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm" rightIcon={<Search className="w-3.5 h-3.5" />}>
                    Find Pharmacies
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Activity className="w-8 h-8 text-brand-600" />}
              title="Track Your Active Healthcare Journey"
              description="Enter your Encounter ID above or register a new check-in to track your clinical queue status and vital telemetry."
              actionLabel="Start New Patient Check-In"
              onAction={() => router.push('/patient/check-in')}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
