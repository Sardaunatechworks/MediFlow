import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MedicinesModule } from './medicines/medicines.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { InventoryModule } from './inventory/inventory.module';
import { AvailabilityModule } from './availability/availability.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ClinicalModule } from './clinical/clinical.module';

@Module({
  imports: [
    PrismaModule,
    MedicinesModule,
    PharmacyModule,
    InventoryModule,
    AvailabilityModule,
    ReservationsModule,
    ClinicalModule,
  ],
})
export class AppModule {}
