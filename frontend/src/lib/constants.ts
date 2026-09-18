import { UserRole, Facility } from '@/types/domain';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Default Seeded Facilities from Backend seed.ts
export const DEMO_FACILITIES: Facility[] = [
  {
    id: 'f1000000-0000-0000-0000-000000000001',
    name: 'National Hospital Abuja',
    type: 'HOSPITAL',
    address: 'Plot 132 Central Business District, Abuja, FCT',
    phone: '+2348039991122',
    email: 'info@nationalhospital.gov.ng',
    verificationStatus: 'VERIFIED',
    status: 'ACTIVE',
  },
  {
    id: 'f2000000-0000-0000-0000-000000000001',
    name: 'MedPlus Pharmacy Maitama',
    type: 'PHARMACY',
    address: '24 Gana Street, Maitama, Abuja',
    phone: '+2348031112233',
    email: 'maitama@medplus.ng',
    verificationStatus: 'VERIFIED',
    status: 'ACTIVE',
    pharmacyProfile: {
      id: 'p1',
      facilityId: 'f2000000-0000-0000-0000-000000000001',
      licenceNumber: 'PCN-ABJ-2024-0012',
      operatingHours: '8:00 AM - 10:00 PM',
      reservationEnabled: true,
    },
  },
  {
    id: 'f2000000-0000-0000-0000-000000000002',
    name: 'HealthPlus Pharmacy Wuse 2',
    type: 'PHARMACY',
    address: '14 Aminu Kano Crescent, Wuse 2, Abuja',
    phone: '+2348032223344',
    email: 'wuse2@healthplus.ng',
    verificationStatus: 'VERIFIED',
    status: 'ACTIVE',
    pharmacyProfile: {
      id: 'p2',
      facilityId: 'f2000000-0000-0000-0000-000000000002',
      licenceNumber: 'PCN-ABJ-2023-0841',
      operatingHours: '24 Hours',
      reservationEnabled: true,
    },
  },
];

export interface RoleOption {
  id: UserRole;
  label: string;
  badge: string;
  description: string;
  defaultPath: string;
}

export const USER_ROLES: RoleOption[] = [
  {
    id: 'PATIENT',
    label: 'Patient',
    badge: 'Care Journey',
    description: 'Track queue token, view e-prescriptions, search verified stock, and reserve medicine',
    defaultPath: '/patient/queue',
  },
  {
    id: 'TRIAGE_OFFICER',
    label: 'Triage Officer / Nurse',
    badge: 'Clinical Intake',
    description: 'Walk-in registration, vital signs entry, automated ESI urgency classification',
    defaultPath: '/triage',
  },
  {
    id: 'CLINICIAN',
    label: 'Clinician / Doctor',
    badge: 'Acuity Workspace',
    description: 'Priority-sorted live queue, clinical consultation, priority overrides, e-prescribing',
    defaultPath: '/clinician/queue',
  },
  {
    id: 'PHARMACY_STAFF',
    label: 'Pharmacy Staff',
    badge: 'Dispensing',
    description: 'Process medicine reservations, verify PIN tokens, dispense medications',
    defaultPath: '/pharmacy/reservations',
  },
  {
    id: 'PHARMACY_ADMIN',
    label: 'Pharmacy Admin',
    badge: 'Inventory Control',
    description: 'Manage medicine inventory, track stock freshness, adjust unit prices',
    defaultPath: '/pharmacy/inventory',
  },
  {
    id: 'HOSPITAL_ADMIN',
    label: 'Hospital Administrator',
    badge: 'Facility Throughput',
    description: 'Monitor waiting room metrics, triage response velocity, clinical caseloads',
    defaultPath: '/admin/hospital',
  },
  {
    id: 'PLATFORM_ADMIN',
    label: 'Platform Administrator',
    badge: 'Super Admin',
    description: 'Facility regulatory verifications, pharmacy network governance, audit logs',
    defaultPath: '/admin/platform',
  },
];
