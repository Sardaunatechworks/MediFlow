import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  private computeFreshness(lastUpdatedAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(lastUpdatedAt).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 2) return 'CONFIRMED_AVAILABLE';
    if (diffHours <= 24) return 'RECENTLY_UPDATED';
    if (diffHours <= 72) return 'LOW_CONFIDENCE';
    return 'STALE';
  }

  async search(medicineId?: string, strength?: string, dosageForm?: string) {
    // Business Rule: NEVER suggest substitute medicine. Only exact match.
    // If medicineId is provided, search by exact medicineId
    // If no medicineId, try to find medicine by exact strength/dosageForm match, but still exact medicine
    // If nothing found, return empty array

    let targetMedicineIds: string[] = [];

    if (medicineId) {
      // Verify medicine exists
      const medicine = await this.prisma.medicine.findUnique({
        where: { id: medicineId },
      });
      if (!medicine) {
        return [];
      }

      // If strength/dosageForm also provided, verify exact match — do NOT suggest substitutes
      if (strength && medicine.strength !== strength) {
        return [];
      }
      if (dosageForm && medicine.dosageForm !== dosageForm) {
        return [];
      }

      targetMedicineIds = [medicineId];
    } else if (strength || dosageForm) {
      // No medicineId: find medicines matching exact strength/dosageForm
      const where: any = {};
      if (strength) where.strength = strength;
      if (dosageForm) where.dosageForm = dosageForm;

      const medicines = await this.prisma.medicine.findMany({ where });
      if (medicines.length === 0) return [];
      targetMedicineIds = medicines.map((m) => m.id);
    } else {
      // No filter at all — return empty (no medicine to search)
      return [];
    }

    // Find inventory entries that are AVAILABLE or LOW_STOCK for the target medicines
    const inventories = await this.prisma.pharmacyInventory.findMany({
      where: {
        medicineId: { in: targetMedicineIds },
        status: { in: ['AVAILABLE', 'LOW_STOCK'] },
      },
      include: {
        facility: {
          include: { pharmacyProfile: true },
        },
        medicine: true,
      },
    });

    // Enrich with freshness and rank
    const enriched = inventories.map((inv) => ({
      ...inv,
      freshness: this.computeFreshness(inv.lastUpdatedAt),
    }));

    // Ranking: VERIFIED > freshness (most recent first) > price (lowest first)
    enriched.sort((a, b) => {
      // 1. VERIFIED first
      const aVerified = a.facility.verificationStatus === 'VERIFIED' ? 0 : 1;
      const bVerified = b.facility.verificationStatus === 'VERIFIED' ? 0 : 1;
      if (aVerified !== bVerified) return aVerified - bVerified;

      // 2. Freshness: most recent lastUpdatedAt first
      const aTime = new Date(a.lastUpdatedAt).getTime();
      const bTime = new Date(b.lastUpdatedAt).getTime();
      if (bTime !== aTime) return bTime - aTime;

      // 3. Price lowest first (null price treated as highest)
      const aPrice = a.price ? Number(a.price) : Number.MAX_SAFE_INTEGER;
      const bPrice = b.price ? Number(b.price) : Number.MAX_SAFE_INTEGER;
      return aPrice - bPrice;
    });

    return enriched;
  }
}
