'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { encounterApi, triageApi, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Encounter, UrgencyLevel } from '@/types/domain';
import { TriageAssessResponse } from '@/types/api';
import { getUrgencyConfig, formatTimeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  HeartPulse,
  Info,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
  Plus,
  Check,
} from 'lucide-react';

interface VitalsForm {
  temperature: string;
  systolicBp: string;
  diastolicBp: string;
  pulseRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  assessedBy: string;
}

const RED_FLAGS_CATALOGUE = [
  { key: 'severeBleeding', label: 'Severe bleeding', hint: 'Arterial spurting or major blood loss' },
  { key: 'severeRespiratoryDistress', label: 'Breathing difficulty', hint: 'Stridor, severe intercostal retractions' },
  { key: 'alteredMentalStatus', label: 'Loss of consciousness', hint: 'GCS < 14, unresponsiveness, confusion' },
  { key: 'seizureActive', label: 'Seizure active', hint: 'Ongoing convulsion or prolonged post-ictal' },
  { key: 'severeChestPain', label: 'Severe chest pain', hint: 'Crushing, radiation to left arm/jaw' },
  { key: 'shockSigns', label: 'Shock signs', hint: 'Systolic BP < 90, cold clammy extremities' },
  { key: 'anaphylaxis', label: 'Anaphylaxis', hint: 'Facial/lip swelling, acute wheezing' },
  { key: 'strokeSigns', label: 'Stroke signs', hint: 'Facial droop, unilateral weakness, slurred speech' },
];

const COMMON_SYMPTOMS = [
  'Severe Chest Pain',
  'Shortness of breath (Dyspnea)',
  'High Fever',
  'Severe Headache',
  'Abdominal Pain',
  'Dizziness / Vertigo',
  'Persistent Vomiting',
  'Palpitations',
];

export default function TriageAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const encounterId = params?.encounterId as string;
  const toast = useToast();
  const { role } = useAuth();

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isLoadingEncounter, setIsLoadingEncounter] = useState(true);
  const [encounterError, setEncounterError] = useState<string | null>(null);

  // Vitals form
  const [vitals, setVitals] = useState<VitalsForm>({
    temperature: '',
    systolicBp: '',
    diastolicBp: '',
    pulseRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    assessedBy: 'Nurse Amina (Triage Officer)',
  });

  const [redFlags, setRedFlags] = useState<Record<string, boolean>>({});
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed / evaluated result from backend
  const [result, setResult] = useState<TriageAssessResponse | null>(null);

  // Urgency Override modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideUrgency, setOverrideUrgency] = useState<UrgencyLevel>('YELLOW');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Fetch encounter data
  useEffect(() => {
    let mounted = true;
    const fetchEncounter = async () => {
      if (!encounterId) return;
      setIsLoadingEncounter(true);
      setEncounterError(null);

      try {
        const data = await encounterApi.getById(encounterId);
        if (mounted) {
          setEncounter(data);

          if (data.triageAssessments && data.triageAssessments.length > 0) {
            const latest = data.triageAssessments[data.triageAssessments.length - 1];
            setResult({
              assessment: latest,
              evaluation: {
                recommendedUrgency: latest.recommendedUrgency,
                reasoning: latest.reasoning || ['Prior triage assessment on record'],
                isCriticalAlert: latest.isCriticalAlert,
                priorityScore: data.priorityScore,
                safetyDisclaimer: 'Clinical decision-support evaluation on record.',
              },
            });
            setVitals({
              temperature: latest.temperature?.toString() || '',
              systolicBp: latest.systolicBp?.toString() || '',
              diastolicBp: latest.diastolicBp?.toString() || '',
              pulseRate: latest.pulseRate?.toString() || '',
              respiratoryRate: latest.respiratoryRate?.toString() || '',
              oxygenSaturation: latest.oxygenSaturation?.toString() || '',
              assessedBy: latest.assessedBy || 'Triage Officer',
            });
            if (latest.redFlags) setRedFlags(latest.redFlags as Record<string, boolean>);
            if (latest.symptoms) setSymptoms(latest.symptoms);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setEncounterError(err.message || 'Unable to retrieve encounter.');
        }
      } finally {
        if (mounted) {
          setIsLoadingEncounter(false);
        }
      }
    };

    fetchEncounter();
    return () => {
      mounted = false;
    };
  }, [encounterId]);

  const loadTriagePreset = (preset: 'red' | 'yellow' | 'green') => {
    if (preset === 'red') {
      setVitals({
        temperature: '38.2',
        systolicBp: '85',
        diastolicBp: '55',
        pulseRate: '128',
        respiratoryRate: '32',
        oxygenSaturation: '86',
        assessedBy: 'Nurse Amina (Triage Officer)',
      });
      setRedFlags({
        severeRespiratoryDistress: true,
        severeChestPain: true,
      });
      setSymptoms(['Shortness of breath (Dyspnea)', 'Severe Chest Pain']);
      toast.error('Critical RED Preset Loaded', 'Hypoxia (SpO2 86%) + Chest Pain loaded. Ready to assess.');
    } else if (preset === 'yellow') {
      setVitals({
        temperature: '39.4',
        systolicBp: '135',
        diastolicBp: '88',
        pulseRate: '104',
        respiratoryRate: '22',
        oxygenSaturation: '96',
        assessedBy: 'Nurse Amina (Triage Officer)',
      });
      setRedFlags({});
      setSymptoms(['High Fever', 'Severe Headache', 'Persistent Vomiting']);
      toast.warning('Urgent YELLOW Preset Loaded', 'High pyrexia (39.4°C) loaded. Ready to assess.');
    } else {
      setVitals({
        temperature: '36.8',
        systolicBp: '120',
        diastolicBp: '80',
        pulseRate: '72',
        respiratoryRate: '16',
        oxygenSaturation: '99',
        assessedBy: 'Nurse Amina (Triage Officer)',
      });
      setRedFlags({});
      setSymptoms(['Fatigue / Malaise']);
      toast.success('Stable GREEN Preset Loaded', 'Normal baseline vitals loaded. Ready to assess.');
    }
  };

  const toggleRedFlag = (key: string) => {
    setRedFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const addCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSymptom.trim();
    if (clean && !symptoms.includes(clean)) {
      setSymptoms((prev) => [...prev, clean]);
      setCustomSymptom('');
    }
  };

  const validateVitals = (): boolean => {
    const errs: Record<string, string> = {};

    const temp = parseFloat(vitals.temperature);
    if (isNaN(temp) || temp < 30 || temp > 45) {
      errs.temperature = 'Must be 30–45°C';
    }

    const sbp = parseInt(vitals.systolicBp, 10);
    if (isNaN(sbp) || sbp < 40 || sbp > 300) {
      errs.systolicBp = 'Must be 40–300';
    }

    const dbp = parseInt(vitals.diastolicBp, 10);
    if (isNaN(dbp) || dbp < 20 || dbp > 200) {
      errs.diastolicBp = 'Must be 20–200';
    }

    const hr = parseInt(vitals.pulseRate, 10);
    if (isNaN(hr) || hr < 20 || hr > 250) {
      errs.pulseRate = 'Must be 20–250';
    }

    const rr = parseInt(vitals.respiratoryRate, 10);
    if (isNaN(rr) || rr < 4 || rr > 80) {
      errs.respiratoryRate = 'Must be 4–80';
    }

    if (vitals.oxygenSaturation) {
      const spo2 = parseFloat(vitals.oxygenSaturation);
      if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
        errs.oxygenSaturation = 'Must be 50–100%';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateVitals()) {
      toast.error('Validation Error', 'Please correct vital signs out of physiological range.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      temperature: parseFloat(vitals.temperature),
      systolicBp: parseInt(vitals.systolicBp, 10),
      diastolicBp: parseInt(vitals.diastolicBp, 10),
      pulseRate: parseInt(vitals.pulseRate, 10),
      respiratoryRate: parseInt(vitals.respiratoryRate, 10),
      oxygenSaturation: vitals.oxygenSaturation ? parseFloat(vitals.oxygenSaturation) : undefined,
      redFlags,
      symptoms,
      assessedBy: vitals.assessedBy.trim() || 'Triage Officer',
    };

    try {
      // POST /encounters/:id/triage
      const res = await triageApi.assess(encounterId, payload);
      setResult(res);

      if (res.evaluation.recommendedUrgency === 'RED') {
        toast.error('CRITICAL TRIAGE ALERT: RED', 'Immediate clinical escalation triggered.');
      } else if (res.evaluation.recommendedUrgency === 'YELLOW') {
        toast.warning('URGENT TRIAGE: YELLOW', 'Patient marked for urgent assessment.');
      } else {
        toast.success('STABLE TRIAGE: GREEN', 'Patient placed in prioritized queue.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        toast.error('Backend Offline', 'Clinical triage evaluation requires the live NestJS backend.');
        return;
      }
      toast.error('Triage Submission Failed', err.message || 'Error communicating with backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result?.assessment?.id) {
      toast.error('Error', 'No active triage assessment ID to override.');
      return;
    }

    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      toast.error('Validation Error', 'Please state a clinical justification of at least 5 characters.');
      return;
    }

    setIsSubmittingOverride(true);

    try {
      const updated = await triageApi.override(result.assessment.id, {
        newUrgency: overrideUrgency,
        overrideReason: overrideReason.trim(),
        overriddenBy: 'Nurse Amina (Triage Officer)',
      });

      setResult((prev) =>
        prev
          ? {
              ...prev,
              assessment: updated,
              evaluation: {
                ...prev.evaluation,
                recommendedUrgency: updated.finalUrgency,
                reasoning: [
                  `Clinical Urgency Overridden to ${updated.finalUrgency}: "${overrideReason.trim()}"`,
                  ...prev.evaluation.reasoning,
                ],
              },
            }
          : null
      );

      toast.success('Urgency Overridden', `Acuity updated to ${updated.finalUrgency} with audit justification.`);
      setOverrideModalOpen(false);
    } catch (err: any) {
      toast.error('Override Failed', err.message || 'Unable to submit urgency override to backend.');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  if (isLoadingEncounter) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto py-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-96 lg:col-span-2 rounded-[12px]" />
          <Skeleton className="h-96 rounded-[12px]" />
        </div>
      </div>
    );
  }

  if (encounterError && !encounter) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Unable to Load Encounter"
          message={`Could not load clinical encounter with ID: ${encounterId}. ${encounterError}`}
          onRetry={() => window.location.reload()}
        />
        <div className="mt-4 text-center">
          <Link href="/patient/check-in">
            <Button variant="outline" size="sm">
              Back to Patient Check-In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const patient = encounter?.patient;

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Figma Header */}
      <PageHeader
        title="Triage Desk"
        subtitle="Capture essential clinical observations and establish urgency."
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Triage Desk', href: '/triage' },
          { label: `${patient?.firstName || ''} ${patient?.lastName || ''}` },
        ]}
      />

      {/* Main 2-Column Clinical Layout matching Figma Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: New Patient Assessment Form (~65% width) */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>New patient assessment</CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleTriageSubmit} className="space-y-4">
                {/* Demographics Row (Full name, Age, Sex) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[12px] font-medium text-[#4A554E] mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${patient?.firstName || ''} ${patient?.lastName || ''}`}
                      placeholder="Enter patient name"
                      className="w-full h-9 bg-white text-[#17201B] text-[13px] border border-[#E2E8E4] rounded-[8px] px-3 font-medium cursor-default"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[12px] font-medium text-[#4A554E] mb-1">
                      Age
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={patient?.age ? `${patient.age} yrs` : 'N/A'}
                      placeholder="Age"
                      className="w-full h-9 bg-white text-[#17201B] text-[13px] border border-[#E2E8E4] rounded-[8px] px-3 cursor-default"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[12px] font-medium text-[#4A554E] mb-1">
                      Sex
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={patient?.gender || 'Select'}
                      className="w-full h-9 bg-white text-[#17201B] text-[13px] border border-[#E2E8E4] rounded-[8px] px-3 cursor-default"
                    />
                  </div>
                </div>

                {/* Vital Signs Row (BP, Pulse, Resp. rate, SpO2, Temp.) in a single 5-column grid */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A554E] mb-1">
                    Vital signs
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div>
                      <span className="block text-[11px] text-[#66736C] mb-0.5">BP (Sys/Dia)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="120"
                          value={vitals.systolicBp}
                          onChange={(e) => setVitals({ ...vitals, systolicBp: e.target.value })}
                          className={`w-full h-9 bg-white text-[#17201B] text-[13px] border rounded-[8px] px-2 text-center focus:outline-none focus:ring-1 focus:ring-[#006B35] ${
                            formErrors.systolicBp ? 'border-red-500' : 'border-[#E2E8E4]'
                          }`}
                        />
                        <span className="text-[#A3AEA7]">/</span>
                        <input
                          type="number"
                          placeholder="80"
                          value={vitals.diastolicBp}
                          onChange={(e) => setVitals({ ...vitals, diastolicBp: e.target.value })}
                          className={`w-full h-9 bg-white text-[#17201B] text-[13px] border rounded-[8px] px-2 text-center focus:outline-none focus:ring-1 focus:ring-[#006B35] ${
                            formErrors.diastolicBp ? 'border-red-500' : 'border-[#E2E8E4]'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] text-[#66736C] mb-0.5">Pulse (bpm)</span>
                      <input
                        type="number"
                        placeholder="--"
                        value={vitals.pulseRate}
                        onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
                        className={`w-full h-9 bg-white text-[#17201B] text-[13px] border rounded-[8px] px-3 focus:outline-none focus:ring-1 focus:ring-[#006B35] ${
                          formErrors.pulseRate ? 'border-red-500' : 'border-[#E2E8E4]'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="block text-[11px] text-[#66736C] mb-0.5">Resp. rate (/min)</span>
                      <input
                        type="number"
                        placeholder="--"
                        value={vitals.respiratoryRate}
                        onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                        className={`w-full h-9 bg-white text-[#17201B] text-[13px] border rounded-[8px] px-3 focus:outline-none focus:ring-1 focus:ring-[#006B35] ${
                          formErrors.respiratoryRate ? 'border-red-500' : 'border-[#E2E8E4]'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="block text-[11px] text-[#66736C] mb-0.5">SpO₂ (%)</span>
                      <input
                        type="number"
                        placeholder="--"
                        value={vitals.oxygenSaturation}
                        onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                        className={`w-full h-9 bg-white text-[#17201B] text-[13px] border rounded-[8px] px-3 focus:outline-none focus:ring-1 focus:ring-[#006B35] ${
                          formErrors.oxygenSaturation ? 'border-red-500' : 'border-[#E2E8E4]'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="block text-[11px] text-[#66736C] mb-0.5">Temp. (°C)</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="--"
                        value={vitals.temperature}
                        onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                        className={`w-full h-9 bg-white text-[#17201B] text-[13px] border rounded-[8px] px-3 focus:outline-none focus:ring-1 focus:ring-[#006B35] ${
                          formErrors.temperature ? 'border-red-500' : 'border-[#E2E8E4]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Presenting Complaint */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A554E] mb-1">
                    Presenting complaint
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={encounter?.presentingComplaint || ''}
                    placeholder="Describe the main complaint"
                    className="w-full h-9 bg-white text-[#17201B] text-[13px] border border-[#E2E8E4] rounded-[8px] px-3"
                  />
                </div>

                {/* Observed Symptoms */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A554E] mb-1.5">
                    Observed symptoms
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COMMON_SYMPTOMS.map((symptom) => {
                      const isSelected = symptoms.includes(symptom);
                      return (
                        <button
                          type="button"
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-[#006B35] text-white font-semibold shadow-2xs'
                              : 'bg-[#F4F8F5] text-[#17201B] border border-[#E2E8E4] hover:bg-[#EBF1ED]'
                          }`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Select or enter symptoms"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSymptom(e);
                        }
                      }}
                      className="flex-1 h-8.5 bg-white text-[#17201B] text-[12px] border border-[#E2E8E4] rounded-[8px] px-3 focus:outline-none focus:ring-1 focus:ring-[#006B35]"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addCustomSymptom}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Red-flag indicators with light red pill styling */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A554E] mb-1.5">
                    Red-flag indicators
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RED_FLAGS_CATALOGUE.map((flag) => {
                      const isChecked = Boolean(redFlags[flag.key]);
                      return (
                        <button
                          type="button"
                          key={flag.key}
                          onClick={() => toggleRedFlag(flag.key)}
                          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all select-none flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-[#FCE8E6] text-[#C5221F] border border-[#F8B4B4] shadow-2xs ring-1 ring-[#C5221F]/20'
                              : 'bg-[#FCE8E6]/60 text-[#C5221F]/80 border border-transparent hover:bg-[#FCE8E6]'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 text-[#C5221F]" />}
                          <span>{flag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-3 pt-3 border-t border-[#E2E8E4]">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => {
                      toast.success('Assessment Draft Saved', 'Triage draft observations recorded locally.');
                    }}
                  >
                    Save assessment
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                  >
                    Assess urgency
                  </Button>

                  {/* Preset Helper Pills */}
                  <div className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] text-[#66736C]">
                    <span className="font-medium">Presets:</span>
                    <button
                      type="button"
                      onClick={() => loadTriagePreset('red')}
                      className="px-2 py-0.5 rounded bg-[#FCE8E6] text-[#C5221F] font-semibold hover:bg-[#F8B4B4]/40"
                    >
                      RED
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTriagePreset('yellow')}
                      className="px-2 py-0.5 rounded bg-[#FEFCE8] text-[#B45309] font-semibold hover:bg-[#FDE047]/40"
                    >
                      YELLOW
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTriagePreset('green')}
                      className="px-2 py-0.5 rounded bg-[#EAF7EE] text-[#006B35] font-semibold hover:bg-[#C4D4C9]"
                    >
                      GREEN
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Urgency Recommendation Card (~35% width) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Urgency recommendation</CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {result ? (
                <>
                  {/* Urgency Acuity Card matching Figma */}
                  <div
                    className={`p-4 rounded-[10px] space-y-1 ${
                      result.evaluation.recommendedUrgency === 'RED'
                        ? 'bg-[#FCE8E6] text-[#C5221F]'
                        : result.evaluation.recommendedUrgency === 'YELLOW'
                        ? 'bg-[#FEFCE8] text-[#B45309]'
                        : 'bg-[#EAF7EE] text-[#006B35]'
                    }`}
                  >
                    <h4 className="text-[15px] font-extrabold tracking-tight uppercase">
                      {result.evaluation.recommendedUrgency === 'RED' && 'RED • IMMEDIATE'}
                      {result.evaluation.recommendedUrgency === 'YELLOW' && 'YELLOW • URGENT'}
                      {result.evaluation.recommendedUrgency === 'GREEN' && 'GREEN • STABLE'}
                    </h4>
                    <p className="text-[13px] font-bold">
                      {result.evaluation.recommendedUrgency === 'RED'
                        ? 'Critical indicators detected'
                        : result.evaluation.recommendedUrgency === 'YELLOW'
                        ? 'Urgent indicators detected'
                        : 'Standard acuity flow'}
                    </p>
                    <p className="text-[12px] opacity-90 leading-relaxed pt-0.5">
                      {result.evaluation.reasoning[0] ||
                        'Severe breathing difficulty and low oxygen saturation require immediate review.'}
                    </p>
                  </div>

                  {/* Why this recommendation section */}
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-[#17201B]">
                      Why this recommendation
                    </p>
                    <div className="space-y-1.5">
                      {result.evaluation.reasoning.map((reason, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 bg-[#F4F8F5] border border-[#E2E8E4] rounded-[8px] text-[12px] text-[#17201B] font-medium"
                        >
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons matching Figma */}
                  <div className="space-y-2 pt-2">
                    <Link href="/clinician/queue" className="block w-full">
                      <Button variant="primary" size="md" className="w-full justify-center">
                        Escalate to clinician
                      </Button>
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setOverrideUrgency(result.evaluation.recommendedUrgency);
                        setOverrideModalOpen(true);
                      }}
                      className="w-full justify-center"
                    >
                      Override recommendation
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#F4F8F5] text-[#8CA696] flex items-center justify-center mx-auto">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#17201B]">Awaiting Evaluation</h4>
                    <p className="text-[12px] text-[#66736C] max-w-xs mx-auto mt-1 leading-relaxed">
                      Enter patient vital signs and select any active red-flags, then click &ldquo;Assess urgency&rdquo; to calculate acuity.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loadTriagePreset('red')}
                    className="text-xs"
                  >
                    Load RED Demo Preset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Urgency Override Modal */}
      {overrideModalOpen && (
        <Modal
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          title="Clinical Urgency Override"
          description="Audited modification of algorithmically recommended triage urgency"
          maxWidth="md"
        >
          <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
            <div className="bg-[#FEFCE8] border border-[#FDE047] rounded-[8px] p-3 text-[#B45309] space-y-1">
              <p className="font-bold">Clinical Audit Notice:</p>
              <p className="text-[11px] leading-relaxed">
                All acuity tier modifications are permanently logged with clinician attribution and justification.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4A554E] mb-1.5">
                Target Acuity Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['RED', 'YELLOW', 'GREEN'] as UrgencyLevel[]).map((tier) => (
                  <button
                    type="button"
                    key={tier}
                    onClick={() => setOverrideUrgency(tier)}
                    className={`py-2 px-3 rounded-[8px] font-bold text-xs border transition-all ${
                      overrideUrgency === tier
                        ? tier === 'RED'
                          ? 'bg-[#FCE8E6] text-[#C5221F] border-[#F8B4B4] ring-2 ring-[#C5221F]/20'
                          : tier === 'YELLOW'
                          ? 'bg-[#FEFCE8] text-[#B45309] border-[#FDE047] ring-2 ring-[#B45309]/20'
                          : 'bg-[#EAF7EE] text-[#006B35] border-[#A3D9B1] ring-2 ring-[#006B35]/20'
                        : 'bg-white text-[#66736C] border-[#E2E8E4]'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4A554E] mb-1">
                Clinical Override Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Patient exhibits signs of uncompensated shock despite borderline blood pressure..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full bg-white text-[#17201B] text-[13px] border border-[#E2E8E4] rounded-[8px] p-2.5 focus:outline-none focus:ring-1 focus:ring-[#006B35]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8E4]">
              <Button type="button" variant="ghost" size="md" onClick={() => setOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmittingOverride}>
                Confirm Override
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
