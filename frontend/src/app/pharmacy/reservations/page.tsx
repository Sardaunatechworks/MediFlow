'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { usePrescriptions } from '@/context/PrescriptionContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reservationApi } from '@/lib/api';
import { Reservation, ReservationStatus } from '@/types/domain';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PackageCheck,
  Building2,
  RefreshCw,
  User,
  Pill,
  ShieldCheck,
  Filter,
  ArrowRight,
} from 'lucide-react';

export default function PharmacyReservationsPage() {
  const { knownReservationIds, recordReservationId, updateReservationStatus } = usePrescriptions();
  const { facility } = useAuth();
  const toast = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [isSearchingId, setIsSearchingId] = useState(false);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Updating status for a reservation
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Confirmation / Rejection Action Modal
  const [actionModal, setActionModal] = useState<{
    reservation: Reservation;
    targetStatus: ReservationStatus;
    title: string;
    description: string;
  } | null>(null);

  // Load known reservations from backend
  const loadKnownReservations = useCallback(async () => {
    setIsLoading(true);
    setBackendOffline(false);

    try {
      // 1. Fetch live reservations for the active facility
      let liveList: Reservation[] = [];
      try {
        liveList = await reservationApi.list({ facilityId: facility?.id });
      } catch (e) {
        // Ignore list query failure, fallback to ID lookup
      }

      const mapById = new Map<string, Reservation>();
      (liveList || []).forEach((r) => mapById.set(r.id, r));

      // 2. Also check any known IDs in session storage
      for (const id of knownReservationIds) {
        if (!mapById.has(id)) {
          try {
            const res = await reservationApi.getById(id);
            if (res) {
              mapById.set(res.id, res);
            }
          } catch {
            // skip if not found
          }
        }
      }

      const results = Array.from(mapById.values());

      // Sort with newest requested first
      results.sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );

      setReservations(results);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || err?.statusCode === 0) {
        setBackendOffline(true);
      }
      toast.error('Failed to Load Queue', err.message || 'Unable to connect to reservation service.');
    } finally {
      setIsLoading(false);
    }
  }, [facility?.id, knownReservationIds, toast]);

  useEffect(() => {
    loadKnownReservations();
  }, [loadKnownReservations]);

  // Lookup single reservation by ID
  const handleLookupById = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchIdInput.trim();
    if (!cleanId) return;

    setIsSearchingId(true);
    try {
      const res = await reservationApi.getById(cleanId);
      recordReservationId(res.id);
      setReservations((prev) => {
        const filtered = prev.filter((r) => r.id !== res.id);
        return [res, ...filtered];
      });
      toast.success('Reservation Retrieved', `Loaded reservation for ${res.medicine?.genericName || 'medication'}.`);
      setSearchIdInput('');
    } catch (err: any) {
      toast.error('Lookup Failed', err.message || `No reservation found with ID ${cleanId}`);
    } finally {
      setIsSearchingId(false);
    }
  };

  // Perform status transition via PATCH /reservations/:id
  const handleTransitionStatus = async (reservationId: string, nextStatus: ReservationStatus) => {
    setUpdatingId(reservationId);
    try {
      // Call PATCH /reservations/:id
      const updated = await reservationApi.updateStatus(reservationId, { status: nextStatus });

      // Update local state
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? updated : r))
      );

      // Update prescription context so patient view is updated
      updateReservationStatus(reservationId, nextStatus);

      toast.success(
        `Reservation ${nextStatus}`,
        `Reservation ${reservationId.slice(0, 8)}... has been updated to ${nextStatus}.`
      );
      setActionModal(null);
    } catch (err: any) {
      toast.error('Transition Failed', err.message || `Unable to update reservation to ${nextStatus}.`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded text-xs">
            <Clock className="w-3 h-3 text-amber-700" /> PENDING REVIEW
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded text-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> CONFIRMED HOLD
          </span>
        );
      case 'FULFILLED':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-900 border border-sky-300 font-bold px-2 py-0.5 rounded text-xs">
            <PackageCheck className="w-3 h-3 text-sky-700" /> DISPENSED / FULFILLED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 font-bold px-2 py-0.5 rounded text-xs">
            <XCircle className="w-3 h-3 text-rose-700" /> REJECTED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 font-bold px-2 py-0.5 rounded text-xs">
            <XCircle className="w-3 h-3 text-slate-600" /> CANCELLED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 border border-slate-300 font-bold px-2 py-0.5 rounded text-xs">
            <Clock className="w-3 h-3 text-slate-500" /> EXPIRED
          </span>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Pharmacy Reservations & Dispensing Queue"
        subtitle={`Managing incoming patient medicine holds for: ${facility.name}`}
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Pharmacy Staff', href: '/pharmacy/reservations' },
          { label: 'Reservations Queue' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadKnownReservations}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Queue
            </Button>
            <Link href="/patient/search">
              <Button variant="primary" size="sm">
                Patient Search Demo
              </Button>
            </Link>
          </div>
        }
      />

      {/* Backend Offline Notice */}
      {backendOffline && (
        <div className="bg-rose-50 border border-rose-200 rounded-card p-4 flex items-start gap-3 text-rose-900 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-rose-950">Demo Mode — Backend Offline</p>
            <p className="text-rose-800 leading-relaxed">
              Unable to reach the NestJS backend at <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">http://localhost:3000</code>.
              Status updates via <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">PATCH /reservations/:id</code> require the backend server to be running.
            </p>
          </div>
        </div>
      )}

      {/* Dispensing Counter Bar / ID Lookup */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleLookupById} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan or enter Reservation ID (e.g. res-1234-abcd) to pull live record..."
                value={searchIdInput}
                onChange={(e) => setSearchIdInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-control text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSearchingId}
              className="w-full sm:w-auto h-9 whitespace-nowrap text-xs"
            >
              Lookup Reservation
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Queue Filter Tabs & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-card border border-[#E2E8E4]">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[#66736C] font-semibold mr-1 flex items-center gap-1 text-[11px]">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'PENDING', 'CONFIRMED', 'FULFILLED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-0.5 rounded-control text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#006B35] text-white font-bold shadow-2xs'
                  : 'bg-[#F4F8F5] text-[#66736C] hover:bg-[#E2E8E4]'
              }`}
            >
              {st}
              {st === 'ALL' && ` (${reservations.length})`}
              {st === 'PENDING' && ` (${reservations.filter((r) => r.status === 'PENDING').length})`}
              {st === 'CONFIRMED' && ` (${reservations.filter((r) => r.status === 'CONFIRMED').length})`}
              {st === 'FULFILLED' && ` (${reservations.filter((r) => r.status === 'FULFILLED').length})`}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#66736C] font-mono">
          Showing {filteredReservations.length} items
        </div>
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<ClipboardList className="w-10 h-10 text-slate-400" />}
              title="No Reservations in Queue"
              description="No incoming patient medicine holds match the selected filter. To test the workflow, navigate to Patient Search, reserve a medication, and return here to confirm."
            />
            <div className="mt-4 text-center">
              <Link href="/patient/search">
                <Button variant="primary" size="sm">
                  Create a Test Reservation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((res) => {
            const isUpdating = updatingId === res.id;
            const isPending = res.status === 'PENDING';
            const isConfirmed = res.status === 'CONFIRMED';
            const isFulfilled = res.status === 'FULFILLED';

            return (
              <Card
                key={res.id}
                className="border border-slate-200 hover:border-slate-300 shadow-2xs transition-all overflow-hidden"
              >
                <div className="bg-slate-50/70 px-5 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      Reservation #{res.id}
                    </span>
                    {getStatusBadge(res.status)}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3 font-mono">
                    <span>
                      Requested: {new Date(res.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {res.expiresAt && (
                      <span>
                        • Hold Expires: <strong className="text-amber-800">{new Date(res.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left: Medication & Prescription details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {res.medicine?.genericName || 'Prescribed Medicine'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Strength: <span className="font-semibold text-slate-700">{res.medicine?.strength || 'Standard'}</span> • Dosage Form: <span className="font-semibold text-slate-700">{res.medicine?.dosageForm || 'Tablet'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200/80 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-slate-400 font-medium block text-[11px]">Patient Reference</span>
                        <span className="font-mono font-semibold text-slate-900">{res.patientId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[11px]">Prescription Reference</span>
                        <span className="font-mono text-slate-700 text-[11px] truncate block">{res.prescriptionId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[11px]">Pharmacy Facility</span>
                        <span className="font-medium text-slate-900">{res.facility?.name || facility.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[11px]">Medicine ID</span>
                        <span className="font-mono text-slate-500 text-[11px]">{res.medicineId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pharmacy Staff Workflow Actions */}
                  <div className="shrink-0 flex flex-col items-end justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    {/* Action buttons strictly adhering to VALID_TRANSITIONS */}
                    {isPending && (
                      <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto">
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isUpdating}
                          onClick={() =>
                            setActionModal({
                              reservation: res,
                              targetStatus: 'CONFIRMED',
                              title: 'Confirm Medicine Reservation',
                              description: `Verify physical inventory on hand for ${res.medicine?.genericName} and confirm hold for patient ${res.patientId}.`,
                            })
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 w-full sm:w-36 font-semibold"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Confirm Hold
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={isUpdating}
                          onClick={() =>
                            setActionModal({
                              reservation: res,
                              targetStatus: 'REJECTED',
                              title: 'Reject Reservation',
                              description: `Decline reservation request for ${res.medicine?.genericName} if stock is damaged or depleted.`,
                            })
                          }
                          className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs h-8 w-full sm:w-36"
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {isConfirmed && (
                      <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto">
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isUpdating}
                          onClick={() =>
                            setActionModal({
                              reservation: res,
                              targetStatus: 'FULFILLED',
                              title: 'Dispense Medication & Fulfill',
                              description: `Confirm patient collection of ${res.medicine?.genericName}. Note: Backend will automatically deduct stock from pharmacy inventory.`,
                            })
                          }
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs h-8 w-full sm:w-40 font-semibold"
                          leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
                        >
                          Dispense & Fulfill
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={isUpdating}
                          onClick={() =>
                            setActionModal({
                              reservation: res,
                              targetStatus: 'EXPIRED',
                              title: 'Mark Reservation Expired',
                              description: `Release hold if patient did not collect medication within the designated window.`,
                            })
                          }
                          className="text-slate-600 text-xs h-8 w-full sm:w-40"
                        >
                          Mark Expired
                        </Button>
                      </div>
                    )}

                    {isFulfilled && (
                      <div className="text-right py-2">
                        <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dispensed to Patient
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          Stock deducted on backend
                        </span>
                      </div>
                    )}

                    {!isPending && !isConfirmed && !isFulfilled && (
                      <span className="text-xs text-slate-500 italic py-2">
                        Terminal Status: {res.status}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal && (
        <Modal
          isOpen={Boolean(actionModal)}
          onClose={() => setActionModal(null)}
          title={actionModal.title}
          description="Backend Transition via PATCH /reservations/:id"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed">{actionModal.description}</p>

            <div className="bg-slate-50 p-3 rounded-card border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Reservation ID:</span>
                <span className="font-mono font-bold text-slate-800">{actionModal.reservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medicine:</span>
                <span className="font-bold text-slate-900">{actionModal.reservation.medicine?.genericName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Status:</span>
                <span className="font-bold text-brand-700">{actionModal.targetStatus}</span>
              </div>
            </div>

            {actionModal.targetStatus === 'FULFILLED' && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded text-brand-900 text-[11px] leading-relaxed">
                <strong>Inventory Automation:</strong> Transitioning this reservation to <code>FULFILLED</code> triggers backend stock deduction in <code>PharmacyInventory</code>.
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setActionModal(null)}
                disabled={Boolean(updatingId)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleTransitionStatus(actionModal.reservation.id, actionModal.targetStatus)}
                isLoading={updatingId === actionModal.reservation.id}
              >
                Confirm Transition to {actionModal.targetStatus}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
