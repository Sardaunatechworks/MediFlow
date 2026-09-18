'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { usePrescriptions } from '@/context/PrescriptionContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { medicineApi, availabilityApi, reservationApi, inventoryApi } from '@/lib/api';
import { Medicine, Reservation, PharmacyInventory } from '@/types/domain';
import { AvailabilityResult } from '@/types/api';
import {
  Search,
  Pill,
  Building2,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  DollarSign,
  ArrowRight,
  Check,
} from 'lucide-react';

function PatientSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { prescriptions, updateItemReservation, recordReservationId } = usePrescriptions();
  const { activePatientId } = useAuth();
  const toast = useToast();

  // Query parameter extraction
  const paramPrescriptionId = searchParams.get('prescriptionId') || '';
  const paramPrescriptionItemId = searchParams.get('prescriptionItemId') || '';
  const paramMedicineName = searchParams.get('medicineName') || '';
  const paramStrength = searchParams.get('strength') || '';
  const paramDosageForm = searchParams.get('dosageForm') || '';
  const paramPatientId = searchParams.get('patientId') || '';

  // Selected Active Prescription context
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>(paramPrescriptionId);
  const [selectedItemId, setSelectedItemId] = useState<string>(paramPrescriptionItemId);

  // Exact search parameters
  const [searchMedicineName, setSearchMedicineName] = useState<string>(paramMedicineName || 'Amoxicillin');
  const [searchStrength, setSearchStrength] = useState<string>(paramStrength || '500mg');
  const [searchDosageForm, setSearchDosageForm] = useState<string>(paramDosageForm || 'Capsule');
  const [searchPatientId, setSearchPatientId] = useState<string>(paramPatientId || activePatientId || 'seed-pt-red-001');

  // Backend Search State
  const [isSearchingMedicine, setIsSearchingMedicine] = useState(false);
  const [isSearchingAvailability, setIsSearchingAvailability] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  // Resolved exact medicine from GET /medicines/search
  const [matchedMedicine, setMatchedMedicine] = useState<Medicine | null>(null);
  const [medicineSearchPerformed, setMedicineSearchPerformed] = useState(false);

  // Results from GET /availability/search
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResult[]>([]);
  const [availabilitySearched, setAvailabilitySearched] = useState(false);

  // Modal States
  const [selectedPharmacyForDetails, setSelectedPharmacyForDetails] = useState<AvailabilityResult | null>(null);
  const [pharmacyInventoryList, setPharmacyInventoryList] = useState<PharmacyInventory[]>([]);
  const [isLoadingPharmacyInventory, setIsLoadingPharmacyInventory] = useState(false);

  // Reservation Flow States
  const [reservationCandidate, setReservationCandidate] = useState<AvailabilityResult | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  // If URL params change, update state
  useEffect(() => {
    if (paramMedicineName) setSearchMedicineName(paramMedicineName);
    if (paramStrength) setSearchStrength(paramStrength);
    if (paramDosageForm) setSearchDosageForm(paramDosageForm);
    if (paramPrescriptionId) setSelectedPrescriptionId(paramPrescriptionId);
    if (paramPrescriptionItemId) setSelectedItemId(paramPrescriptionItemId);
    if (paramPatientId) setSearchPatientId(paramPatientId);
  }, [paramMedicineName, paramStrength, paramDosageForm, paramPrescriptionId, paramPrescriptionItemId, paramPatientId]);

  // Execute Exact Medicine Verification & Availability Search
  const handleExecuteExactSearch = useCallback(async (
    medName: string,
    strength: string,
    dosageForm: string
  ) => {
    if (!medName.trim()) {
      toast.error('Validation Error', 'Prescribed medication name is required.');
      return;
    }

    setIsSearchingMedicine(true);
    setMedicineSearchPerformed(true);
    setMatchedMedicine(null);
    setAvailabilityResults([]);
    setAvailabilitySearched(false);
    setBackendOffline(false);

    try {
      // Step 1: Query exact medicine catalogue via GET /medicines/search?name=...&strength=...&dosageForm=...
      const medicines = await medicineApi.search({
        name: medName.trim(),
        strength: strength.trim() || undefined,
        dosageForm: dosageForm.trim() || undefined,
      });

      if (!medicines || medicines.length === 0) {
        // Exact prescribed medicine was not found
        setMatchedMedicine(null);
        setIsSearchingMedicine(false);
        return;
      }

      // Exact match identified (select primary matching catalogue item)
      const exactMatch = medicines[0];
      setMatchedMedicine(exactMatch);
      setIsSearchingMedicine(false);

      // Step 2: Query availability via GET /availability/search?medicineId=...&strength=...&dosageForm=...
      setIsSearchingAvailability(true);
      const avail = await availabilityApi.search({
        medicineId: exactMatch.id,
        strength: exactMatch.strength,
        dosageForm: exactMatch.dosageForm,
      });

      setAvailabilityResults(avail || []);
      setAvailabilitySearched(true);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || err?.statusCode === 0) {
        setBackendOffline(true);
      }
      toast.error('Search Failed', err.message || 'Unable to connect to backend search service.');
    } finally {
      setIsSearchingMedicine(false);
      setIsSearchingAvailability(false);
    }
  }, [toast]);

  // Auto-run search on mount if parameters exist
  useEffect(() => {
    if (searchMedicineName) {
      handleExecuteExactSearch(searchMedicineName, searchStrength, searchDosageForm);
    }
  }, [searchMedicineName, searchStrength, searchDosageForm, handleExecuteExactSearch]);

  // View Pharmacy Details Modal handler
  const handleOpenPharmacyDetails = async (result: AvailabilityResult) => {
    setSelectedPharmacyForDetails(result);
    setPharmacyInventoryList([]);
    if (!result.facilityId) return;

    setIsLoadingPharmacyInventory(true);
    try {
      const inv = await inventoryApi.list(result.facilityId);
      setPharmacyInventoryList(inv || []);
    } catch {
      // Gracefully handle if detailed inventory endpoint fails
      setPharmacyInventoryList([]);
    } finally {
      setIsLoadingPharmacyInventory(false);
    }
  };

  // Submit Reservation via POST /reservations
  const handleConfirmReservation = async () => {
    if (!reservationCandidate || !matchedMedicine) {
      toast.error('Error', 'Missing medication or pharmacy candidate.');
      return;
    }

    const prescriptionId = selectedPrescriptionId || `px-gen-${Date.now()}`;
    const prescriptionItemId = selectedItemId || `item-gen-${Date.now()}`;
    const facilityId = reservationCandidate.facilityId;
    const medicineId = matchedMedicine.id;
    const patientId = searchPatientId || 'seed-pt-red-001';

    setIsReserving(true);
    try {
      // POST /reservations
      const created = await reservationApi.create({
        prescriptionId,
        prescriptionItemId,
        facilityId,
        medicineId,
        patientId,
      });

      setConfirmedReservation(created);
      recordReservationId(created.id);

      // Update the client session prescription bridge
      updateItemReservation(
        prescriptionId,
        prescriptionItemId,
        created.id,
        created.status,
        reservationCandidate.facilityId,
        reservationCandidate.facility?.name || 'Verified Pharmacy'
      );

      toast.success(
        'Reservation Created (PENDING)',
        `Reservation ${created.id.slice(0, 8)}... created. Awaiting pharmacy staff confirmation.`
      );
      setReservationCandidate(null);
    } catch (err: any) {
      toast.error('Reservation Failed', err.message || 'The pharmacy could not process the reservation request.');
    } finally {
      setIsReserving(false);
    }
  };

  const getFreshnessBadge = (freshness?: string) => {
    switch (freshness) {
      case 'CONFIRMED_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
            <Check className="w-3 h-3 text-emerald-700" /> Confirmed Stock (&lt; 2h)
          </span>
        );
      case 'RECENTLY_UPDATED':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-300">
            <Clock className="w-3 h-3 text-sky-700" /> Updated (&lt; 24h)
          </span>
        );
      case 'LOW_CONFIDENCE':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" /> Stale (&gt; 24h)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-slate-500" /> Unverified Freshness
          </span>
        );
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Pharmacy
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Rejected Facility
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Find Prescribed Medicine"
        subtitle="Locate exact prescribed medication across verified pharmacies with real-time stock and hold reservations"
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Patient Portal', href: '/patient/prescriptions' },
          { label: 'Verified Medicine Search' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/patient/prescriptions">
              <Button variant="outline" size="sm">
                View My Prescriptions
              </Button>
            </Link>
          </div>
        }
      />

      {/* Backend Offline Notice if applicable */}
      {backendOffline && (
        <div className="bg-rose-50 border border-rose-200 rounded-card p-4 flex items-start gap-3 text-rose-900 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-rose-950">Demo Mode — Backend Offline</p>
            <p className="text-rose-800 leading-relaxed">
              The NestJS backend server at <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">http://localhost:3000</code> is currently unreachable.
              Real-time catalogue search and reservation endpoints cannot be completed until the backend is running.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Prescribed Medicine Context Header */}
      <Card className="border-[#E2E8E4] bg-[#F4F8F5] shadow-2xs">
        <CardHeader className="pb-2.5 pt-3 border-b border-[#E2E8E4]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#006B35] text-white flex items-center justify-center font-bold">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#006B35] uppercase font-mono tracking-wider block font-bold">
                  Prescription Target
                </span>
                <CardTitle className="text-base text-[#17201B]">
                  {searchMedicineName}
                </CardTitle>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="bg-white border border-[#E2E8E4] px-2.5 py-0.5 rounded text-[#17201B] font-semibold font-mono">
                Strength: {searchStrength || 'Standard'}
              </span>
              <span className="bg-white border border-[#E2E8E4] px-2.5 py-0.5 rounded text-[#17201B] font-semibold">
                Form: {searchDosageForm || 'Tablet'}
              </span>
              {selectedPrescriptionId && (
                <span className="bg-[#EAF7EE] text-[#006B35] border border-[#006B35]/30 px-2 py-0.5 rounded text-[11px] font-mono">
                  Prescription Ref: {selectedPrescriptionId.slice(0, 14)}...
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 bg-white/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-600">
                <strong className="text-slate-900">Clinical Safety Rule:</strong> MediFlow searches the exact medication specified by the attending clinician. The platform does not alter dosage forms, change strengths, or suggest alternative medicines.
              </p>
              {selectedItemId && (
                <p className="text-slate-400 font-mono text-[11px]">
                  Prescription Item ID: {selectedItemId} • Patient ID: {searchPatientId}
                </p>
              )}
            </div>

            {/* Quick Switch Prescription if user has multiple in session */}
            {prescriptions.length > 1 && (
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-slate-500 font-medium">Switch Prescription:</span>
                <select
                  value={selectedPrescriptionId}
                  onChange={(e) => {
                    const found = prescriptions.find((p) => p.id === e.target.value);
                    if (found && found.items.length > 0) {
                      const item = found.items[0];
                      setSelectedPrescriptionId(found.id);
                      setSelectedItemId(item.id);
                      setSearchMedicineName(item.medicineName);
                      setSearchStrength(item.strength);
                      setSearchDosageForm(item.dosageForm);
                      handleExecuteExactSearch(item.medicineName, item.strength, item.dosageForm);
                    }
                  }}
                  className="bg-white border border-slate-300 rounded text-xs p-1.5 text-slate-800 font-medium"
                >
                  {prescriptions.map((px) => (
                    <option key={px.id} value={px.id}>
                      {px.patientName} — {px.items[0]?.medicineName || 'Rx'} ({px.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Exact Medicine Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Exact Medicine Verification Card (1/4 width) */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-600 font-bold">
                Medicine Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {isSearchingMedicine ? (
                <div className="space-y-2 py-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : matchedMedicine ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Exact Match in Catalogue</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-slate-700">
                    <p className="font-bold text-slate-900">{matchedMedicine.genericName}</p>
                    {matchedMedicine.brandName && (
                      <p className="text-[11px] text-slate-500">Brand: {matchedMedicine.brandName}</p>
                    )}
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        {matchedMedicine.strength}
                      </span>
                      <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        {matchedMedicine.dosageForm}
                      </span>
                    </div>
                    {matchedMedicine.manufacturer && (
                      <p className="text-[10px] text-slate-400 pt-1 font-sans">
                        Mfr: {matchedMedicine.manufacturer}
                      </p>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono">
                    Catalogue ID: {matchedMedicine.id}
                  </p>
                </div>
              ) : medicineSearchPerformed ? (
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Prescribed Medicine Not Found</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    No exact match was returned by the medicine catalogue for &ldquo;{searchMedicineName} ({searchStrength}, {searchDosageForm})&rdquo;.
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    MediFlow does not recommend substitute medicines or alter prescribed dosages.
                  </p>
                </div>
              ) : (
                <p className="text-slate-500">Enter prescribed medicine details to verify catalogue match.</p>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExecuteExactSearch(searchMedicineName, searchStrength, searchDosageForm)}
                isLoading={isSearchingMedicine || isSearchingAvailability}
                className="w-full text-xs"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh Catalogue & Stock
              </Button>
            </CardContent>
          </Card>

          {/* Clinical Disclaimers */}
          <Card className="bg-slate-50/70 border-slate-200">
            <CardContent className="p-3 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
              <span className="font-bold text-slate-700 block">Fulfillment Guidelines:</span>
              <p>• Only pharmacies with VERIFIED credentials can accept online reservations.</p>
              <p>• Reservations hold stock for up to 2 hours before releasing.</p>
              <p>• Final dispensing requires pharmacy staff confirmation and prescription review.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Verified Pharmacy Results (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Verified Pharmacies with Your Prescribed Medicine</span>
              </h3>
              <p className="text-xs text-slate-500">
                Sorted by backend ranking: Verified status first, stock freshness, and lowest price.
              </p>
            </div>

            {availabilitySearched && (
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                {availabilityResults.length} {availabilityResults.length === 1 ? 'Pharmacy Found' : 'Pharmacies Found'}
              </span>
            )}
          </div>

          {/* Loading Skeleton */}
          {(isSearchingMedicine || isSearchingAvailability) && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-card" />
              <Skeleton className="h-32 w-full rounded-card" />
              <Skeleton className="h-32 w-full rounded-card" />
            </div>
          )}

          {/* No Exact Medicine Found State */}
          {!isSearchingMedicine && medicineSearchPerformed && !matchedMedicine && (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<AlertCircle className="w-10 h-10 text-amber-500" />}
                  title="Prescribed Medicine Not Found in Catalogue"
                  description={`No exact match was returned by the medicine catalogue for "${searchMedicineName}" (${searchStrength}, ${searchDosageForm}). In adherence to clinical safety rules, MediFlow does not suggest substitute medications.`}
                />
                <div className="mt-4 text-center">
                  <Link href="/patient/prescriptions">
                    <Button variant="outline" size="sm">
                      Return to Prescriptions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exact Medicine Found, but Zero Pharmacies have it available */}
          {!isSearchingMedicine && !isSearchingAvailability && matchedMedicine && availabilitySearched && availabilityResults.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<Building2 className="w-10 h-10 text-slate-400" />}
                  title="No Pharmacy Stock Available"
                  description={`The prescribed medicine "${matchedMedicine.genericName} (${matchedMedicine.strength}, ${matchedMedicine.dosageForm})" is currently out of stock or not listed at registered pharmacies.`}
                />
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecuteExactSearch(searchMedicineName, searchStrength, searchDosageForm)}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Check Availability Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pharmacy Results Cards List */}
          {!isSearchingMedicine && !isSearchingAvailability && matchedMedicine && availabilityResults.length > 0 && (
            <div className="space-y-4">
              {availabilityResults.map((item) => {
                const facility = item.facility;
                const isVerified = facility?.verificationStatus === 'VERIFIED';
                const canReserve = isVerified && facility?.pharmacyProfile?.reservationEnabled !== false && item.quantity > 0;

                return (
                  <Card
                    key={item.id}
                    className={`border transition-all duration-200 overflow-hidden ${
                      isVerified
                        ? 'border-slate-200 hover:border-brand-400 hover:shadow-md'
                        : 'border-slate-200 bg-slate-50/50 opacity-80'
                    }`}
                  >
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Pharmacy Info & Status */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">
                            {facility?.name || 'Registered Pharmacy'}
                          </h4>
                          {getVerificationBadge(facility?.verificationStatus)}
                          {getFreshnessBadge(item.freshness)}
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {facility?.address || 'Address pending verification'}
                          </span>
                          {facility?.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {facility.phone}
                            </span>
                          )}
                        </div>

                        {/* Medicine specific details */}
                        <div className="pt-1 flex items-center gap-4 flex-wrap text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] tracking-wider block">Stock Status</span>
                            <span
                              className={`font-bold ${
                                item.status === 'AVAILABLE'
                                  ? 'text-emerald-700'
                                  : item.status === 'LOW_STOCK'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {item.status} ({item.quantity} units available)
                            </span>
                          </div>

                          {item.price !== undefined && item.price !== null && (
                            <div>
                              <span className="text-slate-400 uppercase text-[10px] tracking-wider block">Unit Price</span>
                              <span className="font-bold font-mono text-slate-900">
                                ₦{Number(item.price).toLocaleString()}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-slate-400 uppercase text-[10px] tracking-wider block">Last Updated</span>
                            <span className="text-slate-600 font-mono text-[11px]">
                              {new Date(item.lastUpdatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-end justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <Button
                          variant={canReserve ? 'primary' : 'outline'}
                          size="md"
                          disabled={!canReserve}
                          onClick={() => setReservationCandidate(item)}
                          className="w-full sm:w-auto md:w-40 font-semibold"
                          leftIcon={<Clock className="w-4 h-4" />}
                        >
                          {canReserve ? 'Reserve Medicine' : 'Unavailable'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPharmacyDetails(item)}
                          className="w-full sm:w-auto md:w-40 text-slate-600 hover:text-slate-900 text-xs"
                        >
                          View Pharmacy Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Creating Reservation */}
      {reservationCandidate && matchedMedicine && (
        <Modal
          isOpen={Boolean(reservationCandidate)}
          onClose={() => setReservationCandidate(null)}
          title="Reserve Prescribed Medicine"
          description="Place a 2-hour hold on stock at this verified pharmacy"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-sky-50 border border-sky-200 rounded-card p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <span className="text-slate-600 font-medium">Prescribed Medicine:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {matchedMedicine.genericName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <span className="text-slate-600 font-medium">Strength & Form:</span>
                <span className="font-semibold text-slate-800">
                  {matchedMedicine.strength} • {matchedMedicine.dosageForm}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <span className="text-slate-600 font-medium">Selected Pharmacy:</span>
                <span className="font-bold text-slate-900">
                  {reservationCandidate.facility?.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <span className="text-slate-600 font-medium">Pharmacy Address:</span>
                <span className="text-slate-700">
                  {reservationCandidate.facility?.address}
                </span>
              </div>

              {reservationCandidate.price && (
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <span className="text-slate-600 font-medium">Unit Price:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₦{Number(reservationCandidate.price).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Patient Identifier:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {searchPatientId}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 space-y-1">
              <p className="font-bold">Reservation Terms:</p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                This reservation is for the exact medicine prescribed by your clinician.
                Upon submission via <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">POST /reservations</code>,
                the reservation will be created with status <strong>PENDING</strong>.
                Pharmacy staff will verify the on-hand stock and confirm the hold.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setReservationCandidate(null)}
                disabled={isReserving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmReservation}
                isLoading={isReserving}
              >
                Confirm & Request Reservation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reservation Created Result Modal */}
      {confirmedReservation && (
        <Modal
          isOpen={Boolean(confirmedReservation)}
          onClose={() => setConfirmedReservation(null)}
          title="Reservation Created"
          description="Your medicine reservation request has been submitted to the pharmacy"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-card p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Reservation Requested Successfully</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-emerald-200 text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Reservation ID:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white border border-emerald-200 px-2 py-0.5 rounded">
                    {confirmedReservation.id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Current Status:</span>
                  <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    {confirmedReservation.status} (Awaiting Pharmacy Confirmation)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Medicine:</span>
                  <span className="font-bold text-slate-900">
                    {confirmedReservation.medicine?.genericName} ({confirmedReservation.medicine?.strength}, {confirmedReservation.medicine?.dosageForm})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Pharmacy:</span>
                  <span className="font-bold text-slate-900">{confirmedReservation.facility?.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Hold Expiration:</span>
                  <span className="font-mono text-amber-800 font-bold">
                    {confirmedReservation.expiresAt ? new Date(confirmedReservation.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '2 Hours from request'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>What happens next?</strong> Pharmacy staff will review your reservation in their queue at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/pharmacy/reservations</code>. Once confirmed, you can proceed to the facility to pick up your prescription.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Link href="/pharmacy/reservations">
                <Button variant="outline" size="sm">
                  View Pharmacy Staff Queue Demo
                </Button>
              </Link>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setConfirmedReservation(null);
                  router.push('/patient/prescriptions');
                }}
              >
                Go to My Prescriptions
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pharmacy Details Modal */}
      {selectedPharmacyForDetails && (
        <Modal
          isOpen={Boolean(selectedPharmacyForDetails)}
          onClose={() => setSelectedPharmacyForDetails(null)}
          title={selectedPharmacyForDetails.facility?.name || 'Pharmacy Profile'}
          description="Verified facility details and live inventory stock"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-card border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium block">Verification Status</span>
                <div className="mt-1">
                  {getVerificationBadge(selectedPharmacyForDetails.facility?.verificationStatus)}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Address</span>
                <p className="text-slate-800 font-medium mt-1">
                  {selectedPharmacyForDetails.facility?.address || 'Address on file'}
                </p>
              </div>

              {selectedPharmacyForDetails.facility?.phone && (
                <div>
                  <span className="text-slate-400 font-medium block">Phone Contact</span>
                  <p className="text-slate-800 font-mono mt-1">
                    {selectedPharmacyForDetails.facility.phone}
                  </p>
                </div>
              )}

              {selectedPharmacyForDetails.facility?.pharmacyProfile?.licenceNumber && (
                <div>
                  <span className="text-slate-400 font-medium block">Licence Number</span>
                  <p className="text-slate-800 font-mono mt-1">
                    {selectedPharmacyForDetails.facility.pharmacyProfile.licenceNumber}
                  </p>
                </div>
              )}

              {selectedPharmacyForDetails.facility?.pharmacyProfile?.operatingHours && (
                <div>
                  <span className="text-slate-400 font-medium block">Operating Hours</span>
                  <p className="text-slate-800 mt-1">
                    {selectedPharmacyForDetails.facility.pharmacyProfile.operatingHours}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-medium block">Online Reservations</span>
                <p className="font-semibold mt-1 text-emerald-700">
                  {selectedPharmacyForDetails.facility?.pharmacyProfile?.reservationEnabled !== false ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>

            {/* Inventory listing from GET /pharmacies/:id/inventory */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Facility Stock Inventory (via GET /pharmacies/:id/inventory)
              </h5>

              {isLoadingPharmacyInventory ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : pharmacyInventoryList.length === 0 ? (
                <p className="text-slate-500 italic py-2">
                  No additional inventory records published by this pharmacy.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-card divide-y divide-slate-100">
                  {pharmacyInventoryList.map((inv) => (
                    <div key={inv.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{inv.medicine?.genericName || inv.medicineId}</span>
                        <span className="text-slate-500 text-[11px] ml-1">
                          ({inv.medicine?.strength}, {inv.medicine?.dosageForm})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800 font-mono">{inv.quantity} in stock</span>
                        <span className="text-slate-400 text-[10px] block">
                          {inv.price ? `₦${Number(inv.price).toLocaleString()}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSelectedPharmacyForDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function PatientSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl mx-auto py-8">
          <Skeleton className="h-14 w-3/4" />
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
        </div>
      }
    >
      <PatientSearchContent />
    </Suspense>
  );
}
