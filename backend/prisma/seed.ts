import {
  PrismaClient,
  FacilityType,
  FacilityStatus,
  VerificationStatus,
  MedicineStatus,
  InventoryStatus,
  UserRole,
  EncounterStatus,
  UrgencyLevel,
  Gender,
  PrescriptionStatus,
  PrescriptionItemStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minsAgo(mins: number): Date {
  return new Date(Date.now() - mins * 60 * 1000);
}

async function main() {
  console.log('Seeding MediFlow database with unified clinical, pharmacy, user, and audit records...');

  // 1. Clean existing data in reverse order of foreign key dependency
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.clinicalOverride.deleteMany();
  await prisma.triageAssessment.deleteMany();
  await prisma.queueEvent.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.pharmacyInventory.deleteMany();
  await prisma.pharmacyProfile.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();

  console.log('Cleaned old records');

  // 2. Seed Facilities with deterministic IDs (matching frontend constants)
  const hospitalId = 'f1000000-0000-0000-0000-000000000001';
  const pharmacy1Id = 'f2000000-0000-0000-0000-000000000001';
  const pharmacy2Id = 'f2000000-0000-0000-0000-000000000002';
  const pharmacy3Id = 'f2000000-0000-0000-0000-000000000003';
  const pharmacy4Id = 'f2000000-0000-0000-0000-000000000004';

  const hospital = await prisma.facility.create({
    data: {
      id: hospitalId,
      name: 'National Hospital Abuja',
      type: FacilityType.HOSPITAL,
      address: 'Plot 132 Central Business District, Abuja, FCT',
      phone: '+2348039991122',
      email: 'info@nationalhospital.gov.ng',
      verificationStatus: VerificationStatus.VERIFIED,
      status: FacilityStatus.ACTIVE,
    },
  });

  const pharmacy1 = await prisma.facility.create({
    data: {
      id: pharmacy1Id,
      name: 'MedPlus Pharmacy Maitama',
      type: FacilityType.PHARMACY,
      address: '24 Gana Street, Maitama, Abuja',
      phone: '+2348031112233',
      email: 'maitama@medplus.ng',
      verificationStatus: VerificationStatus.VERIFIED,
      status: FacilityStatus.ACTIVE,
      pharmacyProfile: {
        create: {
          licenceNumber: 'PCN-ABJ-2024-0012',
          operatingHours: '8:00 AM - 10:00 PM',
          reservationEnabled: true,
        },
      },
    },
  });

  const pharmacy2 = await prisma.facility.create({
    data: {
      id: pharmacy2Id,
      name: 'HealthPlus Pharmacy Wuse 2',
      type: FacilityType.PHARMACY,
      address: '14 Aminu Kano Crescent, Wuse 2, Abuja',
      phone: '+2348032223344',
      email: 'wuse2@healthplus.ng',
      verificationStatus: VerificationStatus.VERIFIED,
      status: FacilityStatus.ACTIVE,
      pharmacyProfile: {
        create: {
          licenceNumber: 'PCN-ABJ-2023-0841',
          operatingHours: '24 Hours',
          reservationEnabled: true,
        },
      },
    },
  });

  const pharmacy3 = await prisma.facility.create({
    data: {
      id: pharmacy3Id,
      name: 'Naza Pharmacy Garki',
      type: FacilityType.PHARMACY,
      address: '8 Lafia Close, Area 2, Garki, Abuja',
      phone: '+2348033334455',
      email: 'garki@nazapharm.ng',
      verificationStatus: VerificationStatus.UNVERIFIED,
      status: FacilityStatus.PENDING_VERIFICATION,
      pharmacyProfile: {
        create: {
          licenceNumber: 'PCN-ABJ-2024-0991',
          operatingHours: '08:00 - 20:00',
          reservationEnabled: true,
        },
      },
    },
  });

  const pharmacy4 = await prisma.facility.create({
    data: {
      id: pharmacy4Id,
      name: 'Dana Community Pharmacy Asokoro',
      type: FacilityType.PHARMACY,
      address: '3 Yakubu Gowon Crescent, Asokoro, Abuja',
      phone: '+2348034445566',
      email: 'asokoro@danapharm.ng',
      verificationStatus: VerificationStatus.REJECTED,
      status: FacilityStatus.SUSPENDED,
      pharmacyProfile: {
        create: {
          licenceNumber: 'PCN-ABJ-2021-0044',
          operatingHours: '09:00 - 18:00',
          reservationEnabled: false,
        },
      },
    },
  });

  console.log('Created 5 facilities (1 Hospital, 4 Pharmacies)');

  // 3. Seed Demo Users for all 7 roles with hashed password 'Password123!'
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const usersData = [
    {
      id: 'user-triage-001',
      email: 'nurse.ibrahim@nationalhospital.gov.ng',
      name: 'Nurse Ibrahim',
      password: defaultPasswordHash,
      role: UserRole.TRIAGE_OFFICER,
      title: 'Lead Triage Nurse',
      facilityId: hospitalId,
      phone: '+2348031234501',
    },
    {
      id: 'user-doc-001',
      email: 'dr.auwal@nationalhospital.gov.ng',
      name: 'Dr. Auwal',
      password: defaultPasswordHash,
      role: UserRole.CLINICIAN,
      title: 'Consultant Physician',
      facilityId: hospitalId,
      phone: '+2348031234502',
    },
    {
      id: 'user-pt-001',
      email: 'musa.danladi@example.com',
      name: 'Musa Danladi',
      password: defaultPasswordHash,
      role: UserRole.PATIENT,
      title: 'Verified Patient',
      facilityId: hospitalId,
      phone: '+2348099887766',
    },
    {
      id: 'user-pharm-001',
      email: 'zainab@medplus.ng',
      name: 'Pharm. Zainab',
      password: defaultPasswordHash,
      role: UserRole.PHARMACY_STAFF,
      title: 'Dispensing Pharmacist',
      facilityId: pharmacy1Id,
      phone: '+2348031234504',
    },
    {
      id: 'user-pharm-admin-001',
      email: 'okon@medplus.ng',
      name: 'Pharm. Director Okon',
      password: defaultPasswordHash,
      role: UserRole.PHARMACY_ADMIN,
      title: 'Superintendent Pharmacist',
      facilityId: pharmacy1Id,
      phone: '+2348031234505',
    },
    {
      id: 'user-hosp-admin-001',
      email: 'admin.bello@nationalhospital.gov.ng',
      name: 'Director Bello',
      password: defaultPasswordHash,
      role: UserRole.HOSPITAL_ADMIN,
      title: 'Chief Medical Director',
      facilityId: hospitalId,
      phone: '+2348031234506',
    },
    {
      id: 'user-plat-admin-001',
      email: 'superadmin@mediflow.mesh.gov.ng',
      name: 'Super Admin Danladi',
      password: defaultPasswordHash,
      role: UserRole.PLATFORM_ADMIN,
      title: 'Ecosystem Super Admin',
      facilityId: null,
      phone: '+2348031234507',
    },
  ];

  for (const u of usersData) {
    await prisma.user.create({ data: u });
  }
  console.log(`Created ${usersData.length} users covering all 7 system roles`);

  // 4. Seed Essential Medicines (Nigerian Formulary / Standard Catalog)
  const medicinesData = [
    {
      genericName: 'Paracetamol',
      brandName: 'Panadol',
      strength: '500mg',
      dosageForm: 'Tablet',
      packageSize: '10 tablets',
      manufacturer: 'GSK',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      strength: '500mg',
      dosageForm: 'Capsule',
      packageSize: '20 capsules',
      manufacturer: 'Emzor Pharmaceuticals',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Metformin',
      brandName: 'Glucophage',
      strength: '500mg',
      dosageForm: 'Tablet',
      packageSize: '30 tablets',
      manufacturer: 'Merck',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Lisinopril',
      brandName: 'Zestril',
      strength: '10mg',
      dosageForm: 'Tablet',
      packageSize: '28 tablets',
      manufacturer: 'AstraZeneca',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Artemether-Lumefantrine',
      brandName: 'Coartem',
      strength: '20mg/120mg',
      dosageForm: 'Tablet',
      packageSize: '24 tablets',
      manufacturer: 'Novartis',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Ciprofloxacin',
      brandName: 'Cipro',
      strength: '500mg',
      dosageForm: 'Tablet',
      packageSize: '10 tablets',
      manufacturer: 'Fidson Healthcare',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Omeprazole',
      brandName: 'Losec',
      strength: '20mg',
      dosageForm: 'Capsule',
      packageSize: '14 capsules',
      manufacturer: 'AstraZeneca',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Amlodipine',
      brandName: 'Norvasc',
      strength: '5mg',
      dosageForm: 'Tablet',
      packageSize: '30 tablets',
      manufacturer: 'Pfizer',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Ibuprofen',
      brandName: 'Brufen',
      strength: '400mg',
      dosageForm: 'Tablet',
      packageSize: '20 tablets',
      manufacturer: 'Abbott',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Azithromycin',
      brandName: 'Zithromax',
      strength: '250mg',
      dosageForm: 'Tablet',
      packageSize: '6 tablets',
      manufacturer: 'Pfizer',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Losartan',
      brandName: 'Cozaar',
      strength: '50mg',
      dosageForm: 'Tablet',
      packageSize: '28 tablets',
      manufacturer: 'MSD',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Cetirizine',
      brandName: 'Zyrtec',
      strength: '10mg',
      dosageForm: 'Tablet',
      packageSize: '10 tablets',
      manufacturer: 'UCB Pharma',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Diclofenac Sodium',
      brandName: 'Voltaren',
      strength: '50mg',
      dosageForm: 'Tablet',
      packageSize: '20 tablets',
      manufacturer: 'Novartis',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Hydrochlorothiazide',
      brandName: 'Esidrex',
      strength: '25mg',
      dosageForm: 'Tablet',
      packageSize: '30 tablets',
      manufacturer: 'May & Baker',
      status: MedicineStatus.ACTIVE,
    },
    {
      genericName: 'Chloroquine Phosphate',
      brandName: 'Nivaquine',
      strength: '250mg',
      dosageForm: 'Tablet',
      packageSize: '10 tablets',
      manufacturer: 'Sanofi',
      status: MedicineStatus.ACTIVE,
    },
  ];

  const seededMeds = [];
  for (const m of medicinesData) {
    const created = await prisma.medicine.create({ data: m });
    seededMeds.push(created);
  }
  console.log(`Created ${seededMeds.length} medicines`);

  // 5. Seed Inventory across pharmacies
  // MedPlus Maitama inventory
  const medPlusInv = [
    { medicineId: seededMeds[0].id, quantity: 150, status: InventoryStatus.AVAILABLE, price: 500, lastUpdatedAt: hoursAgo(1) },
    { medicineId: seededMeds[1].id, quantity: 45, status: InventoryStatus.AVAILABLE, price: 1200, lastUpdatedAt: hoursAgo(0.5) },
    { medicineId: seededMeds[4].id, quantity: 80, status: InventoryStatus.AVAILABLE, price: 2200, lastUpdatedAt: hoursAgo(1.5) },
    { medicineId: seededMeds[7].id, quantity: 60, status: InventoryStatus.AVAILABLE, price: 600, lastUpdatedAt: hoursAgo(2) },
    { medicineId: seededMeds[8].id, quantity: 10, status: InventoryStatus.LOW_STOCK, price: 400, lastUpdatedAt: hoursAgo(12) },
  ];

  for (const item of medPlusInv) {
    await prisma.pharmacyInventory.create({
      data: {
        facilityId: pharmacy1Id,
        medicineId: item.medicineId,
        quantity: item.quantity,
        status: item.status,
        price: item.price,
        lastUpdatedAt: item.lastUpdatedAt,
      },
    });
  }

  // HealthPlus Wuse 2 inventory
  const healthPlusInv = [
    { medicineId: seededMeds[0].id, quantity: 100, status: InventoryStatus.AVAILABLE, price: 550, lastUpdatedAt: hoursAgo(2) },
    { medicineId: seededMeds[1].id, quantity: 8, status: InventoryStatus.LOW_STOCK, price: 1250, lastUpdatedAt: hoursAgo(4) },
    { medicineId: seededMeds[4].id, quantity: 40, status: InventoryStatus.AVAILABLE, price: 2300, lastUpdatedAt: hoursAgo(0.8) },
    { medicineId: seededMeds[7].id, quantity: 90, status: InventoryStatus.AVAILABLE, price: 580, lastUpdatedAt: hoursAgo(3) },
    { medicineId: seededMeds[6].id, quantity: 30, status: InventoryStatus.AVAILABLE, price: 1500, lastUpdatedAt: hoursAgo(5) },
  ];

  for (const item of healthPlusInv) {
    await prisma.pharmacyInventory.create({
      data: {
        facilityId: pharmacy2Id,
        medicineId: item.medicineId,
        quantity: item.quantity,
        status: item.status,
        price: item.price,
        lastUpdatedAt: item.lastUpdatedAt,
      },
    });
  }

  console.log('Created pharmacy inventories');

  // 6. Seed Clinical Patients, Encounters, and Triage Assessments (RED, YELLOW, GREEN)
  // Patient 1: Musa Danladi (RED)
  const patientRed = await prisma.patient.create({
    data: {
      patientIdentifier: 'MF-PT-100003',
      firstName: 'Musa',
      lastName: 'Danladi',
      age: 62,
      gender: Gender.MALE,
      phone: '+2348099887766',
      email: 'musa.danladi@example.com',
      address: 'Maitama, Abuja',
    },
  });

  const encounterRed = await prisma.encounter.create({
    data: {
      patientId: patientRed.id,
      facilityId: hospitalId,
      presentingComplaint: 'Crushing retrosternal chest pain and severe dyspnea',
      status: EncounterStatus.ESCALATED,
      priority: UrgencyLevel.RED,
      priorityScore: 1000000,
      startedAt: minsAgo(8),
    },
  });

  await prisma.triageAssessment.create({
    data: {
      encounterId: encounterRed.id,
      assessedBy: 'Nurse Ibrahim',
      temperature: 37.1,
      systolicBp: 84,
      diastolicBp: 52,
      pulseRate: 138,
      respiratoryRate: 34,
      oxygenSaturation: 86,
      redFlags: {
        severeRespiratoryDistress: true,
        severeChestPain: true,
        shockSigns: true,
      },
      recommendedUrgency: UrgencyLevel.RED,
      finalUrgency: UrgencyLevel.RED,
      reasoning: [
        'Critical red-flag detected: Severe Respiratory Distress',
        'Critical red-flag detected: Severe Chest Pain',
        'Critical red-flag detected: Shock Signs',
        'SpO2 is 86% (severe hypoxemia < 90%)',
        'Respiratory rate is 34/min (severe tachypnea > 30)',
        'Pulse rate is 138 bpm (severe tachycardia > 130 bpm)',
        'Systolic BP is 84 mmHg (severe hypotension / shock < 90 mmHg)',
      ],
      isCriticalAlert: true,
      assessedAt: minsAgo(7),
    },
  });

  // Patient 2: Emeka Okonkwo (YELLOW)
  const patientYellow = await prisma.patient.create({
    data: {
      patientIdentifier: 'MF-PT-100002',
      firstName: 'Emeka',
      lastName: 'Okonkwo',
      age: 36,
      gender: Gender.MALE,
      phone: '+2348055667788',
      email: 'emeka.okonkwo@example.com',
      address: 'Wuse Zone 4, Abuja',
    },
  });

  const encounterYellow = await prisma.encounter.create({
    data: {
      patientId: patientYellow.id,
      facilityId: hospitalId,
      presentingComplaint: 'High fever, rigors, and moderate abdominal cramps',
      status: EncounterStatus.WAITING,
      priority: UrgencyLevel.YELLOW,
      priorityScore: 10000,
      startedAt: minsAgo(35),
    },
  });

  await prisma.triageAssessment.create({
    data: {
      encounterId: encounterYellow.id,
      assessedBy: 'Nurse Ibrahim',
      temperature: 39.2,
      systolicBp: 132,
      diastolicBp: 86,
      pulseRate: 108,
      respiratoryRate: 22,
      oxygenSaturation: 94,
      recommendedUrgency: UrgencyLevel.YELLOW,
      finalUrgency: UrgencyLevel.YELLOW,
      reasoning: [
        'SpO2 is 94% (moderate hypoxemia 90-94%)',
        'Respiratory rate is 22/min (tachypnea 21-30)',
        'Pulse rate is 108 bpm (tachycardia 101-130 bpm)',
        'Temperature is 39.2°C (high fever >= 38.5°C)',
      ],
      isCriticalAlert: false,
      assessedAt: minsAgo(33),
    },
  });

  // Patient 3: Fatima Bello (GREEN)
  const patientGreen = await prisma.patient.create({
    data: {
      patientIdentifier: 'MF-PT-100001',
      firstName: 'Fatima',
      lastName: 'Bello',
      age: 28,
      gender: Gender.FEMALE,
      phone: '+2348011223344',
      email: 'fatima.bello@example.com',
      address: 'Garki 2, Abuja',
    },
  });

  const encounterGreen = await prisma.encounter.create({
    data: {
      patientId: patientGreen.id,
      facilityId: hospitalId,
      presentingComplaint: 'Mild tension headache and nasal congestion',
      status: EncounterStatus.WAITING,
      priority: UrgencyLevel.GREEN,
      priorityScore: 100,
      startedAt: minsAgo(75),
    },
  });

  await prisma.triageAssessment.create({
    data: {
      encounterId: encounterGreen.id,
      assessedBy: 'Nurse Ibrahim',
      temperature: 36.8,
      systolicBp: 118,
      diastolicBp: 78,
      pulseRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      recommendedUrgency: UrgencyLevel.GREEN,
      finalUrgency: UrgencyLevel.GREEN,
      reasoning: ['All measured vital signs are within normal clinical thresholds with no critical red flags'],
      isCriticalAlert: false,
      assessedAt: minsAgo(70),
    },
  });

  console.log('Created 3 demo clinical patients and triage assessments');

  // 7. Seed Clinical Prescriptions issued by Dr. Auwal
  const prescriptionRed = await prisma.prescription.create({
    data: {
      encounterId: encounterRed.id,
      patientId: patientRed.id,
      clinicianId: 'user-doc-001',
      diagnosisNotes: 'Suspected acute coronary episode / severe hypertensive crisis. Emergency stabilization commenced.',
      status: PrescriptionStatus.ISSUED,
      issuedAt: minsAgo(5),
      items: {
        create: [
          {
            medicineId: seededMeds[7].id, // Amlodipine 5mg
            quantity: 30,
            instructions: 'Take 1 tablet daily every morning',
            dosageFrequency: 'Once daily',
            status: PrescriptionItemStatus.PENDING,
          },
        ],
      },
    },
    include: { items: true },
  });

  const prescriptionYellow = await prisma.prescription.create({
    data: {
      encounterId: encounterYellow.id,
      patientId: patientYellow.id,
      clinicianId: 'user-doc-001',
      diagnosisNotes: 'Acute uncomplicated malaria with febrile syndrome.',
      status: PrescriptionStatus.ISSUED,
      issuedAt: minsAgo(15),
      items: {
        create: [
          {
            medicineId: seededMeds[4].id, // Artemether-Lumefantrine
            quantity: 24,
            instructions: 'Take 4 tablets stat, 4 tablets after 8 hours, then 4 tablets twice daily for 2 days',
            dosageFrequency: 'As directed',
            status: PrescriptionItemStatus.PENDING,
          },
          {
            medicineId: seededMeds[0].id, // Paracetamol
            quantity: 20,
            instructions: 'Take 2 tablets every 6 hours for fever/pain',
            dosageFrequency: 'QDS as needed',
            status: PrescriptionItemStatus.PENDING,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log('Created clinical prescriptions issued by clinician');

  // 8. Seed Initial Reservation (Patient Yellow reserved Artemether-Lumefantrine at MedPlus Maitama)
  const reservationYellow = await prisma.reservation.create({
    data: {
      prescriptionId: prescriptionYellow.id,
      prescriptionItemId: prescriptionYellow.items[0].id,
      facilityId: pharmacy1Id,
      medicineId: seededMeds[4].id,
      patientId: patientYellow.id,
      status: 'PENDING',
      requestedAt: minsAgo(10),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  console.log('Created initial pending reservation');

  // 9. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: 'user-triage-001',
        userEmail: 'nurse.ibrahim@nationalhospital.gov.ng',
        userRole: UserRole.TRIAGE_OFFICER,
        action: 'PATIENT_REGISTERED',
        entityType: 'Patient',
        entityId: patientRed.id,
        facilityId: hospitalId,
        details: { patientIdentifier: patientRed.patientIdentifier, name: 'Musa Danladi' },
      },
      {
        userId: 'user-triage-001',
        userEmail: 'nurse.ibrahim@nationalhospital.gov.ng',
        userRole: UserRole.TRIAGE_OFFICER,
        action: 'TRIAGE_CLASSIFIED',
        entityType: 'TriageAssessment',
        entityId: encounterRed.id,
        facilityId: hospitalId,
        details: { recommendedUrgency: 'RED', priorityScore: 1000000, isCritical: true },
      },
      {
        userId: 'user-doc-001',
        userEmail: 'dr.auwal@nationalhospital.gov.ng',
        userRole: UserRole.CLINICIAN,
        action: 'PRESCRIPTION_CREATED',
        entityType: 'Prescription',
        entityId: prescriptionYellow.id,
        facilityId: hospitalId,
        details: { patientId: patientYellow.id, itemsCount: 2 },
      },
      {
        userId: 'user-pt-001',
        userEmail: 'musa.danladi@example.com',
        userRole: UserRole.PATIENT,
        action: 'RESERVATION_CREATED',
        entityType: 'Reservation',
        entityId: reservationYellow.id,
        facilityId: pharmacy1Id,
        details: { medicineName: 'Artemether-Lumefantrine', pharmacyName: 'MedPlus Pharmacy Maitama' },
      },
      {
        userId: 'user-plat-admin-001',
        userEmail: 'superadmin@mediflow.mesh.gov.ng',
        userRole: UserRole.PLATFORM_ADMIN,
        action: 'FACILITY_VERIFIED',
        entityType: 'Facility',
        entityId: pharmacy1Id,
        details: { status: 'VERIFIED', name: 'MedPlus Pharmacy Maitama' },
      },
    ],
  });

  console.log('Created initial audit log trail');
  console.log('MediFlow Database seeding completed successfully! ✨');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
