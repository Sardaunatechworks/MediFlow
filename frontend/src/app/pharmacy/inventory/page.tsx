'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';

export default function PharmacyInventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Inventory Management"
        subtitle="Maintain medicine stock counts, pricing, freshness timestamps, and availability statuses"
        breadcrumbs={[
          { label: 'MediFlow', href: '/' },
          { label: 'Pharmacy' },
          { label: 'Inventory' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Medicine Stock Control</CardTitle>
          <CardDescription>
            Lists SKUs via GET /pharmacies/:id/inventory and updates via PUT /pharmacies/:id/inventory/:medicineId.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Package className="w-8 h-8 text-emerald-600" />}
            title="Inventory Management Scaffolded"
            description="Table with SKU search, quantity counter, status toggles (AVAILABLE, LOW_STOCK, OUT_OF_STOCK), and price editor."
          />
        </CardContent>
      </Card>
    </div>
  );
}
