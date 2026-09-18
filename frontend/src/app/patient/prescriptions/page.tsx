'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { usePrescriptions } from '@/context/PrescriptionContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reservationApi } from '@/lib/api';
import { Reservation, ReservationStatus } from '@/types/domain';
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCw,
  Info,
  Pill,
  Calendar,
  User,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function PatientPrescriptionsPage() {
  const { prescriptions, updateReservationStatus } = usePrescriptions();
  const { role, activePatientId } = useAuth();
  const toast = useToast();

  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [checkingReservationId, setCheckingReservationId] = useState<string | null>(null);
  const [activeReservationModal, setActiveReservationModal] = useState<Reservation | null>(null);

  // Determine which prescriptions to display
  // If role is PATIENT and activePatientId exists, prioritize matching their patientId, otherwise show all active session prescriptions
  const displayedPrescriptions = role === 'PATIENT' && activePatientId
    ? prescriptions.filter((p) => p.patientId === activePatientId || p.patientId === 'seed-pt-red-001')
    : prescriptions;

  const handleRefreshReservation = async (reservationId: string) => {
    setCheckingReservationId(reservationId);
    try {
      const live = await reservationApi.getById(reservationId);
      updateReservationStatus(reservationId, live.status);
      setActiveReservationModal(live);
      toast.success('Live Status Updated', `Reservation ${reservationId.slice(0, 8)}... status is ${live.status}.`);
    } catch (err: any) {
      toast.error('Status Check Failed', err.message || 'Unable to retrieve live reservation status from backend.');
    } finally {
      setCheckingReservationId(null);
    }
  };

  const getReservationStatusColor = (status?: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'FULFILLED':
        return 'bg-brand-100 text-brand-800 border-brand-300';
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="My Prescriptions & Medications"
        subtitle="Digital prescriptions issued by authorized healthcare clinicians during consultations"
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Patient Portal', href: '/patient/queue' },
          { label: 'Prescriptions' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/patient/search">
              <Button variant="outline" size="sm" leftIcon={<Search className="w-4 h-4 text-brand-600" />}>
                Medicine Search
              </Button>
            </Link>
          </div>
        }
      />

      {/* Mandatory Bridge / Session Storage Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-card p-4 flex items-start gap-3 text-amber-900 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-950">
            MVP Architectural Notice: Client Session Prescription Bridge
          </p>
          <p className="text-amber-800 leading-relaxed">
            Prescription records in this MVP are stored in the current browser session and are not yet permanently stored by the backend.
            Generated prescription and item identifiers serve as valid references for querying real-time medicine inventory and submitting verified pharmacy reservations via <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">POST /reservations</code>.
          </p>
        </div>
      </div>

      {displayedPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<FileText className="w-10 h-10 text-slate-400" />}
              title="No Prescriptions on Record"
              description="You do not have any active digital prescriptions issued in this session yet. Prescriptions are generated by attending doctors upon completing a consultation."
            />
            <div className="mt-4 text-center">
              <Link href="/clinician/queue">
                <Button variant="outline" size="sm">
                  View Clinician Queue
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {displayedPrescriptions.map((prescription) => {
            const isSelected = selectedPrescriptionId === prescription.id;

            return (
              <Card
                key={prescription.id}
                className={`transition-all duration-200 border ${
                  isSelected ? 'border-[#006B35] shadow-sm ring-1 ring-[#006B35]/40' : 'border-[#E2E8E4] hover:border-[#006B35]/30'
                }`}
              >
                <CardHeader className="bg-[#F4F8F5] border-b border-[#E2E8E4] pb-2.5 pt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-6 h-6 rounded-full bg-[#EAF7EE] text-[#006B35] flex items-center justify-center font-bold text-xs">
                        <Pill className="w-3.5 h-3.5" />
                      </div>
                      <CardTitle className="text-sm text-[#17201B] font-bold">
                        Prescription #{prescription.id.slice(0, 12)}
                      </CardTitle>
                      <span className="text-[10px] bg-[#EAF7EE] text-[#006B35] font-mono font-bold px-2 py-0.5 rounded-full">
                        {prescription.status}
                      </span>
                      <span className="text-[10px] bg-[#E2E8E4] text-[#17201B] font-semibold px-2 py-0.5 rounded-full">
                        {prescription.items.length} {prescription.items.length === 1 ? 'Medication' : 'Medications'}
                      </span>
                    </div>

                    <p className="text-xs text-[#66736C] flex items-center gap-2.5 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-[#17201B]">
                        <User className="w-3.5 h-3.5 text-[#66736C]" />
                        Patient: {prescription.patientName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#006B35]" />
                        {prescription.clinicianName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#66736C]" />
                        {new Date(prescription.issuedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-[#66736C] block">
                      Bridge Reference
                    </span>
                    <span className="text-xs font-mono font-bold text-[#17201B] bg-white border border-[#E2E8E4] px-2 py-0.5 rounded">
                      {prescription.id}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {prescription.diagnosisNotes && (
                    <div className="bg-sky-50/60 border-l-3 border-brand-500 p-3 rounded-r-md text-xs text-slate-700">
                      <span className="font-bold text-brand-900 block mb-0.5">Clinical Indication / Diagnosis:</span>
                      &ldquo;{prescription.diagnosisNotes}&rdquo;
                    </div>
                  )}

                  {/* List of Medication Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Prescribed Medicines
                    </h4>

                    {prescription.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-4 rounded-card border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">
                                {item.medicineName}
                              </span>
                              <Badge variant="secondary" size="sm">
                                {item.strength}
                              </Badge>
                              <span className="text-xs font-medium text-slate-500">
                                ({item.dosageForm})
                              </span>
                            </div>

                            <p className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-700">Instructions:</span>{' '}
                              {item.instructions}
                            </p>

                            <p className="text-[11px] text-slate-400 font-mono">
                              Prescribed Quantity: <span className="font-bold text-slate-700">{item.quantity} units</span> • Item ID: {item.id}
                            </p>
                          </div>

                          {/* Action / Reservation status */}
                          <div className="shrink-0 flex items-center gap-2.5">
                            {item.reservationId ? (
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                                    Reservation Status
                                  </span>
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getReservationStatusColor(
                                      item.reservationStatus
                                    )}`}
                                  >
                                    {item.reservationStatus || 'PENDING'}
                                  </span>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRefreshReservation(item.reservationId!)}
                                  isLoading={checkingReservationId === item.reservationId}
                                  title="Check real-time status with backend GET /reservations/:id"
                                  className="h-8 text-xs"
                                  leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
                                >
                                  Status
                                </Button>
                              </div>
                            ) : (
                              <Link
                                href={`/patient/search?prescriptionId=${encodeURIComponent(
                                  prescription.id
                                )}&prescriptionItemId=${encodeURIComponent(
                                  item.id
                                )}&medicineName=${encodeURIComponent(
                                  item.medicineName
                                )}&strength=${encodeURIComponent(
                                  item.strength
                                )}&dosageForm=${encodeURIComponent(
                                  item.dosageForm
                                )}&patientId=${encodeURIComponent(prescription.patientId)}`}
                              >
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-8 text-xs font-semibold"
                                  leftIcon={<Search className="w-3.5 h-3.5" />}
                                >
                                  Find in Verified Pharmacies
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* If reservation is attached, show details banner */}
                        {item.reservationId && (
                          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-800">
                                  Reserved at: {item.reservedFacilityName || 'Selected Verified Pharmacy'}
                                </span>
                                <span className="text-slate-400 text-[11px] block font-mono">
                                  Reservation ID: {item.reservationId}
                                </span>
                              </div>
                            </div>

                            <Link
                              href={`/patient/search?prescriptionId=${encodeURIComponent(
                                prescription.id
                              )}&prescriptionItemId=${encodeURIComponent(
                                item.id
                              )}&medicineName=${encodeURIComponent(
                                item.medicineName
                              )}&strength=${encodeURIComponent(
                                item.strength
                              )}&dosageForm=${encodeURIComponent(
                                item.dosageForm
                              )}&patientId=${encodeURIComponent(prescription.patientId)}`}
                            >
                              <span className="text-brand-600 hover:text-brand-800 font-semibold text-xs flex items-center gap-1">
                                View Pharmacy Details <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Live Reservation Detail Modal */}
      {activeReservationModal && (
        <Modal
          isOpen={Boolean(activeReservationModal)}
          onClose={() => setActiveReservationModal(null)}
          title="Live Reservation Verification"
          description="Direct record returned by GET /reservations/:id"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-card p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Reservation ID:</span>
                <span className="font-mono font-bold text-slate-800">{activeReservationModal.id}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${getReservationStatusColor(activeReservationModal.status)}`}>
                  {activeReservationModal.status}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Medicine:</span>
                <span className="font-bold text-slate-900">
                  {activeReservationModal.medicine?.genericName} ({activeReservationModal.medicine?.strength}, {activeReservationModal.medicine?.dosageForm})
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Pharmacy Facility:</span>
                <span className="font-bold text-slate-900">{activeReservationModal.facility?.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Pharmacy Address:</span>
                <span className="text-slate-700">{activeReservationModal.facility?.address}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Requested At:</span>
                <span className="font-mono text-slate-700">
                  {new Date(activeReservationModal.requestedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Expires At:</span>
                <span className="font-mono text-amber-800 font-bold">
                  {activeReservationModal.expiresAt ? new Date(activeReservationModal.expiresAt).toLocaleString() : 'Standard 2 Hours'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded text-slate-700 space-y-1">
              <p className="font-bold text-brand-900">Next Step:</p>
              <p className="text-[11px] leading-relaxed">
                {activeReservationModal.status === 'PENDING' && (
                  'Your reservation request has been submitted to the pharmacy. Pharmacy staff will verify stock on hand and confirm your reservation.'
                )}
                {activeReservationModal.status === 'CONFIRMED' && (
                  'Your reservation is confirmed! You may visit the pharmacy with this reservation reference ID to pick up your medication.'
                )}
                {activeReservationModal.status === 'FULFILLED' && (
                  'Medication has been dispensed and collected. Stock was automatically deducted from pharmacy inventory.'
                )}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setActiveReservationModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
