// ==========================================
// MediFlow API Request & Response Contracts
// (Exact match with backend NestJS DTOs)
// ==========================================

import {
  Gender,
  EncounterStatus,
  UrgencyLevel,
  ReservationStatus,
  Patient,
  Encounter,
  TriageAssessment,
  EnrichedQueueItem,
  Medicine,
  PharmacyInventory,
  Reservation,
} from './domain';

// Standard Backend Response Envelope
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  meta: any | null;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details: any[];
  };
}

// Request DTOs
export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  patientIdentifier?: string;
}

export interface CreateEncounterDto {
  patientId: string;
  facilityId: string;
  presentingComplaint: string;
  status?: EncounterStatus;
  priority?: UrgencyLevel;
}

export interface UpdateEncounterStatusDto {
  status: EncounterStatus;
  reason?: string;
  updatedBy?: string;
}

export interface CreateTriageDto {
  temperature: number;
  systolicBp: number;
  diastolicBp: number;
  pulseRate: number;
  respiratoryRate: number;
  oxygenSaturation?: number;
  redFlags?: Record<string, boolean>;
  symptoms?: string[];
  assessedBy?: string;
}

export interface OverrideTriageDto {
  newUrgency: UrgencyLevel;
  overrideReason: string;
  overriddenBy: string;
}

export interface SearchMedicineDto {
  name?: string;
  strength?: string;
  dosageForm?: string;
}

export interface UpdateInventoryDto {
  quantity: number;
  price?: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface CreateReservationDto {
  prescriptionId: string;
  prescriptionItemId: string;
  facilityId: string;
  medicineId: string;
  patientId: string;
  expiresAt?: string;
}

export interface UpdateReservationDto {
  status: ReservationStatus;
}

// Queue Response Envelope Data
export interface FacilityQueueResponse {
  facilityId: string;
  totalWaiting: number;
  criticalRedCount: number;
  urgentYellowCount: number;
  stableGreenCount: number;
  inConsultationCount: number;
  queue: EnrichedQueueItem[];
}

// Triage Evaluation & Assessment Result
export interface TriageEvaluationResult {
  recommendedUrgency: UrgencyLevel;
  reasoning: string[];
  isCriticalAlert: boolean;
  priorityScore: number;
  safetyDisclaimer: string;
}

export interface TriageAssessResponse {
  assessment: TriageAssessment;
  evaluation: TriageEvaluationResult;
}

// Availability Search Result (Enriched Inventory)
export type AvailabilityResult = PharmacyInventory;
