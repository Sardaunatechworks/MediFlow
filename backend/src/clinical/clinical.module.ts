import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PatientsController } from './patients/patients.controller';
import { PatientsService } from './patients/patients.service';
import { EncountersController } from './encounters/encounters.controller';
import { EncountersService } from './encounters/encounters.service';
import { TriageController } from './triage/triage.controller';
import { TriageService } from './triage/triage.service';
import { TriageEngineService } from './triage/triage-engine.service';
import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PatientsController,
    EncountersController,
    TriageController,
    QueueController,
  ],
  providers: [
    PatientsService,
    EncountersService,
    TriageService,
    TriageEngineService,
    QueueService,
  ],
  exports: [
    PatientsService,
    EncountersService,
    TriageService,
    TriageEngineService,
    QueueService,
  ],
})
export class ClinicalModule {}
