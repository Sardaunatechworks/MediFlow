// ==========================================
// MediFlow Core Domain Types & Enums
// (Exact match with backend Prisma schema)
// ==========================================

export type UrgencyLevel = 'RED' | 'YELLOW' | 'GREEN';

export type EncounterStatus =
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'ESCALATED'
  | 'COMPLETED'
  | 'CANCELLED';

export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'PHARMACY';

export type FacilityStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export type MedicineStatus = 'ACTIVE' | 'INACTIVE';

export type InventoryStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'FULFILLED'
  | 'CANCELLED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type UserRole =
  | 'PATIENT'
  | 'TRIAGE_OFFICER'
  | 'CLINICIAN'
  | 'HOSPITAL_ADMIN'
  | 'PHARMACY_ADMIN'
  | 'PHARMACY_STAFF'
  | 'PLATFORM_ADMIN';

export interface Patient {
  id: string;
  patientIdentifier: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  age?: number | null;
  gender: Gender;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  phone?: string | null;
  email?: string | null;
  verificationStatus: VerificationStatus;
  status: FacilityStatus;
  pharmacyProfile?: PharmacyProfile | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PharmacyProfile {
  id: string;
  facilityId: string;
  licenceNumber?: string | null;
  operatingHours?: string | null;
  reservationEnabled: boolean;
}

export interface Encounter {
  id: string;
  patientId: string;
  facilityId: string;
  status: EncounterStatus;
  priority?: UrgencyLevel | null;
  priorityScore: number;
  presentingComplaint: string;
  startedAt: string;
  endedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  patient?: Patient;
  facility?: Facility;
  triageAssessments?: TriageAssessment[];
}

export interface TriageAssessment {
  id: string;
  encounterId: string;
  assessedBy?: string | null;
  temperature: number;
  systolicBp: number;
  diastolicBp: number;
  pulseRate: number;
  respiratoryRate: number;
  oxygenSaturation?: number | null;
  redFlags?: Record<string, boolean> | null;
  symptoms?: string[] | null;
  recommendedUrgency: UrgencyLevel;
  reasoning?: string[] | null;
  finalUrgency: UrgencyLevel;
  isCriticalAlert: boolean;
  assessedAt: string;
  overrides?: ClinicalOverride[];
}

export interface ClinicalOverride {
  id: string;
  triageAssessmentId: string;
  overriddenBy: string;
  previousUrgency: UrgencyLevel;
  newUrgency: UrgencyLevel;
  overrideReason: string;
  overriddenAt: string;
}

export interface EnrichedQueueItem {
  queuePosition: number;
  encounterId: string;
  patientId: string;
  patientIdentifier: string;
  patientName: string;
  age: number | null;
  gender: string;
  presentingComplaint: string;
  status: EncounterStatus;
  urgency: UrgencyLevel | null;
  priorityScore: number;
  waitingTimeMinutes: number;
  startedAt: string | Date;
  isCriticalAlert: boolean;
  latestVitals: {
    temperature: number;
    bloodPressure: string;
    pulseRate: number;
    respiratoryRate: number;
    oxygenSaturation: number | null;
  } | null;
  triageReasoning: string[];
  escalationReason: string | null;
}

export interface Medicine {
  id: string;
  genericName: string;
  brandName?: string | null;
  strength: string;
  dosageForm: string;
  packageSize?: string | null;
  manufacturer?: string | null;
  status: MedicineStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PharmacyInventory {
  id: string;
  facilityId: string;
  medicineId: string;
  quantity: number;
  status: InventoryStatus;
  price?: number | string | null;
  lastUpdatedAt: string;
  updatedBy?: string | null;
  facility?: Facility;
  medicine?: Medicine;
  freshness?: 'CONFIRMED_AVAILABLE' | 'RECENTLY_UPDATED' | 'LOW_CONFIDENCE' | 'STALE';
}

export interface Reservation {
  id: string;
  prescriptionId: string;
  prescriptionItemId: string;
  facilityId: string;
  medicineId: string;
  patientId: string;
  status: ReservationStatus;
  requestedAt: string;
  expiresAt?: string | null;
  updatedAt?: string;
  facility?: Facility;
  medicine?: Medicine;
}

// -------------------------------------------------------------
// Explicit Prescription MVP Bridge Interface
// (Isolates client prescription state until backend adds module)
// -------------------------------------------------------------
export interface ClientPrescriptionItem {
  id: string; // Temporary MVP UUID
  medicineId: string;
  medicineName: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  instructions: string;
  dosageFrequency?: string;
  reservationId?: string;
  reservationStatus?: ReservationStatus;
  reservedFacilityId?: string;
  reservedFacilityName?: string;
  reservedAt?: string;
}

export interface ClientPrescription {
  id: string; // Temporary MVP UUID
  encounterId: string;
  patientId: string;
  patientName: string;
  clinicianName: string;
  issuedAt: string;
  diagnosisNotes?: string;
  items: ClientPrescriptionItem[];
  status: 'ISSUED' | 'DISPENSED' | 'CANCELLED';
}
