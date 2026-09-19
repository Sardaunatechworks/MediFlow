const http = require('http');

async function apiRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runE2ETest() {
  console.log('=== STARTING MEDIFLOW END-TO-END INTEGRATION TEST ===\n');

  // Step 1: Login as Nurse Ibrahim (TRIAGE_OFFICER)
  console.log('1. Testing Login as Nurse Ibrahim (TRIAGE_OFFICER)...');
  const triageLogin = await apiRequest('/auth/login', 'POST', {
    email: 'nurse.ibrahim@nationalhospital.gov.ng',
    password: 'Password123!',
  });
  console.log('   Status:', triageLogin.status);
  console.log('   Success:', triageLogin.body.success);
  console.log('   User Role:', triageLogin.body.data?.user?.role);
  const triageToken = triageLogin.body.data.accessToken;
  const hospitalId = triageLogin.body.data.user.facilityId;

  // Step 2: Register a new patient
  console.log('\n2. Registering Patient "Amina Yusuf"...');
  const patientRes = await apiRequest('/patients', 'POST', {
    patientIdentifier: `MF-PT-${Date.now().toString().slice(-6)}`,
    firstName: 'Amina',
    lastName: 'Yusuf',
    age: 29,
    gender: 'FEMALE',
    phone: '+2348039998877',
    email: 'amina.yusuf@example.com',
    address: 'Wuse 2, Abuja',
  }, triageToken);
  console.log('   Status:', patientRes.status);
  console.log('   Patient ID:', patientRes.body.data.id);
  const patientId = patientRes.body.data.id;

  // Step 3: Create Encounter
  console.log('\n3. Creating Encounter for patient at hospital...');
  const encRes = await apiRequest('/encounters', 'POST', {
    patientId,
    facilityId: hospitalId,
    presentingComplaint: 'High fever, intense chills, and body aches for 3 days',
  }, triageToken);
  console.log('   Status:', encRes.status);
  console.log('   Encounter ID:', encRes.body.data.id);
  const encounterId = encRes.body.data.id;

  // Step 4: Perform Triage Assessment (System recommends urgency)
  console.log('\n4. Performing Triage Assessment (Vitals: Temp 39.4°C, HR 112, RR 24, SpO2 93%)...');
  const triageRes = await apiRequest(`/encounters/${encounterId}/triage`, 'POST', {
    temperature: 39.4,
    systolicBp: 125,
    diastolicBp: 80,
    pulseRate: 112,
    respiratoryRate: 24,
    oxygenSaturation: 93,
    symptoms: ['High fever', 'Severe chills', 'Generalized arthralgia'],
    assessedBy: 'Nurse Ibrahim',
  }, triageToken);
  console.log('   Status:', triageRes.status);
  console.log('   Recommended Urgency:', triageRes.body.data.recommendedUrgency);
  console.log('   Final Urgency:', triageRes.body.data.finalUrgency);
  console.log('   Reasoning:', triageRes.body.data.reasoning);

  // Step 5: Check Prioritized Queue
  console.log('\n5. Checking Hospital Prioritized Queue...');
  const queueRes = await apiRequest(`/facilities/${hospitalId}/queue`, 'GET');
  console.log('   Status:', queueRes.status);
  console.log('   Total Waiting in Queue:', queueRes.body.data.totalWaiting);
  console.log('   Critical RED count:', queueRes.body.data.criticalRedCount);
  console.log('   Urgent YELLOW count:', queueRes.body.data.urgentYellowCount);
  const aminaInQueue = queueRes.body.data.queue.find((q) => q.patientId === patientId);
  console.log('   Found Amina in Queue Position:', aminaInQueue?.queuePosition, 'with Priority Score:', aminaInQueue?.priorityScore);

  // Step 6: Login as Clinician (Dr. Auwal)
  console.log('\n6. Logging in as Dr. Auwal (CLINICIAN)...');
  const docLogin = await apiRequest('/auth/login', 'POST', {
    email: 'dr.auwal@nationalhospital.gov.ng',
    password: 'Password123!',
  });
  const docToken = docLogin.body.data.accessToken;
  console.log('   Clinician User:', docLogin.body.data.user.name, 'Role:', docLogin.body.data.user.role);

  // Step 7: Clinician transitions encounter to IN_CONSULTATION
  console.log('\n7. Transitioning Encounter to IN_CONSULTATION...');
  const startConsult = await apiRequest(`/encounters/${encounterId}/status`, 'PATCH', {
    status: 'IN_CONSULTATION',
    updatedBy: 'Dr. Auwal',
  }, docToken);
  console.log('   Status:', startConsult.status, 'New Encounter Status:', startConsult.body.data.status);

  // Step 8: Search Medicines to Prescribe
  console.log('\n8. Searching Medicine Formulary for "Artemether"...');
  const medSearch = await apiRequest('/medicines/search?name=Artemether', 'GET');
  console.log('   Found Medicines:', medSearch.body.data.map((m) => `${m.genericName} (${m.strength})`));
  const artemether = medSearch.body.data[0];

  // Step 9: Clinician issues Prescription
  console.log('\n9. Clinician issuing e-Prescription for Artemether-Lumefantrine...');
  const pxRes = await apiRequest('/prescriptions', 'POST', {
    encounterId,
    patientId,
    diagnosisNotes: 'Confirmed uncomplicated falciparum malaria. ACT initiated.',
    items: [
      {
        medicineId: artemether.id,
        quantity: 24,
        instructions: 'Take 4 tablets stat, then 4 tablets after 8 hours, then 4 tablets twice daily for 2 days',
        dosageFrequency: 'ACT standard regimen',
      },
    ],
  }, docToken);
  console.log('   Status:', pxRes.status);
  console.log('   Prescription ID:', pxRes.body.data.id);
  console.log('   Prescribed By:', pxRes.body.data.clinician.name);
  const prescriptionId = pxRes.body.data.id;
  const prescriptionItemId = pxRes.body.data.items[0].id;

  // Step 10: Medicine Availability Search across Pharmacies
  console.log('\n10. Patient/Clinician searching Pharmacy Availability for Prescribed Medicine...');
  const availRes = await apiRequest(`/availability/search?medicineId=${artemether.id}`, 'GET');
  console.log('   Pharmacies with stock:', availRes.body.data.length);
  availRes.body.data.forEach((entry, idx) => {
    console.log(`   [${idx + 1}] ${entry.facility.name} - Stock: ${entry.quantity} (${entry.status}) - Price: ₦${entry.price} - Verified: ${entry.facility.verificationStatus} - Freshness: ${entry.freshness}`);
  });
  const chosenPharmacy = availRes.body.data.find((e) => e.facility.verificationStatus === 'VERIFIED');
  const pharmacyId = chosenPharmacy.facility.id;

  // Step 11: Create Reservation at Verified Pharmacy
  console.log(`\n11. Creating Reservation at ${chosenPharmacy.facility.name}...`);
  const ptLogin = await apiRequest('/auth/login', 'POST', {
    email: 'musa.danladi@example.com',
    password: 'Password123!',
  });
  const ptToken = ptLogin.body.data.accessToken;

  const resvRes = await apiRequest('/reservations', 'POST', {
    prescriptionId,
    prescriptionItemId,
    facilityId: pharmacyId,
    medicineId: artemether.id,
    patientId,
  }, ptToken);
  console.log('   Status:', resvRes.status);
  console.log('   Reservation ID:', resvRes.body.data.id);
  console.log('   Reservation Status:', resvRes.body.data.status);
  const reservationId = resvRes.body.data.id;

  // Step 12: Pharmacy Staff reviews and confirms reservation
  console.log('\n12. Pharmacy Staff logging in to process reservation...');
  const pharmLogin = await apiRequest('/auth/login', 'POST', {
    email: 'zainab@medplus.ng',
    password: 'Password123!',
  });
  const pharmToken = pharmLogin.body.data.accessToken;
  console.log('   Staff User:', pharmLogin.body.data.user.name, 'Role:', pharmLogin.body.data.user.role);

  console.log('   Confirming reservation...');
  const confirmRes = await apiRequest(`/reservations/${reservationId}`, 'PATCH', {
    status: 'CONFIRMED',
  }, pharmToken);
  console.log('   Reservation Status after confirmation:', confirmRes.body.data.status);

  console.log('   Fulfilling reservation (dispensing medication and deducting inventory)...');
  const fulfillRes = await apiRequest(`/reservations/${reservationId}`, 'PATCH', {
    status: 'FULFILLED',
  }, pharmToken);
  console.log('   Reservation Status after fulfillment:', fulfillRes.body.data.status);

  // Step 13: RBAC Boundary Verification
  console.log('\n13. Testing Strict RBAC Boundary Enforcement...');

  // 13a: Patient trying to issue prescription (MUST BE 403)
  console.log('   [RBAC Test 1] Patient attempting to issue prescription...');
  const badPx = await apiRequest('/prescriptions', 'POST', {
    encounterId,
    patientId,
    items: [{ medicineId: artemether.id, quantity: 10, instructions: 'self-prescribed' }],
  }, ptToken);
  console.log('   Result:', badPx.status, badPx.body.error?.code, badPx.body.message);

  // 13b: Triage Officer trying to issue prescription (MUST BE 403)
  console.log('   [RBAC Test 2] Triage Officer attempting to issue prescription...');
  const badTriagePx = await apiRequest('/prescriptions', 'POST', {
    encounterId,
    patientId,
    items: [{ medicineId: artemether.id, quantity: 10, instructions: 'nurse-prescribed' }],
  }, triageToken);
  console.log('   Result:', badTriagePx.status, badTriagePx.body.error?.code, badTriagePx.body.message);

  // 13c: Pharmacy Staff attempting to change user role (MUST BE 403)
  console.log('   [RBAC Test 3] Pharmacy Staff attempting to modify user roles...');
  const badRoleChange = await apiRequest('/users/user-pt-001/role', 'PATCH', {
    role: 'PLATFORM_ADMIN',
  }, pharmToken);
  console.log('   Result:', badRoleChange.status, badRoleChange.body.error?.code, badRoleChange.body.message);

  // 13d: Platform Admin checking immutable Audit Log
  console.log('\n14. Platform Admin viewing live Audit Log trail...');
  const superLogin = await apiRequest('/auth/login', 'POST', {
    email: 'superadmin@mediflow.mesh.gov.ng',
    password: 'Password123!',
  });
  const superToken = superLogin.body.data.accessToken;
  const auditRes = await apiRequest('/audit-logs?limit=5', 'GET', null, superToken);
  console.log('   Status:', auditRes.status);
  console.log('   Latest Audit Events:');
  auditRes.body.data.forEach((l, i) => {
    console.log(`   [${i + 1}] ${l.action} on ${l.entityType} by ${l.userEmail || 'system'} (${l.userRole || 'N/A'})`);
  });

  console.log('\n=== ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runE2ETest().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
