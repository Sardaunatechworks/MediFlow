'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Building2,
  Users,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  BarChart2,
} from 'lucide-react';

export default function HospitalAdminPage() {
  const { facility } = useAuth();

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Hospital Operations & Throughput"
        subtitle="Executive administrative overview: patient waiting volume, triage response time, and clinical urgency distribution"
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Hospital Admin' },
          { label: 'Operations' },
        ]}
        actions={
          <Link href="/clinician/queue">
            <Button size="sm" variant="primary" leftIcon={<Activity className="w-3.5 h-3.5" />}>
              Live Queue Monitor
            </Button>
          </Link>
        }
      />

      {/* Facility Operational Header Card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#EAF7EE] text-[#006B35] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-[#17201B]">{facility.name}</h3>
                {facility.verificationStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006B35] bg-[#EAF7EE] px-2 py-0.5 rounded-full border border-[#C4D4C9]">
                    <ShieldCheck className="w-3 h-3" /> Verified Facility
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#66736C]">{facility.address || 'Abuja, FCT'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/triage">
              <Button variant="outline" size="sm">
                Triage Desk
              </Button>
            </Link>
            <Link href="/clinician/queue">
              <Button variant="outline" size="sm">
                Clinician Queue
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Administrative Overview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Column: Operations & Live Queues (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Flow & Queue Management</CardTitle>
              <CardDescription>
                Direct entry points for monitoring patient flow across intake, triage, and consultation desks.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="p-3 rounded-[8px] border border-[#E2E8E4] flex items-center justify-between hover:border-[#006B35] transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#006B35] flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#17201B]">Triage Desk & Arrival Intake</h4>
                    <p className="text-[12px] text-[#66736C]">Clinical triage assessment, vitals capture, and red-flag screening</p>
                  </div>
                </div>
                <Link href="/triage">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open
                  </Button>
                </Link>
              </div>

              <div className="p-3 rounded-[8px] border border-[#E2E8E4] flex items-center justify-between hover:border-[#006B35] transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FEFCE8] text-[#B45309] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#17201B]">Clinician Prioritized Queue</h4>
                    <p className="text-[12px] text-[#66736C]">Live acuity-sorted waiting room queue for attending doctors</p>
                  </div>
                </div>
                <Link href="/clinician/queue">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open
                  </Button>
                </Link>
              </div>

              <div className="p-3 rounded-[8px] border border-[#E2E8E4] flex items-center justify-between hover:border-[#006B35] transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EBF1ED] text-[#006B35] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#17201B]">Pharmacy Dispensing Queue</h4>
                    <p className="text-[12px] text-[#66736C]">Prescription reservation fulfillment and real-time inventory management</p>
                  </div>
                </div>
                <Link href="/pharmacy/reservations">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Historical Throughput Metrics Scaffold (1/3 width) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Throughput Analytics</CardTitle>
              <CardDescription>Aggregate facility throughput statistics</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-[#66736C]">
              <div className="p-3 bg-[#F4F8F5] rounded-[8px] border border-[#E2E8E4] space-y-1.5">
                <div className="flex items-center gap-2 text-[#006B35] font-semibold text-[13px]">
                  <BarChart2 className="w-4 h-4" />
                  <span>Telemetry & BI Scaffold</span>
                </div>
                <p className="text-[12px] leading-relaxed text-[#66736C]">
                  Longitudinal reporting metrics (average triage wait duration, urgency ratios, consultation velocity) will aggregate from database queue events once the telemetry module is deployed.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center py-1 border-b border-[#E2E8E4]">
                  <span className="text-[#66736C]">Active Encounters</span>
                  <span className="font-mono font-semibold text-[#17201B]">Live Monitored</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E2E8E4]">
                  <span className="text-[#66736C]">Triage Response</span>
                  <span className="font-mono font-semibold text-[#17201B]">Under 5 mins target</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#66736C]">Facility Mesh</span>
                  <span className="font-semibold text-[#006B35]">Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
