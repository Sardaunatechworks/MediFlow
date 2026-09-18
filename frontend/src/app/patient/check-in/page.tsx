'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { patientApi, encounterApi, ApiError } from '@/lib/api';
import { Gender } from '@/types/domain';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import {
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react';

interface FormState {
  firstName: string;
  lastName: string;
  gender: Gender;
  age: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  patientIdentifier: string;
  presentingComplaint: string;
}

const INITIAL_FORM: FormState = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  age: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  patientIdentifier: '',
  presentingComplaint: '',
};

export default function PatientCheckInPage() {
  const router = useRouter();
  const { facility, setActivePatientId, setActiveEncounterId } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDemoFallback, setIsDemoFallback] = useState(false);

  // Quick preset loader for hackathon judges & testers
  const loadPreset = (presetKey: 'critical' | 'urgent' | 'stable') => {
    setErrors({});
    setApiError(null);

    if (presetKey === 'critical') {
      setForm({
        firstName: 'Musa',
        lastName: 'Danladi',
        gender: 'MALE',
        age: '62',
        dateOfBirth: '1964-04-12',
        phone: '+2348099887766',
        email: 'musa.danladi@example.com',
        address: 'Plot 42, Maitama District, Abuja',
        emergencyContactName: 'Amina Danladi (Spouse)',
        emergencyContactPhone: '+2348099887700',
        patientIdentifier: '',
        presentingComplaint: 'Crushing retrosternal chest pain radiating to left arm and severe shortness of breath',
      });
      toast.info('Loaded Critical Demo Case', 'Musa Danladi (Suspected Acute Coronary Syndrome)');
    } else if (presetKey === 'urgent') {
      setForm({
        firstName: 'Emeka',
        lastName: 'Okonkwo',
        gender: 'MALE',
        age: '36',
        dateOfBirth: '1990-08-20',
        phone: '+2348055667788',
        email: 'emeka.okonkwo@example.com',
        address: '15 Crescent Road, Wuse Zone 4, Abuja',
        emergencyContactName: 'Ngozi Okonkwo (Sister)',
        emergencyContactPhone: '+2348055667700',
        patientIdentifier: '',
        presentingComplaint: 'High continuous fever for 3 days, rigors, headache, and severe abdominal cramping',
      });
      toast.info('Loaded Urgent Demo Case', 'Emeka Okonkwo (Acute Febrile Illness)');
    } else {
      setForm({
        firstName: 'Fatima',
        lastName: 'Bello',
        gender: 'FEMALE',
        age: '28',
        dateOfBirth: '1998-02-14',
        phone: '+2348011223344',
        email: 'fatima.bello@example.com',
        address: 'Flat 6, Garki 2, Abuja',
        emergencyContactName: 'Zainab Bello (Mother)',
        emergencyContactPhone: '+2348011223300',
        patientIdentifier: '',
        presentingComplaint: 'Mild tension headache, dry throat, and clear nasal discharge for 2 days',
      });
      toast.info('Loaded Stable Demo Case', 'Fatima Bello (Mild Upper Respiratory Infection)');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.gender) newErrors.gender = 'Gender selection is required';

    if (form.age) {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
        newErrors.age = 'Age must be a number between 0 and 130';
      }
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email address format';
    }

    if (!form.presentingComplaint.trim()) {
      newErrors.presentingComplaint = 'Presenting complaint is required to initiate an encounter';
    } else if (form.presentingComplaint.trim().length < 5) {
      newErrors.presentingComplaint = 'Please describe the presenting complaint in more detail (min 5 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      toast.error('Validation Error', 'Please complete all required fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. POST /patients
      const patientPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
        age: form.age ? parseInt(form.age, 10) : undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        patientIdentifier: form.patientIdentifier.trim() || undefined,
      };

      const createdPatient = await patientApi.create(patientPayload);
      setActivePatientId(createdPatient.id);

      // 2. POST /encounters
      const encounterPayload = {
        patientId: createdPatient.id,
        facilityId: facility.id,
        presentingComplaint: form.presentingComplaint.trim(),
      };

      const createdEncounter = await encounterApi.create(encounterPayload);
      setActiveEncounterId(createdEncounter.id);

      toast.success(
        'Registration Successful',
        `Patient ${createdPatient.firstName} registered. Encounter created: ${createdEncounter.id.slice(0, 8)}...`
      );

      // 3. Navigate immediately to Triage Assessment
      router.push(`/triage/assess/${createdEncounter.id}`);
    } catch (err: any) {
      console.error('Registration/Encounter error:', err);

      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        // Transparent Demo Mode fallback if local NestJS backend is temporarily offline
        setIsDemoFallback(true);
        const mockPatientId = 'demo-pt-' + Math.random().toString(36).substring(2, 9);
        const mockEncounterId = 'demo-enc-' + Math.random().toString(36).substring(2, 9);

        // Store demo encounter in session storage for fallback continuity
        const demoEncounter = {
          id: mockEncounterId,
          patientId: mockPatientId,
          facilityId: facility.id,
          presentingComplaint: form.presentingComplaint,
          status: 'WAITING',
          startedAt: new Date().toISOString(),
          patient: {
            id: mockPatientId,
            patientIdentifier: form.patientIdentifier || `MF-PT-${Math.floor(100000 + Math.random() * 900000)}`,
            firstName: form.firstName,
            lastName: form.lastName,
            gender: form.gender,
            age: form.age ? parseInt(form.age, 10) : null,
            phone: form.phone,
            email: form.email,
            address: form.address,
            emergencyContactName: form.emergencyContactName,
            emergencyContactPhone: form.emergencyContactPhone,
          },
          facility: facility,
        };

        sessionStorage.setItem(`mediflow_enc_${mockEncounterId}`, JSON.stringify(demoEncounter));
        setActivePatientId(mockPatientId);
        setActiveEncounterId(mockEncounterId);

        toast.warning(
          'Demo Mode Activated',
          'Backend is offline. Running in isolated frontend demo mode.'
        );

        router.push(`/triage/assess/${mockEncounterId}`);
        return;
      }

      setApiError(err.message || 'An error occurred during patient registration.');
      toast.error('Registration Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Patient Registration & Encounter Check-In"
        subtitle="Register patient demographics, contact details, and chief complaint to initiate a prioritized clinical encounter"
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Patient Intake', href: '/patient/check-in' },
          { label: 'Check-In' },
        ]}
      />

      {/* Facility & Clinical Context Bar */}
      <div className="flex items-center justify-between p-3 bg-surface-tint border border-[#E2E8E4] rounded-card text-xs text-[#17201B]">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-[#006B35]" />
          <span>
            Registering at <strong>{facility.name}</strong> ({facility.type})
          </span>
          {facility.verificationStatus === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1 font-bold text-[#006B35] bg-[#EAF7EE] px-2 py-0.5 rounded-full text-[10px]">
              <ShieldCheck className="w-3 h-3" /> Verified Facility
            </span>
          )}
        </div>
        <span className="text-[#66736C] hidden sm:inline text-[11px]">Default Status: WAITING</span>
      </div>

      {/* Quick Preset Toolbar for Testing */}
      <Card className="bg-[#F4F8F5] border-dashed border-[#E2E8E4]">
        <CardContent className="p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#006B35]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#17201B]">
                Test Evaluation Presets:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#FCE8E6] text-[#C5221F] hover:bg-[#FCE8E6]/40 text-xs h-7"
                onClick={() => loadPreset('critical')}
              >
                🔴 Critical: Musa
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#FEF3C7] text-[#B45309] hover:bg-[#FEF3C7]/40 text-xs h-7"
                onClick={() => loadPreset('urgent')}
              >
                🟡 Urgent: Emeka
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#EAF7EE] text-[#006B35] hover:bg-[#EAF7EE]/60 text-xs h-7"
                onClick={() => loadPreset('stable')}
              >
                🟢 Stable: Fatima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {apiError && (
        <Alert variant="error" title="Registration Error">
          {apiError}
        </Alert>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-brand-700">
              <UserPlus className="w-4 h-4" />
              <CardTitle className="text-sm uppercase tracking-wider">
                1. Patient Demographics (Required)
              </CardTitle>
            </div>
            <CardDescription>
              Basic biographical information for patient medical record creation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                placeholder="e.g. Musa"
                value={form.firstName}
                error={errors.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                required
                placeholder="e.g. Danladi"
                value={form.lastName}
                error={errors.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Gender"
                required
                value={form.gender}
                error={errors.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Input
                label="Age"
                type="number"
                min={0}
                max={130}
                placeholder="e.g. 62"
                suffix="yrs"
                value={form.age}
                error={errors.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Hospital Identifier / National Health ID (Optional)"
                placeholder="Leave blank for auto-generated ID (e.g. MF-PT-100003)"
                helperText="If omitted, the facility auto-generates a unique identifier"
                value={form.patientIdentifier}
                onChange={(e) => setForm({ ...form, patientIdentifier: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Contact & Emergency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-slate-700">
              2. Contact & Emergency Details (Optional)
            </CardTitle>
            <CardDescription>
              Patient communication info and next-of-kin for clinical notifications.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. +234 809 988 7766"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. patient@example.com"
                value={form.email}
                error={errors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <Input
              label="Residential Address"
              placeholder="e.g. Plot 42, Maitama District, Abuja"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <Input
                label="Emergency Contact Name"
                placeholder="e.g. Amina Danladi (Spouse)"
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              />
              <Input
                label="Emergency Contact Phone"
                type="tel"
                placeholder="e.g. +234 809 988 7700"
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Clinical Encounter Initiation */}
        <Card className="border-brand-200 ring-1 ring-brand-500/10">
          <CardHeader className="bg-sky-50/40">
            <div className="flex items-center gap-2 text-brand-700">
              <HeartPulse className="w-4 h-4" />
              <CardTitle className="text-sm uppercase tracking-wider">
                3. Clinical Encounter & Chief Complaint (Required)
              </CardTitle>
            </div>
            <CardDescription>
              Describes why the patient is seeking care. Used by triage officers to guide acuity prioritization.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-5">
            <Textarea
              label="Presenting Complaint"
              required
              rows={3}
              placeholder="Describe symptoms, onset, and chief reason for visit (e.g. Severe crushing chest pain radiating to left arm and dyspnea for 2 hours)..."
              value={form.presentingComplaint}
              error={errors.presentingComplaint}
              helperText="Minimum 5 characters. Be specific regarding onset, severity, and location."
              onChange={(e) => setForm({ ...form, presentingComplaint: e.target.value })}
            />

            <div className="p-3 rounded-control bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Next step after check-in:</span>
              <span className="font-semibold text-brand-700 flex items-center gap-1">
                Clinical Triage Assessment (Vitals & Red Flags)
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/75">
            <div className="text-xs text-slate-500">
              * Submitting sends <code>POST /patients</code> followed by <code>POST /encounters</code>.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setForm(INITIAL_FORM)}
                disabled={isSubmitting}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Registering...' : 'Register & Start Triage'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
