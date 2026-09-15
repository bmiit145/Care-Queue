# Care-Queue — Phase 1 Backend Architecture

## 1. Purpose

Care-Queue is a multi-tenant SaaS platform for outpatient appointment and real-time patient queue management. Phase 1 is designed to support three operating scales using one universal architecture:

- Large hospitals with multiple locations, departments, specialists, services, and staff.
- Mid-sized clinics with one or more departments and one or more practitioners.
- Small private practices with a single department, service, and practitioner.

The backend target stack is **Node.js + Express + MongoDB**.

The architecture must scale by configuration and data volume rather than by creating separate models for hospital, clinic, and private practice.

---

## 2. Core Product Principle

> Care-Queue does not only book patients. It manages patient flow from booking through check-in, queue management, consultation, and completion.

The core operational lifecycle is:

```text
Organization
    ↓
Locations / Departments / Services / Practitioners
    ↓
Practitioner Schedules
    ↓
Appointment
    ↓
Check-in
    ↓
Queue Entry / Token
    ↓
Consultation
    ↓
Completed
    ↓
Operational Analytics
```

Appointment booking and queue management are related but must remain separate concepts. A scheduled appointment is not automatically a queue position.

---

## 3. Universal Organization Model

Every healthcare customer is represented as an `Organization` (tenant).

```text
CARE-QUEUE
└── Organization
    ├── Settings
    ├── Locations / Branches
    ├── Departments
    │   └── Services
    ├── Practitioners
    │   ├── Specializations
    │   ├── Departments
    │   ├── Services
    │   └── Schedules
    ├── Users / Staff Memberships
    ├── Patients
    ├── Appointments
    ├── Check-ins
    ├── Queues
    └── Notifications
```

### Organization types

Use organization type for onboarding, reporting, pricing, and feature configuration—not as the fundamental database hierarchy.

Suggested values:

- `HOSPITAL`
- `CLINIC`
- `PRIVATE_PRACTICE`
- `DIAGNOSTIC_CENTER` (future-ready)
- `HEALTHCARE_CENTER` (future-ready)

Do not make `SMALL`, `MEDIUM`, or `LARGE` the primary organization type. Size should be derived from configuration and usage.

---

## 4. Organization Scale Examples

### Large Hospital

```text
ABC Multispeciality Hospital
├── Main Campus
├── City Branch
└── Emergency Center

Departments
├── Cardiology
│   ├── Services
│   └── Multiple Practitioners
├── Neurology
├── Orthopedics
├── Pediatrics
└── General Medicine
```

### Mid-sized Clinic

```text
Shree Health Clinic
└── Main Location
    ├── General Medicine
    │   ├── Services
    │   └── Multiple Practitioners
    └── Physiotherapy
```

### Small Private Practice

```text
Patel Dental Clinic
└── One Location
    └── Dental Care
        ├── Consultation
        ├── Follow-up
        └── One Practitioner
```

All three use the same backend model and APIs.

---

## 5. Core Domains

Phase 1 should be organized around these domains:

1. Organizations
2. Locations
3. Users and Roles
4. Departments
5. Services
6. Practitioners
7. Practitioner Schedules
8. Patients
9. Appointments
10. Check-ins
11. Queues
12. Notifications
13. Analytics

A future `Visits / Encounters` domain should be kept in mind. An appointment is a booking; a visit/encounter represents the actual patient interaction. This separation will prevent future EMR, consultation, billing, prescription, and follow-up features from corrupting the appointment model.

---

## 6. Organization / Tenant Isolation

Care-Queue is multi-tenant.

Every organization-owned operational document must be scoped by `organizationId`.

Conceptually:

```text
Organization A
├── Patients
├── Practitioners
├── Appointments
└── Queues

Organization B
├── Patients
├── Practitioners
├── Appointments
└── Queues
```

A user must never be able to read or mutate another organization's data through an API request.

Tenant filtering is a backend invariant, not a frontend responsibility.

---

## 7. Locations / Branches

Locations should be first-class entities even if Phase 1 initially supports one location per organization.

A location can represent:

- Hospital campus
- Clinic branch
- Consultation center
- Future emergency center or satellite location

Typical relationship:

```text
Organization
    ↓
Location
    ↓
Department / Practitioner / Schedule / Queue
```

This avoids a future migration when a clinic opens additional branches.

---

## 8. Departments

Departments are organization-scoped and can have zero, one, or many practitioners and services.

Examples:

```text
Cardiology
├── New Consultation
├── Follow-up
└── ECG
```

A small practice should still be able to use a single generic department such as `General Consultation`, `Dental Care`, or `Physiotherapy`.

Departments should not be treated as the owner of practitioner identity. Practitioners may work across multiple departments.

---

## 9. Services

A service represents what the patient actually books or receives.

Examples:

- New Patient Consultation
- Follow-up Consultation
- ECG
- Dental Consultation
- Physiotherapy Session
- Pre-surgery Consultation

Service should support concepts such as:

- `organizationId`
- `departmentId`
- name
- description
- duration
- price/reference price
- active/inactive status
- booking rules

Services must remain separate from departments because scheduling and booking rules can differ by service.

---

## 10. Practitioners

Use a generic `Practitioner` domain rather than hard-coding the entire backend around `Doctor`.

Suggested practitioner types:

- `DOCTOR`
- `DENTIST`
- `PHYSIOTHERAPIST`
- `PSYCHOLOGIST`
- `OTHER`

A practitioner may have:

- One or more specializations
- One or more departments
- One or more services
- One or more schedules
- One or more locations

### Practitioner and department relationship

This should support many-to-many relationships.

Example:

```text
Dr. Patel
├── Cardiology
└── General Medicine
```

And:

```text
Cardiology
├── Dr. Patel
├── Dr. Shah
├── Dr. Mehta
└── Dr. Joshi
```

Do not enforce a single `departmentId` on a practitioner.

---

## 11. Specialization vs Department

These are different concepts.

Example:

```text
Department: Cardiology

Dr. A
Specialization: Interventional Cardiology

Dr. B
Specialization: Pediatric Cardiology

Dr. C
Specialization: Clinical Cardiology
```

A practitioner may have multiple specializations while belonging to one or more departments.

---

## 12. Practitioner Schedules

Schedules should be modeled independently from the practitioner profile.

A schedule may depend on:

- Organization
- Location
- Practitioner
- Department/service context
- Day/time
- Recurrence
- Exceptions
- Breaks
- Availability status

Example:

```text
Dr. Patel

Monday
10:00–13:00  Cardiology
17:00–20:00  General Medicine

Tuesday
10:00–14:00  Cardiology

Wednesday
OFF
```

The system should resolve availability from schedules, overrides/exceptions, and existing bookings rather than storing a permanently hard-coded list of slots.

Phase 1 should support the foundation for:

- Weekly recurring schedules
- Date-specific overrides
- Holidays / blocked periods
- Doctor unavailable periods
- Breaks
- Appointment duration
- Capacity rules

---

## 13. Users, Staff, and Roles

Do not create separate user collections for every role.

Use a general `User` identity plus organization membership/role.

Suggested roles:

- `PLATFORM_ADMIN`
- `ORG_ADMIN`
- `RECEPTIONIST`
- `DOCTOR` / practitioner-facing user
- `STAFF`

A user can belong to multiple organizations.

Example:

```text
User
└── Organization Memberships
    ├── ABC Hospital → Doctor
    └── Patel Clinic → Doctor / Practitioner
```

This keeps authentication identity separate from organization-specific permissions and practitioner profiles.

---

## 14. Patients

Patients should be organization-scoped, not department-scoped.

A patient can visit multiple departments in the same organization without being duplicated.

Example:

```text
Patient Rahul
└── ABC Hospital
    ├── Cardiology appointment
    └── Orthopedic appointment
```

Phase 1 patient profile should remain lightweight:

- Name
- Mobile number
- Email (optional)
- Date of birth (optional)
- Gender (optional)
- Address (optional)
- Emergency contact (optional)
- Appointment history through references

Do not implement a full EMR in Phase 1.

---

## 15. Appointments

An appointment represents a planned booking.

Conceptually it connects:

```text
Appointment
├── organizationId
├── locationId
├── patientId
├── practitionerId
├── departmentId
├── serviceId
├── schedule/context reference where applicable
├── date
├── scheduled start/end
├── status
└── source
```

### Appointment sources

Use a source field rather than creating separate appointment models:

- `ONLINE`
- `WALK_IN`
- `PHONE`
- `RECEPTION`
- `REFERRAL`

### Suggested appointment statuses

```text
BOOKED
CONFIRMED
CHECKED_IN
IN_QUEUE
IN_CONSULTATION
COMPLETED
CANCELLED
NO_SHOW
RESCHEDULED
```

The implementation should enforce valid state transitions instead of allowing arbitrary status changes from controllers.

---

## 16. Check-ins

Booking and arrival are separate events.

Example:

```text
10:30 Appointment
       ↓
Patient arrives 10:20
       ↓
Check-in
       ↓
Queue Token #12
       ↓
WAITING
```

A check-in should capture operational arrival information independently from the original appointment time.

This data later enables:

- Waiting-time calculation
- Late-arrival analysis
- No-show analysis
- Queue performance
- Patient-flow optimization

---

## 17. Queue Management

The queue is the core Care-Queue differentiator.

A queue entry should be generated from an appointment or walk-in check-in, not treated as the appointment itself.

Example:

```text
CARDIOLOGY — DR. PATEL — 15 SEP 2026

Token 01 — Appointment — COMPLETED
Token 02 — Walk-in — IN_CONSULTATION
Token 03 — Appointment — WAITING
Token 04 — Follow-up — WAITING
```

Queue capabilities:

- Token generation
- Queue position
- Patient check-in
- Waiting state
- Call next patient
- Skip
- Recall
- Consultation start
- Consultation completion
- No-show
- Queue cancellation
- Delay/status updates

A queue should be scoped to an operational context such as:

```text
organizationId
locationId
practitionerId and/or departmentId
serviceId when required
queueDate
```

The exact MongoDB key should be finalized during schema design based on the intended queue workflows.

---

## 18. Walk-in Flow

Walk-ins are not a separate patient type. They are an appointment/visit source.

```text
Receptionist
    ↓
Find/Create Patient
    ↓
Select Department / Service / Practitioner
    ↓
Create Appointment
source = WALK_IN
    ↓
Check-in
    ↓
Generate Queue Token
    ↓
Queue
```

This is mandatory because real outpatient clinics will continue to receive walk-in patients.

---

## 19. Queue and Appointment Relationship

Do not use a single model to represent both scheduling and queue state.

Correct conceptual separation:

```text
Appointment
    │
    │ patient arrives
    ↓
Check-in
    │
    ↓
Queue Entry
    │
    ↓
Consultation
```

This allows the system to handle:

- Early arrivals
- Late arrivals
- Walk-ins
- No-shows
- Doctor delays
- Queue skipping
- Emergency/priority handling later

---

## 20. Estimated Waiting Time

A major future differentiator is dynamic estimated waiting time.

Example:

```text
You are #4 in queue
Estimated wait: 32–40 minutes
```

The estimate should eventually use operational data such as:

- Number of patients ahead
- Average consultation duration
- Current consultation duration
- Doctor delays
- Service-specific duration
- Historical queue performance

This should be implemented as a service/domain capability rather than as frontend-only calculation.

---

## 21. Notifications

Phase 1 notification events should include:

### Patient notifications

- Appointment booked
- Appointment confirmed
- Appointment reminder
- Appointment cancelled
- Appointment rescheduled
- Queue notification
- Doctor delay/update

The backend should expose a notification abstraction so transport providers can change without rewriting appointment/queue logic.

Conceptually:

```text
Appointment / Queue Event
          ↓
Notification Service
      ┌───┼────┐
      ↓   ↓    ↓
     SMS WhatsApp Email
```

---

## 22. Analytics

Phase 1 analytics should focus on operational outcomes rather than vanity metrics.

### Clinic-level

- Total appointments
- Completed appointments
- Cancelled appointments
- No-shows
- Walk-ins
- Average waiting time
- Patients per practitioner

### Practitioner-level

- Today's patients
- Completed consultations
- Average consultation duration
- Current queue

### Operational

```text
Appointments: 87
Completed: 71
Cancelled: 6
No-show: 5
Waiting: 5

Average waiting time: 24 min
Average consultation: 11 min
```

Important long-term metrics:

- Average patient waiting time
- No-show rate
- Patients per practitioner
- Practitioner utilization
- Queue abandonment rate
- Appointment conversion rate
- Reception workload/time saved

Analytics should primarily derive from operational events/documents rather than requiring a large independent analytics data model in Phase 1.

---

## 23. Multi-Location and Practitioner Flexibility

The model should support a practitioner working at multiple locations and organizations.

Example:

```text
Dr. Patel
├── ABC Hospital
│   └── Main Campus → Cardiology
│
└── Patel Private Clinic
    └── Main Branch → General Consultation
```

Therefore keep these concepts separate:

```text
User Identity
≠
Organization Membership
≠
Practitioner Profile
```

This is a key architectural rule.

---

## 24. Recommended MongoDB Domain Collections

The exact collection design will be finalized in the schema implementation PR, but Phase 1 should be designed around these domains:

```text
organizations
locations
users
organization_memberships
roles / permissions (if needed)
departments
services
practitioners
specializations
practitioner_departments
practitioner_services
schedules
schedule_exceptions
patients
appointments
check_ins
queues
queue_entries
notifications
```

Not every domain necessarily requires a separate collection if the final access patterns justify embedding. The implementation should optimize for query patterns, tenant isolation, consistency, and maintainability rather than mechanically creating one collection per noun.

---

## 25. Phase 1 API / Service Boundaries

The Node/Express backend should be organized by business domain, not by a giant controller/model folder.

Suggested domains:

```text
modules/
├── auth/
├── organizations/
├── locations/
├── users/
├── departments/
├── services/
├── practitioners/
├── schedules/
├── patients/
├── appointments/
├── check-ins/
├── queues/
├── notifications/
└── analytics/
```

Each module can evolve around:

```text
routes
controllers
services
models
validators
repositories (when useful)
```

Controllers should remain thin. Business rules such as appointment state transitions, availability resolution, queue transitions, and tenant authorization should live in domain/service layers.

---

## 26. Phase 1 Core Flow

```text
                 ORGANIZATION
                       ↓
          Locations / Departments
                       ↓
                  Services
                       ↓
                Practitioners
                       ↓
                   Schedules
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
   Online Booking                 Walk-in
        ↓                             ↓
        └──────────────┬──────────────┘
                       ↓
                  APPOINTMENT
                       ↓
                    CHECK-IN
                       ↓
                 QUEUE / TOKEN
                       ↓
             DOCTOR CONSULTATION
                       ↓
                   COMPLETED
                       ↓
                   ANALYTICS
```

---

## 27. Phase 1 Scope — Included

- Multi-tenant organization management
- Hospital / clinic / private-practice configuration
- Optional multiple locations
- Departments
- Services
- Practitioners and specializations
- Practitioner-to-department many-to-many relationships
- Practitioner schedules
- Patients
- Online appointments
- Reception-created appointments
- Walk-ins
- Check-ins
- Real-time queue/token management
- Basic appointment and queue statuses
- Notifications abstraction
- Basic operational analytics
- Role-based access control
- Tenant isolation

---

## 28. Phase 1 Scope — Explicitly Excluded

Do not expand Phase 1 into a full hospital information system.

Excluded for now:

- Full EMR / medical records
- Prescriptions
- Laboratory management
- Pharmacy management
- Insurance claims
- Accounting
- Full billing platform
- Telemedicine
- AI diagnosis
- Hospital bed management
- Ambulance management
- Complex clinical workflows
- Consumer doctor marketplace

These can be evaluated as later phases after the appointment and queue product is validated.

---

## 29. Future-Proofing Rules

The implementation should follow these rules:

1. **One universal organization model** for hospitals, clinics, and private practices.
2. **Tenant isolation is mandatory** on organization-owned data.
3. **Department is not practitioner ownership.** Practitioners may belong to multiple departments.
4. **Service is separate from department.** Patients book services, not merely departments.
5. **User identity is separate from practitioner identity.**
6. **Organization membership is separate from user identity.**
7. **Appointment is separate from queue entry.**
8. **Check-in is a distinct operational event.**
9. **Walk-in is a source, not a separate patient type.**
10. **Schedules are configuration; availability is resolved from schedules plus exceptions and bookings.**
11. **Business state transitions belong in domain/service logic, not directly in controllers.**
12. **Keep Phase 1 operational and avoid prematurely implementing clinical/EMR functionality.**
13. **Design for future `Visit / Encounter` entities without implementing the full domain now.**

---

## 30. Architecture Decision Summary

The recommended Care-Queue backend is a **multi-tenant, domain-oriented Node.js/Express/MongoDB system** centered on patient flow.

The fundamental model is:

```text
Organization
    ↓
Location
    ↓
Department ←→ Practitioner
    ↓              ↓
Service         Schedule
    ↓              ↓
    └──── Appointment ────┐
                          ↓
                       Check-in
                          ↓
                    Queue Entry
                          ↓
                      Encounter
```

The architecture intentionally supports:

- 1 organization → 1 department → 1 practitioner
- 1 organization → multiple departments → multiple practitioners
- 1 organization → multiple locations → multiple departments → many practitioners

without requiring different backend models for each business size.

---

## 31. Next Implementation Step

Before writing production code, the next architecture task should define the **MongoDB schema contract** in detail:

- Collection-by-collection fields
- Required vs optional fields
- ObjectId references
- Embedded vs referenced data
- Unique constraints
- Compound indexes
- Tenant-scoped indexes
- Appointment status/state machine
- Queue state machine
- Schedule/availability algorithm
- Validation rules
- API resource boundaries
- Authentication and authorization middleware
- Audit/event strategy

That schema contract should be treated as the implementation blueprint for the Node.js + Express backend.
