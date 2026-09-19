'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { facilityApi, auditApi } from '@/lib/api';
import { Facility, AuditLog } from '@/types/domain';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  User,
  RotateCw,
} from 'lucide-react';

export default function PlatformAdminPage() {
  const toast = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingFacilityId, setUpdatingFacilityId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [facList, logs] = await Promise.all([
        facilityApi.list().catch(() => []),
        auditApi.list({ limit: 20 }).catch(() => []),
      ]);
      setFacilities(facList || []);
      setAuditLogs(logs || []);
    } catch (err: any) {
      toast.error('Data Load Warning', 'Could not sync real-time platform data.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerification = async (facilityId: string, status: 'VERIFIED' | 'REJECTED') => {
    setUpdatingFacilityId(facilityId);
    try {
      const updated = await facilityApi.updateVerification(facilityId, status);
      setFacilities((prev) => prev.map((f) => (f.id === facilityId ? { ...f, ...updated } : f)));
      toast.success(
        'Facility Status Updated',
        `Facility verification is now marked as ${status}.`
      );
      // Refresh audit logs to show new audit record
      const freshLogs = await auditApi.list({ limit: 20 }).catch(() => []);
      setAuditLogs(freshLogs);
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update verification status.');
    } finally {
      setUpdatingFacilityId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Platform Governance & Ecosystem Control"
          subtitle="Super-admin network governance: facility regulatory verification, security audits, and access management"
          breadcrumbs={[
            { label: 'MediFlow', href: '/' },
            { label: 'Platform Admin' },
            { label: 'Governance' },
          ]}
        />
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="gap-2">
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Grid: Facilities & Regulatory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Healthcare Facility Network Status</CardTitle>
                  <CardDescription>
                    Participating hospitals and community pharmacies in the MediFlow national network.
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {facilities.length} Total Facilities
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : facilities.length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">No facilities registered.</p>
              ) : (
                <div className="divide-y divide-[#E2E8E4]">
                  {facilities.map((fac) => {
                    const isVerified = fac.verificationStatus === 'VERIFIED';
                    const isPending = fac.verificationStatus === 'UNVERIFIED';
                    const isRejected = fac.verificationStatus === 'REJECTED';

                    return (
                      <div key={fac.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center font-bold shrink-0 ${
                            fac.type === 'HOSPITAL' ? 'bg-[#EBF3FC] text-[#0066CC]' : 'bg-[#EAF7EE] text-[#006B35]'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-bold text-[#17201B]">{fac.name}</h4>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isVerified
                                  ? 'bg-[#EAF7EE] text-[#006B35] border-[#C4D4C9]'
                                  : isPending
                                  ? 'bg-[#FEF6E6] text-[#B26A00] border-[#FCE1B5]'
                                  : 'bg-[#FDE8E8] text-[#C81E1E] border-[#F8B4B4]'
                              }`}>
                                {fac.verificationStatus}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#66736C] mt-0.5">
                              {fac.type} • {fac.address || 'Abuja, Nigeria'}
                              {fac.pharmacyProfile?.licenceNumber && (
                                <span className="ml-2 text-xs font-mono text-[#4A5750]">
                                  Licence: {fac.pharmacyProfile.licenceNumber}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {isVerified ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                              disabled={updatingFacilityId === fac.id}
                              onClick={() => handleVerification(fac.id, 'REJECTED')}
                            >
                              Revoke Verification
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs gap-1.5"
                              disabled={updatingFacilityId === fac.id}
                              onClick={() => handleVerification(fac.id, 'VERIFIED')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify Facility
                            </Button>
                          )}
                          <Link href="/patient/search">
                            <Button variant="ghost" size="sm" className="text-xs">
                              View Stock
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Stream */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#006B35]" />
                  Live System Audit Trail
                </CardTitle>
                <span className="text-xs text-text-secondary">Immutable Logs</span>
              </div>
              <CardDescription>
                Real-time security events, clinical overrides, and role actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-text-secondary py-4 text-center">No audit logs recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-card bg-[#F9FBFA] border border-[#E2E8E4] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-primary font-mono text-[11px]">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[#333E37] text-[11px]">
                        Entity: <span className="font-medium">{log.entityType}</span>
                        {log.userRole && (
                          <span className="ml-2 text-[#0066CC] font-medium">({log.userRole})</span>
                        )}
                      </p>
                      {log.userEmail && (
                        <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                          By: {log.userEmail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
