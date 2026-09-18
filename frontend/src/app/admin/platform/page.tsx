'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DEMO_FACILITIES } from '@/lib/constants';
import { ShieldCheck, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PlatformAdminPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Platform & Facility Verifications"
        subtitle="Super-admin ecosystem control: facility onboarding, pharmacy regulatory verification, and system security logs"
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Platform Admin' },
          { label: 'Verifications' },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Healthcare Facility Network Status</CardTitle>
              <CardDescription>
                Participating hospitals and verified community pharmacies in the MediFlow mesh.
              </CardDescription>
            </div>
            <span className="text-[11px] font-semibold text-[#006B35] bg-[#EAF7EE] px-2.5 py-0.5 rounded-full border border-[#C4D4C9]">
              {DEMO_FACILITIES.length} Registered
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="divide-y divide-[#E2E8E4]">
            {DEMO_FACILITIES.map((fac) => (
              <div key={fac.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#F4F8F5] text-[#006B35] flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#17201B]">{fac.name}</h4>
                    <p className="text-[12px] text-[#66736C]">
                      {fac.type} • {fac.address || 'Abuja, Nigeria'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006B35] bg-[#EAF7EE] px-2 py-0.5 rounded-full border border-[#C4D4C9]">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                  <Link href="/patient/search">
                    <Button variant="ghost" size="sm">
                      View Stock
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
