'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { encounterApi, triageApi, medicineApi, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { usePrescriptions } from '@/context/PrescriptionContext';
import { Encounter, UrgencyLevel, EncounterStatus, Medicine } from '@/types/domain';
import { getUrgencyConfig, getEncounterStatusConfig, formatTimeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge, UrgencyBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Stethoscope,
  ArrowRight,
  Clock,
  Flame,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  HeartPulse,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Building2,
  Search,
  Info,
} from 'lucide-react';

interface PrescriptionDraftItem {
  medicineId: string;
  medicineName: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  instructions: string;
}

export default function ClinicianConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const encounterId = params?.encounterId as string;
  const toast = useToast();
  const { role, facility } = useAuth();
  const { addPrescription, getPrescriptionsForPatient } = usePrescriptions();

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status mutation state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Override modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideUrgency, setOverrideUrgency] = useState<UrgencyLevel>('YELLOW');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideBy, setOverrideBy] = useState('Dr. Auwal (Attending Clinician)');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Complete encounter modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Prescription composer modal state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [medicineCatalogue, setMedicineCatalogue] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionDraftItem[]>([
    {
      medicineId: 'm1',
      medicineName: 'Amoxicillin 500mg Capsule',
      strength: '500mg',
      dosageForm: 'Capsule',
      quantity: 21,
      instructions: '1 capsule three times daily for 7 days after meals',
    },
  ]);

  // Consultation Documentation Notes (Client Session State)
  const [clinicalNotes, setClinicalNotes] = useState({
    subjective: '',
    findings: '',
    assessment: '',
    plan: '',
  });

  const fetchEncounter = async () => {
    if (!encounterId) return;
    setIsLoading(true);
    setError(null);

    try {
      // GET /encounters/:id
      const data = await encounterApi.getById(encounterId);
      setEncounter(data);
    } catch (err: any) {
      console.warn('Encounter fetch error:', err);

      // Check session storage for demo encounter if backend offline
      const stored = sessionStorage.getItem(`mediflow_enc_${encounterId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setEncounter(parsed);
          return;
        } catch {
          // Ignored
        }
      }

      setError(err.message || 'Failed to retrieve encounter from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEncounter();
  }, [encounterId]);

  // Load medicines catalogue for prescription composer
  useEffect(() => {
    async function loadMedicines() {
      try {
        const meds = await medicineApi.search();
        if (meds && meds.length > 0) {
          setMedicineCatalogue(meds);
        }
      } catch {
        // Fallback default medications
        setMedicineCatalogue([
          { id: 'med-1', genericName: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule', status: 'ACTIVE' },
          { id: 'med-2', genericName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', status: 'ACTIVE' },
          { id: 'med-3', genericName: 'Artemether / Lumefantrine', strength: '20/120mg', dosageForm: 'Tablet', status: 'ACTIVE' },
          { id: 'med-4', genericName: 'Amlodipine', strength: '10mg', dosageForm: 'Tablet', status: 'ACTIVE' },
          { id: 'med-5', genericName: 'Metformin', strength: '500mg', dosageForm: 'Tablet', status: 'ACTIVE' },
        ]);
      }
    }
    loadMedicines();
  }, []);

  // 1. BEGIN CONSULTATION ACTION: PATCH /encounters/:id/status
  const handleBeginConsultation = async () => {
    setIsUpdatingStatus(true);
    try {
      const updated = await encounterApi.updateStatus(encounterId, {
        status: 'IN_CONSULTATION',
        reason: 'Clinician called patient into consultation room',
        updatedBy: 'Dr. Auwal (Attending Clinician)',
      });
      setEncounter(updated);
      toast.success('Consultation Initiated', 'Patient encounter status set to IN_CONSULTATION on backend.');
    } catch (err: any) {
      toast.error('Status Update Failed', err.message || 'Could not update encounter status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 2. CLINICAL URGENCY OVERRIDE: POST /triage/:id/override
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);

    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setOverrideError('Clinical justification is required (minimum 5 characters).');
      return;
    }

    const latestTriage = encounter?.triageAssessments?.[0];
    if (!latestTriage) {
      setOverrideError('Cannot override urgency: No triage assessment record exists for this encounter.');
      return;
    }

    setIsSubmittingOverride(true);

    try {
      // POST /triage/:id/override
      await triageApi.override(latestTriage.id, {
        newUrgency: overrideUrgency,
        overrideReason: overrideReason.trim(),
        overriddenBy: overrideBy.trim() || 'Dr. Auwal (Clinician)',
      });

      toast.success(
        'Acuity Overridden',
        `Clinical urgency successfully updated to ${overrideUrgency}. Recorded in backend audit log.`
      );

      setOverrideModalOpen(false);
      setOverrideReason('');
      await fetchEncounter();
    } catch (err: any) {
      setOverrideError(err.message || 'Failed to submit clinical override.');
      toast.error('Override Failed', err.message);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // 3. COMPLETE ENCOUNTER: PATCH /encounters/:id/status
  const handleCompleteEncounter = async () => {
    setIsCompleting(true);
    try {
      const updated = await encounterApi.updateStatus(encounterId, {
        status: 'COMPLETED',
        reason: 'Consultation concluded and prescriptions issued',
        updatedBy: 'Dr. Auwal (Attending Clinician)',
      });
      setEncounter(updated);
      setCompleteModalOpen(false);
      toast.success('Encounter Completed', 'Patient consultation is complete and released from the queue.');
    } catch (err: any) {
      toast.error('Failed to complete encounter', err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  // 4. PRESCRIPTION COMPOSER (ISOLATED MVP BRIDGE)
  const addPrescriptionItem = () => {
    setPrescriptionItems((prev) => [
      ...prev,
      {
        medicineId: `med-${Date.now()}`,
        medicineName: '',
        strength: '',
        dosageForm: 'Tablet',
        quantity: 10,
        instructions: 'Take 1 tablet daily',
      },
    ]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();

    if (prescriptionItems.length === 0 || !prescriptionItems[0].medicineName.trim()) {
      toast.error('Validation Error', 'Please specify at least one prescribed medication.');
      return;
    }

    if (!encounter || !encounter.patient) {
      toast.error('Error', 'Missing patient reference.');
      return;
    }

    const patientName = `${encounter.patient.firstName} ${encounter.patient.lastName}`;

    const created = addPrescription(
      encounterId,
      encounter.patient.id,
      patientName,
      'Dr. Auwal (Attending Clinician)',
      prescriptionItems.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        strength: item.strength || 'Standard',
        dosageForm: item.dosageForm,
        quantity: item.quantity,
        instructions: item.instructions,
      })),
      clinicalNotes.assessment || 'Consultation diagnosis documented'
    );

    toast.success(
      'e-Prescription Issued',
      `Prescription generated (ID: ${created.id.slice(0, 8)}...). Available in Patient Prescriptions hub.`
    );
    setPrescriptionModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <Skeleton className="h-14 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-card" />
          <Skeleton className="h-96 rounded-card" />
        </div>
      </div>
    );
  }

  if (error && !encounter) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Unable to Load Consultation Workspace"
          message={`Encounter ID ${encounterId} could not be retrieved from the backend: ${error}`}
          onRetry={fetchEncounter}
        />
        <div className="mt-4 text-center">
          <Link href="/clinician/queue">
            <Button variant="outline" size="sm">
              Back to Prioritized Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const patient = encounter?.patient;
  const latestTriage = encounter?.triageAssessments?.[0];
  const urgency = encounter?.priority || latestTriage?.finalUrgency || 'GREEN';
  const statusConfig = getEncounterStatusConfig(encounter?.status);
  const existingPatientPrescriptions = patient ? getPrescriptionsForPatient(patient.id) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Clinician Consultation Workspace"
        subtitle={`Attending: Dr. Auwal • Facility: ${facility.name}`}
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Clinician Queue', href: '/clinician/queue' },
          { label: `Consultation: ${patient?.firstName || ''} ${patient?.lastName || ''}` },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/clinician/queue">
              <Button variant="outline" size="sm">
                Queue Overview
              </Button>
            </Link>

            {encounter?.status !== 'IN_CONSULTATION' && encounter?.status !== 'COMPLETED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleBeginConsultation}
                isLoading={isUpdatingStatus}
                leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
              >
                Begin Consultation
              </Button>
            )}

            {encounter?.status !== 'COMPLETED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompleteModalOpen(true)}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Complete Encounter
              </Button>
            )}
          </div>
        }
      />

      {/* Patient Header Banner */}
      <Card className="border-[#E2E8E4] shadow-2xs bg-white overflow-hidden">
        <div className="bg-[#003D20] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#004D27] flex items-center justify-center text-white font-bold text-sm">
              {patient?.firstName?.[0]}
              {patient?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight leading-tight">
                {patient?.firstName} {patient?.lastName}
              </h2>
              <p className="text-xs text-white/70 flex items-center gap-2 font-mono mt-0.5">
                <span>{patient?.patientIdentifier || 'ID PENDING'}</span>
                <span>•</span>
                <span>
                  {patient?.gender} {patient?.age ? `• ${patient.age} yrs` : ''}
                </span>
                {patient?.phone && <span>• Tel: {patient.phone}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-white/60 uppercase tracking-widest block">Encounter Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/60 uppercase tracking-widest block">Acuity Tier</span>
              <UrgencyBadge urgency={urgency} size="md" />
            </div>
          </div>
        </div>

        <CardContent className="p-4 bg-[#F4F8F5] text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <span className="font-bold text-[#66736C] uppercase tracking-wider text-[10px]">
                Presenting Complaint:
              </span>
              <p className="text-[#17201B] font-semibold text-xs mt-0.5 leading-relaxed">
                &ldquo;{encounter?.presentingComplaint}&rdquo;
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Arrival Wait Duration:
              </span>
              <p className="text-slate-800 font-medium mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatTimeAgo(encounter?.startedAt)}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Clinical Documentation & Notes (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Consultation Documentation Form */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Clinical Documentation (SOAP Notes)</span>
                </CardTitle>
                <CardDescription>
                  Document patient consultation, physical examination, assessment, and care plan.
                </CardDescription>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                Session State
              </span>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <Textarea
                label="Subjective History & Presenting Illness"
                rows={3}
                placeholder="Patient reports onset of symptoms, character, aggravating and relieving factors..."
                value={clinicalNotes.subjective}
                onChange={(e) => setClinicalNotes({ ...clinicalNotes, subjective: e.target.value })}
              />

              <Textarea
                label="Objective Examination & Physical Findings"
                rows={3}
                placeholder="Physical examination observations: chest auscultation, abdominal tenderness, neurological exam..."
                value={clinicalNotes.findings}
                onChange={(e) => setClinicalNotes({ ...clinicalNotes, findings: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Assessment / Clinical Impression"
                  rows={3}
                  placeholder="Primary diagnostic impression or differential diagnoses..."
                  value={clinicalNotes.assessment}
                  onChange={(e) => setClinicalNotes({ ...clinicalNotes, assessment: e.target.value })}
                />
                <Textarea
                  label="Treatment & Intervention Plan"
                  rows={3}
                  placeholder="Planned medication therapies, referrals, observation schedule..."
                  value={clinicalNotes.plan}
                  onChange={(e) => setClinicalNotes({ ...clinicalNotes, plan: e.target.value })}
                />
              </div>

              {/* Notice regarding backend persistence of clinical notes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-control text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Consultation notes are maintained in client session. Official clinical status changes and priority
                  overrides are synchronized directly with the NestJS backend.
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between bg-slate-50/60">
              <span className="text-xs text-slate-500">Documented by: Dr. Auwal (Attending Clinician)</span>
              <Button
                variant="primary"
                size="md"
                onClick={() => setPrescriptionModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shadow-xs font-bold"
              >
                Create Prescription
              </Button>
            </CardFooter>
          </Card>

          {/* Active / Past Prescriptions for this Patient */}
          {existingPatientPrescriptions.length > 0 && (
            <Card className="border-sky-200 bg-sky-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2 text-brand-800">
                    <FileText className="w-4 h-4 text-brand-600" />
                    Prescriptions Issued During This Care Journey
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                      Session Bridge (MVP)
                    </span>
                    <span className="text-xs text-brand-600 font-mono">
                      {existingPatientPrescriptions.length} Issued
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                  Temporary session prescriptions ready for exact catalogue verification and verified pharmacy reservation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingPatientPrescriptions.map((px) => (
                  <div key={px.id} className="p-3 bg-white border border-sky-200 rounded-control text-xs space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          Ref: {px.id}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          • Prescribed by {px.clinicianName}
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {px.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {px.items.map((it, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{it.medicineName}</span>
                              <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                {it.strength}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                ({it.dosageForm})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              <span className="font-semibold text-slate-700">Directions:</span> {it.instructions}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Item ID: {it.id} • Quantity: {it.quantity}
                            </p>

                            {it.reservationId && (
                              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                                <span className="font-semibold text-brand-800">Reserved at:</span>
                                <span className="text-slate-700 font-medium">{it.reservedFacilityName || 'Verified Pharmacy'}</span>
                                <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                  {it.reservationStatus || 'PENDING'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <Link
                              href={`/patient/search?prescriptionId=${encodeURIComponent(px.id)}&prescriptionItemId=${encodeURIComponent(it.id)}&medicineName=${encodeURIComponent(it.medicineName)}&strength=${encodeURIComponent(it.strength)}&dosageForm=${encodeURIComponent(it.dosageForm)}&patientId=${encodeURIComponent(patient?.id || '')}`}
                            >
                              <Button
                                variant={it.reservationId ? 'outline' : 'primary'}
                                size="sm"
                                className="text-xs h-8 whitespace-nowrap"
                                leftIcon={<Search className="w-3.5 h-3.5" />}
                              >
                                {it.reservationId ? 'View Reservation' : 'Find Medicine'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Triage Overrides Audit Log (if any on backend) */}
          {latestTriage?.overrides && latestTriage.overrides.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-800">Clinical Urgency Override History</CardTitle>
                <CardDescription>Backend audit trail of clinical acuity changes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {latestTriage.overrides.map((ov) => (
                    <div key={ov.id} className="p-3 rounded-control bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">
                          Changed from {ov.previousUrgency} → {ov.newUrgency}
                        </span>
                        <span className="text-slate-400 text-[10px]">{formatTimeAgo(ov.overriddenAt)}</span>
                      </div>
                      <p className="text-slate-600 italic">&ldquo;{ov.overrideReason}&rdquo;</p>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">By: {ov.overriddenBy}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Triage Vitals, Acuity, Actions (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="border-brand-200">
            <CardHeader className="bg-sky-50/50 pb-2">
              <CardTitle className="text-sm text-brand-900">Clinical Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setOverrideUrgency(urgency);
                  setOverrideModalOpen(true);
                }}
                className="w-full justify-between"
                leftIcon={<RotateCcw className="w-4 h-4 text-amber-600" />}
              >
                <span>Override Urgency</span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Audit Logged</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setPrescriptionModalOpen(true)}
                className="w-full justify-between font-semibold"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                <span>Issue e-Prescription</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white">Bridge</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setCompleteModalOpen(true)}
                className="w-full justify-between border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              >
                <span>Complete Consultation</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  Finalize
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Physiological Vitals Snapshot */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-500" />
                <span>Recorded Vital Signs</span>
              </CardTitle>
              <CardDescription>Triage assessment baseline</CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5 text-xs">
              {latestTriage ? (
                <>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Blood Pressure:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {latestTriage.systolicBp}/{latestTriage.diastolicBp} mmHg
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Pulse (Heart Rate):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {latestTriage.pulseRate} bpm
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Respiratory Rate:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {latestTriage.respiratoryRate} /min
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">SpO2 (Oxygen Sat.):</span>
                    <span
                      className={`font-mono font-bold ${
                        latestTriage.oxygenSaturation && latestTriage.oxygenSaturation < 90
                          ? 'text-red-600 font-extrabold'
                          : 'text-slate-900'
                      }`}
                    >
                      {latestTriage.oxygenSaturation ? `${latestTriage.oxygenSaturation}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Temperature:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {latestTriage.temperature}°C
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 italic">No triage vitals recorded for this encounter.</p>
              )}
            </CardContent>
          </Card>

          {/* Triage Acuity Reasoning */}
          {latestTriage?.reasoning && Array.isArray(latestTriage.reasoning) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Triage Acuity Rationale</CardTitle>
                <CardDescription>Automated backend rule findings</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-1.5 text-xs">
                {latestTriage.reasoning.map((r, i) => (
                  <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 leading-snug">
                    • {r}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CLINICAL URGENCY OVERRIDE (POST /triage/:id/override) */}
      {/* ======================================================== */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Clinical Urgency Override"
        description="Authorized healthcare clinicians may override automated triage priority based on clinical presentation."
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
          {overrideError && (
            <Alert variant="error" title="Override Submission Error">
              {overrideError}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select New Clinical Urgency Tier:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['RED', 'YELLOW', 'GREEN'] as const).map((tier) => (
                <button
                  type="button"
                  key={tier}
                  onClick={() => setOverrideUrgency(tier)}
                  className={`p-3 rounded-control border text-center font-bold text-xs transition-all ${
                    overrideUrgency === tier
                      ? tier === 'RED'
                        ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400/20'
                        : tier === 'YELLOW'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400/20'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Mandatory Clinical Justification (min 5 characters)"
            required
            rows={3}
            placeholder="Document why this clinical override is necessary (e.g. Patient exhibiting early signs of deterioration not captured in initial vitals)..."
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />

          <Input
            label="Clinician Name & Designation"
            value={overrideBy}
            onChange={(e) => setOverrideBy(e.target.value)}
          />

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] leading-relaxed">
            <span className="font-bold">Auditability Requirement:</span> Clinical overrides are permanently logged
            in the encounter audit trail with the clinician identifier, previous acuity, and clinical reasoning.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setOverrideModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmittingOverride}
            >
              Confirm Override & Update Backend
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: COMPLETE ENCOUNTER CONFIRMATION */}
      {/* ======================================================== */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Clinical Consultation"
        description="Finalize this encounter and remove the patient from the active waiting queue."
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 leading-relaxed">
            Are you sure you want to conclude the consultation for{' '}
            <strong>
              {patient?.firstName} {patient?.lastName}
            </strong>
            ? This will set encounter status to <strong>COMPLETED</strong> in the backend facility queue.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setCompleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isCompleting}
              onClick={handleCompleteEncounter}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm & Complete Encounter
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: e-PRESCRIPTION COMPOSER (PHASE 1/3 BRIDGE) */}
      {/* ======================================================== */}
      <Modal
        isOpen={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        title="Author Digital e-Prescription"
        description="Prescribe medication items directly for this clinical encounter."
        maxWidth="2xl"
      >
        <form onSubmit={handleSavePrescription} className="space-y-4 text-xs">
          <div className="p-3 rounded bg-sky-50 border border-sky-200 text-sky-900 text-[11px] leading-relaxed">
            <span className="font-bold">Prescription Bridge Notice:</span> Digital prescriptions authored here are
            linked to encounter <code>{encounterId.slice(0, 8)}</code> in client session and provide temporary
            reference IDs for real-time pharmacy inventory lookup and reservations.
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {prescriptionItems.map((item, index) => (
              <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-control space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Medication Item #{index + 1}
                  </span>
                  {prescriptionItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrescriptionItem(index)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amoxicillin"
                      value={item.medicineName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrescriptionItems((prev) =>
                          prev.map((it, i) => (i === index ? { ...it, medicineName: val } : it))
                        );
                      }}
                      className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-control p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Strength
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500mg"
                      value={item.strength}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrescriptionItems((prev) =>
                          prev.map((it, i) => (i === index ? { ...it, strength: val } : it))
                        );
                      }}
                      className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-control p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Dosage Form</label>
                      <select
                        value={item.dosageForm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptionItems((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, dosageForm: val } : it))
                          );
                        }}
                        className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-control p-2"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Injection">Injection</option>
                        <option value="Inhaler">Inhaler</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setPrescriptionItems((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, quantity: val } : it))
                          );
                        }}
                        className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-control p-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Instructions / Directions</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Take 1 capsule three times daily for 7 days after meals"
                    value={item.instructions}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrescriptionItems((prev) =>
                        prev.map((it, i) => (i === index ? { ...it, instructions: val } : it))
                      );
                    }}
                    className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-control p-2"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPrescriptionItem}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Another Medicine
          </Button>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setPrescriptionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Sign & Issue e-Prescription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
