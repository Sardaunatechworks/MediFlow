import { PrismaClient, FacilityType, FacilityStatus, VerificationStatus, MedicineStatus, InventoryStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MediFlow database...');

  // Clean existing data
  await prisma.clinicalOverride.deleteMany();
  await prisma.triageAssessment.deleteMany();
  await prisma.queueEvent.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.pharmacyInventory.deleteMany();
  await prisma.pharmacyProfile.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.facility.deleteMany();

  // 15 medicines — common Nigerian pharmacy medicines
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

  const medicines = [];
  for (const med of medicinesData) {
    const created = await prisma.medicine.create({ data: med });
    medicines.push(created);
  }
  console.log(`Created ${medicines.length} medicines`);

  // 5 pharmacies with mixed verification statuses
  const pharmaciesData = [
    {
      name: 'MedPlus Pharmacy Ikeja',
      address: '15 Allen Avenue, Ikeja, Lagos',
      phone: '+2348012345678',
      email: 'ikeja@medplus.com.ng',
      verificationStatus: VerificationStatus.VERIFIED,
      status: FacilityStatus.ACTIVE,
      profile: {
        licenceNumber: 'PCN/LAG/2024/001',
        operatingHours: '08:00 - 22:00',
        reservationEnabled: true,
      },
    },
    {
      name: 'HealthPlus Pharmacy Victoria Island',
      address: '10 Akin Adesola Street, Victoria Island, Lagos',
      phone: '+2348098765432',
      email: 'vi@healthplus.com.ng',
      verificationStatus: VerificationStatus.VERIFIED,
      status: FacilityStatus.ACTIVE,
      profile: {
        licenceNumber: 'PCN/LAG/2024/002',
        operatingHours: '07:00 - 23:00',
        reservationEnabled: true,
      },
    },
    {
      name: 'Alpha Pharmacy Yaba',
      address: '45 Herbert Macaulay Way, Yaba, Lagos',
      phone: '+2348055551234',
      email: 'yaba@alphapharmacy.com.ng',
      verificationStatus: VerificationStatus.VERIFIED,
      status: FacilityStatus.ACTIVE,
      profile: {
        licenceNumber: 'PCN/LAG/2024/003',
        operatingHours: '08:00 - 21:00',
        reservationEnabled: true,
      },
    },
    {
      name: 'Naza Pharmacy Wuse',
      address: '12 Aminu Kano Crescent, Wuse 2, Abuja',
      phone: '+2348033334567',
      email: 'wuse@nazapharmacy.com.ng',
      verificationStatus: VerificationStatus.UNVERIFIED,
      status: FacilityStatus.PENDING_VERIFICATION,
      profile: {
        licenceNumber: 'PCN/ABJ/2024/004',
        operatingHours: '09:00 - 20:00',
        reservationEnabled: true,
      },
    },
    {
      name: 'Dana Pharmacy Bodija',
      address: '8 Bodija Road, Ibadan, Oyo State',
      phone: '+2348077778901',
      email: 'bodija@danapharmacy.com.ng',
      verificationStatus: VerificationStatus.UNVERIFIED,
      status: FacilityStatus.PENDING_VERIFICATION,
      profile: {
        licenceNumber: 'PCN/OYO/2024/005',
        operatingHours: '08:30 - 20:30',
        reservationEnabled: false,
      },
    },
  ];

  const facilities = [];
  for (const ph of pharmaciesData) {
    const { profile, ...facilityData } = ph;
    const facility = await prisma.facility.create({
      data: {
        ...facilityData,
        type: FacilityType.PHARMACY,
        pharmacyProfile: {
          create: profile,
        },
      },
      include: { pharmacyProfile: true },
    });
    facilities.push(facility);
  }
  console.log(`Created ${facilities.length} pharmacies`);

  // Inventory records linking pharmacies to medicines with varied statuses
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  const inventoryEntries: Array<{
    facilityIndex: number;
    medicineIndex: number;
    quantity: number;
    status: InventoryStatus;
    price: number;
    lastUpdatedAt: Date;
  }> = [
    // MedPlus Ikeja — well stocked, recent updates
    { facilityIndex: 0, medicineIndex: 0, quantity: 150, status: InventoryStatus.AVAILABLE, price: 500, lastUpdatedAt: hoursAgo(1) },
    { facilityIndex: 0, medicineIndex: 1, quantity: 80, status: InventoryStatus.AVAILABLE, price: 1200, lastUpdatedAt: hoursAgo(0.5) },
    { facilityIndex: 0, medicineIndex: 2, quantity: 5, status: InventoryStatus.LOW_STOCK, price: 800, lastUpdatedAt: hoursAgo(3) },
    { facilityIndex: 0, medicineIndex: 4, quantity: 60, status: InventoryStatus.AVAILABLE, price: 2500, lastUpdatedAt: hoursAgo(2) },
    { facilityIndex: 0, medicineIndex: 8, quantity: 90, status: InventoryStatus.AVAILABLE, price: 700, lastUpdatedAt: hoursAgo(5) },
    { facilityIndex: 0, medicineIndex: 9, quantity: 0, status: InventoryStatus.OUT_OF_STOCK, price: 1800, lastUpdatedAt: hoursAgo(10) },
    { facilityIndex: 0, medicineIndex: 12, quantity: 40, status: InventoryStatus.AVAILABLE, price: 600, lastUpdatedAt: hoursAgo(1) },

    // HealthPlus VI — high verification, mixed freshness
    { facilityIndex: 1, medicineIndex: 0, quantity: 200, status: InventoryStatus.AVAILABLE, price: 450, lastUpdatedAt: hoursAgo(0.2) },
    { facilityIndex: 1, medicineIndex: 2, quantity: 30, status: InventoryStatus.AVAILABLE, price: 750, lastUpdatedAt: hoursAgo(20) },
    { facilityIndex: 1, medicineIndex: 3, quantity: 15, status: InventoryStatus.AVAILABLE, price: 1500, lastUpdatedAt: hoursAgo(1) },
    { facilityIndex: 1, medicineIndex: 4, quantity: 3, status: InventoryStatus.LOW_STOCK, price: 2700, lastUpdatedAt: hoursAgo(50) },
    { facilityIndex: 1, medicineIndex: 5, quantity: 70, status: InventoryStatus.AVAILABLE, price: 1100, lastUpdatedAt: hoursAgo(4) },
    { facilityIndex: 1, medicineIndex: 6, quantity: 45, status: InventoryStatus.AVAILABLE, price: 900, lastUpdatedAt: hoursAgo(30) },
    { facilityIndex: 1, medicineIndex: 10, quantity: 25, status: InventoryStatus.AVAILABLE, price: 1400, lastUpdatedAt: hoursAgo(80) },

    // Alpha Yaba — verified, some stale records
    { facilityIndex: 2, medicineIndex: 0, quantity: 10, status: InventoryStatus.LOW_STOCK, price: 550, lastUpdatedAt: hoursAgo(60) },
    { facilityIndex: 2, medicineIndex: 1, quantity: 100, status: InventoryStatus.AVAILABLE, price: 1150, lastUpdatedAt: hoursAgo(2) },
    { facilityIndex: 2, medicineIndex: 3, quantity: 50, status: InventoryStatus.AVAILABLE, price: 1450, lastUpdatedAt: hoursAgo(15) },
    { facilityIndex: 2, medicineIndex: 7, quantity: 60, status: InventoryStatus.AVAILABLE, price: 600, lastUpdatedAt: hoursAgo(1) },
    { facilityIndex: 2, medicineIndex: 8, quantity: 0, status: InventoryStatus.OUT_OF_STOCK, price: 750, lastUpdatedAt: hoursAgo(100) },
    { facilityIndex: 2, medicineIndex: 11, quantity: 35, status: InventoryStatus.AVAILABLE, price: 400, lastUpdatedAt: hoursAgo(6) },
    { facilityIndex: 2, medicineIndex: 13, quantity: 20, status: InventoryStatus.AVAILABLE, price: 500, lastUpdatedAt: hoursAgo(25) },
    { facilityIndex: 2, medicineIndex: 14, quantity: 0, status: InventoryStatus.OUT_OF_STOCK, price: 300, lastUpdatedAt: hoursAgo(200) },

    // Naza Wuse — unverified
    { facilityIndex: 3, medicineIndex: 0, quantity: 80, status: InventoryStatus.AVAILABLE, price: 480, lastUpdatedAt: hoursAgo(3) },
    { facilityIndex: 3, medicineIndex: 2, quantity: 0, status: InventoryStatus.OUT_OF_STOCK, price: 850, lastUpdatedAt: hoursAgo(5) },
    { facilityIndex: 3, medicineIndex: 4, quantity: 40, status: InventoryStatus.AVAILABLE, price: 2400, lastUpdatedAt: hoursAgo(1) },
    { facilityIndex: 3, medicineIndex: 6, quantity: 8, status: InventoryStatus.LOW_STOCK, price: 950, lastUpdatedAt: hoursAgo(40) },
    { facilityIndex: 3, medicineIndex: 7, quantity: 55, status: InventoryStatus.AVAILABLE, price: 580, lastUpdatedAt: hoursAgo(12) },
    { facilityIndex: 3, medicineIndex: 9, quantity: 30, status: InventoryStatus.AVAILABLE, price: 1700, lastUpdatedAt: hoursAgo(8) },
    { facilityIndex: 3, medicineIndex: 12, quantity: 15, status: InventoryStatus.LOW_STOCK, price: 650, lastUpdatedAt: hoursAgo(70) },

    // Dana Bodija — unverified, reservation disabled
    { facilityIndex: 4, medicineIndex: 1, quantity: 20, status: InventoryStatus.LOW_STOCK, price: 1300, lastUpdatedAt: hoursAgo(18) },
    { facilityIndex: 4, medicineIndex: 3, quantity: 0, status: InventoryStatus.OUT_OF_STOCK, price: 1600, lastUpdatedAt: hoursAgo(90) },
    { facilityIndex: 4, medicineIndex: 5, quantity: 90, status: InventoryStatus.AVAILABLE, price: 1050, lastUpdatedAt: hoursAgo(2) },
    { facilityIndex: 4, medicineIndex: 8, quantity: 110, status: InventoryStatus.AVAILABLE, price: 680, lastUpdatedAt: hoursAgo(24) },
    { facilityIndex: 4, medicineIndex: 10, quantity: 18, status: InventoryStatus.AVAILABLE, price: 1350, lastUpdatedAt: hoursAgo(45) },
    { facilityIndex: 4, medicineIndex: 11, quantity: 50, status: InventoryStatus.AVAILABLE, price: 380, lastUpdatedAt: hoursAgo(0.8) },
    { facilityIndex: 4, medicineIndex: 14, quantity: 25, status: InventoryStatus.AVAILABLE, price: 280, lastUpdatedAt: hoursAgo(6) },
  ];

  for (const entry of inventoryEntries) {
    await prisma.pharmacyInventory.create({
      data: {
        facilityId: facilities[entry.facilityIndex].id,
        medicineId: medicines[entry.medicineIndex].id,
        quantity: entry.quantity,
        status: entry.status,
        price: entry.price,
        lastUpdatedAt: entry.lastUpdatedAt,
      },
    });
  }
  console.log(`Created ${inventoryEntries.length} inventory records`);

  // Seed Hospital Facility
  const hospital = await prisma.facility.create({
    data: {
      name: 'National Hospital Abuja',
      type: FacilityType.HOSPITAL,
      address: 'Plot 132 Central Business District, Abuja, FCT',
      phone: '+2348039991122',
      email: 'info@nationalhospital.gov.ng',
      verificationStatus: VerificationStatus.VERIFIED,
      status: FacilityStatus.ACTIVE,
    },
  });
  console.log(`Created hospital facility: ${hospital.name} (${hospital.id})`);

  // Seed 3 Demo Patients for Clinical Workflow & Queue demonstration:
  // Patient 1 (Stable - GREEN, arrived 75 mins ago)
  const patientGreen = await prisma.patient.create({
    data: {
      patientIdentifier: 'MF-PT-100001',
      firstName: 'Fatima',
      lastName: 'Bello',
      age: 28,
      gender: 'FEMALE',
      phone: '+2348011223344',
      email: 'fatima.bello@example.com',
      address: 'Garki 2, Abuja',
    },
  });

  const encGreen = await prisma.encounter.create({
    data: {
      patientId: patientGreen.id,
      facilityId: hospital.id,
      presentingComplaint: 'Mild tension headache and nasal congestion',
      status: 'WAITING',
      priority: 'GREEN',
      priorityScore: 100,
      startedAt: new Date(now.getTime() - 75 * 60 * 1000),
    },
  });

  await prisma.triageAssessment.create({
    data: {
      encounterId: encGreen.id,
      assessedBy: 'Nurse Amina',
      temperature: 36.8,
      systolicBp: 118,
      diastolicBp: 78,
      pulseRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      recommendedUrgency: 'GREEN',
      finalUrgency: 'GREEN',
      reasoning: ['All measured vital signs are within normal clinical thresholds with no critical red flags'],
      isCriticalAlert: false,
    },
  });

  // Patient 2 (Urgent - YELLOW, arrived 35 mins ago)
  const patientYellow = await prisma.patient.create({
    data: {
      patientIdentifier: 'MF-PT-100002',
      firstName: 'Emeka',
      lastName: 'Okonkwo',
      age: 36,
      gender: 'MALE',
      phone: '+2348055667788',
      email: 'emeka.okonkwo@example.com',
      address: 'Wuse Zone 4, Abuja',
    },
  });

  const encYellow = await prisma.encounter.create({
    data: {
      patientId: patientYellow.id,
      facilityId: hospital.id,
      presentingComplaint: 'High fever, rigors, and moderate abdominal cramps',
      status: 'WAITING',
      priority: 'YELLOW',
      priorityScore: 10000,
      startedAt: new Date(now.getTime() - 35 * 60 * 1000),
    },
  });

  await prisma.triageAssessment.create({
    data: {
      encounterId: encYellow.id,
      assessedBy: 'Nurse Amina',
      temperature: 39.2,
      systolicBp: 132,
      diastolicBp: 86,
      pulseRate: 108,
      respiratoryRate: 22,
      oxygenSaturation: 94,
      recommendedUrgency: 'YELLOW',
      finalUrgency: 'YELLOW',
      reasoning: [
        'SpO2 is 94% (moderate hypoxemia 90-94%)',
        'Respiratory rate is 22/min (tachypnea 21-30)',
        'Pulse rate is 108 bpm (tachycardia 101-130 bpm)',
        'Temperature is 39.2°C (high fever >= 38.5°C)',
      ],
      isCriticalAlert: false,
    },
  });

  // Patient 3 (Critical - RED, arrived 8 mins ago)
  const patientRed = await prisma.patient.create({
    data: {
      patientIdentifier: 'MF-PT-100003',
      firstName: 'Musa',
      lastName: 'Danladi',
      age: 62,
      gender: 'MALE',
      phone: '+2348099887766',
      email: 'musa.danladi@example.com',
      address: 'Maitama, Abuja',
    },
  });

  const encRed = await prisma.encounter.create({
    data: {
      patientId: patientRed.id,
      facilityId: hospital.id,
      presentingComplaint: 'Crushing retrosternal chest pain and severe dyspnea',
      status: 'ESCALATED',
      priority: 'RED',
      priorityScore: 1000000,
      startedAt: new Date(now.getTime() - 8 * 60 * 1000),
    },
  });

  await prisma.triageAssessment.create({
    data: {
      encounterId: encRed.id,
      assessedBy: 'Nurse Amina',
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
      recommendedUrgency: 'RED',
      finalUrgency: 'RED',
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
    },
  });

  console.log('Created 3 demo clinical patients, encounters, and triages (Red, Yellow, Green)');
  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
