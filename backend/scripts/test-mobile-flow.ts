const API_URL = 'http://localhost:5000/api';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiFetch(endpoint: string, method: string, body?: any, headers: any = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`API Error ${res.status}: ${JSON.stringify(err)}`);
  }
  const json = await res.json();
  return json.data || json;
}

async function runTest() {
  console.log('--- Starting Mobile Flow E2E Test ---');
  try {
    // 0. Register Platform Admin
    console.log('0. Registering platform admin...');
    const sysRes = await apiFetch('/auth/register', 'POST', {
      email: `sysadmin_${Date.now()}@carequeue.com`,
      password: 'Password123!',
      firstName: 'System',
      lastName: 'Admin',
      role: 'PLATFORM_ADMIN'
    });
    const platformToken = sysRes.token;
    const platformHeaders = { Authorization: `Bearer ${platformToken}` };

    // 1. Create Org
    console.log('1. Creating test organization...');
    const orgRes = await apiFetch('/organizations', 'POST', {
      name: 'Mobile Test Clinic',
      domain: 'mobiletest.com',
      contactEmail: 'admin@mobiletest.com',
      type: 'CLINIC'
    }, platformHeaders);
    const orgId = orgRes._id;
    console.log(`✅ Organization created: ${orgId}`);

    // 2. Register Patient
    console.log('2. Registering patient...');
    const registerRes = await apiFetch('/auth/register', 'POST', {
      email: `patient1_${Date.now()}@mobiletest.com`,
      password: 'Password123!',
      firstName: 'Mobile',
      lastName: 'Patient',
      role: 'PATIENT',
      organizationId: orgId
    });
    const patientToken = registerRes.token;
    const patientId = registerRes._id;
    console.log(`✅ Patient registered and logged in: ${patientId}`);

    const patientHeaders = { Authorization: `Bearer ${patientToken}` };

    // Register an admin to setup data
    console.log('3. Registering org admin for setup...');
    const adminRes = await apiFetch('/auth/register', 'POST', {
      email: `admin_${Date.now()}@mobiletest.com`,
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ORG_ADMIN',
      organizationId: orgId
    });
    const adminToken = adminRes.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Setup: Location, Dept, Service, Practitioner
    console.log('4. Setting up clinic data...');
    const locRes = await apiFetch('/locations', 'POST', {
      organizationId: orgId, name: 'Main Branch', type: 'CLINIC'
    }, adminHeaders);
    const locationId = locRes._id;

    const deptRes = await apiFetch('/departments', 'POST', {
      organizationId: orgId, name: 'Cardiology', code: 'CARD', locationIds: [locationId]
    }, adminHeaders);
    const departmentId = deptRes._id;

    const srvRes = await apiFetch('/services', 'POST', {
      organizationId: orgId,
      name: 'Consultation',
      departmentId: departmentId,
      durationInMinutes: 15
    }, adminHeaders);
    const serviceId = srvRes._id;

    const practRes = await apiFetch('/practitioners', 'POST', {
      organizationId: orgId, firstName: 'Dr. Heart', lastName: 'Specialist', type: 'DOCTOR'
    }, adminHeaders);
    const practitionerId = practRes._id;

    // Link pract to dept
    await apiFetch(`/practitioners/${practitionerId}/departments`, 'POST', {
      departmentId,
      serviceIds: [serviceId]
    }, adminHeaders);

    // Link patient profile
    const patProfileRes = await apiFetch('/patients', 'POST', {
      organizationId: orgId,
      userId: patientId,
      firstName: 'Mobile',
      lastName: 'Patient',
      dateOfBirth: '1990-01-01',
      gender: 'OTHER',
      mobileNumber: '555-0000'
    }, adminHeaders);
    const patientProfileId = patProfileRes._id;

    // Create a Queue
    const qRes = await apiFetch('/queues', 'POST', {
      name: 'Cardiology Q',
      departmentId,
      locationId,
      practitionerId,
      serviceId
    }, adminHeaders);
    const queueId = qRes._id;

    console.log('✅ Clinic data setup complete.');

    // 5. Patient books appointment
    console.log('5. Patient booking appointment...');
    const apptRes = await apiFetch('/appointments', 'POST', {
      patientId: patientProfileId,
      practitionerId,
      departmentId,
      serviceId,
      locationId,
      date: new Date().toISOString(),
      source: 'ONLINE'
    }, patientHeaders);
    const appointmentId = apptRes._id;
    console.log(`✅ Appointment booked: ${appointmentId}`);

    // Confirm appointment (Admin)
    await apiFetch(`/appointments/${appointmentId}/status`, 'PATCH', {
      status: 'CONFIRMED'
    }, adminHeaders);

    // 6. Patient Check-In
    console.log('6. Patient checking in...');
    const ciRes = await apiFetch('/check-ins', 'POST', {
      patientId: patientProfileId,
      appointmentId,
      locationId
    }, patientHeaders);
    const checkInId = ciRes._id;
    console.log(`✅ Check-In completed: ${checkInId}`);

    // 7. Patient joins queue
    console.log('7. Patient joining queue...');
    const joinRes = await apiFetch('/queues/join', 'POST', {
      queueId,
      patientId: patientProfileId,
      appointmentId,
      checkInId
    }, patientHeaders);
    const queueEntryId = joinRes._id;
    const token = joinRes.tokenNumber;
    console.log(`✅ Joined Queue with Token: ${token}`);

    // 8. Patient checks position
    console.log('8. Checking queue position...');
    const posRes = await apiFetch(`/queues/entry/${queueEntryId}/position`, 'GET', undefined, patientHeaders);
    console.log(`✅ Position info:`, posRes);

    console.log('--- Test Passed ---');

  } catch (error: any) {
    console.error('❌ Test failed!');
    console.error(error.message);
  }
}

runTest();
