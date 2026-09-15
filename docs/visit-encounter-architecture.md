# Care-Queue — Visit / Encounter Architecture

## Purpose

A core future-ready boundary for Care-Queue is the separation between an **Appointment** and a **Visit / Encounter**.

> **An appointment is a booking. A visit/encounter is the actual patient interaction.**

This document defines the architectural contract for that separation so future consultation, clinical, billing, prescription, follow-up, and other healthcare workflows do not corrupt the appointment model.

---

## 1. Appointment vs Visit / Encounter

### Appointment

An appointment represents a planned or scheduled interaction.

```text
Patient
   ↓
Appointment
   ├── Date/time
   ├── Practitioner
   ├── Department
   └── Service
```

It answers:

> **When was the patient booked?**

### Visit / Encounter

A visit/encounter represents the actual patient interaction that occurs after arrival and care delivery.

```text
Appointment (optional)
        ↓
     Check-in
        ↓
Visit / Encounter
        ↓
 Consultation
        ↓
   Completed
```

It answers:

> **What actual patient interaction happened?**

A visit can originate from an appointment, walk-in, referral, or another supported workflow.

---

## 2. Why They Must Be Separate

Do **not** turn the appointment document into the patient-care document.

If appointment and visit are merged, future features will force unrelated state and data into the same record:

- Consultation notes
- Diagnoses
- Prescriptions
- Procedures
- Billing
- Payments
- Follow-ups
- Referrals
- Clinical documentation

That creates a brittle appointment model and makes future domain boundaries difficult to maintain.

Instead:

```text
Appointment
    │
    │ optional source
    ↓
Check-in
    │
    ↓
Queue Entry
    │
    ↓
Visit / Encounter
    │
    ├── Consultation
    ├── Clinical data (future)
    ├── Billing (future)
    └── Follow-up (future)
```

---

## 3. Visit / Encounter Is the Clinical Boundary

The `Visit` / `Encounter` domain should become the parent operational boundary for the actual patient interaction.

Conceptually:

```text
Visit / Encounter
├── Organization
├── Location
├── Patient
├── Practitioner
├── Department
├── Service
├── Appointment (optional)
├── Check-in (optional)
├── Queue Entry (optional)
├── Started At
├── Ended At
├── Status
└── Future domain references
```

The visit should not require an appointment because walk-in care must be supported.

---

## 4. Core Relationships

### Scheduled appointment path

```text
Patient
  ↓
Appointment
  ↓
Check-in
  ↓
Queue Entry
  ↓
Visit / Encounter
```

### Walk-in path

```text
Patient
  ↓
Walk-in Check-in
  ↓
Queue Entry
  ↓
Visit / Encounter
```

Therefore:

```text
Appointment → Visit = optional relationship
Check-in → Visit = optional relationship
Queue Entry → Visit = optional relationship
Patient → Visit = required relationship
Organization → Visit = required relationship
```

---

## 5. Suggested Visit / Encounter Collection

Recommended collection:

```text
visits
```

Initial conceptual fields:

```text
_id
organizationId
locationId
patientId
practitionerId
departmentId
serviceId
appointmentId       // optional
checkInId           // optional
queueEntryId        // optional
status
startedAt
endedAt
createdAt
updatedAt
```

The exact schema should be finalized during the MongoDB implementation phase based on access patterns and transaction requirements.

---

## 6. Visit / Encounter Status

Phase 1 should reserve a separate visit state machine.

Suggested initial states:

```text
CREATED
    ↓
ARRIVED
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

Potential future states:

```text
CANCELLED
ABANDONED
REFERRED
FOLLOW_UP_REQUIRED
```

These states must not be forced into the appointment status field.

---

## 7. Appointment Lifecycle vs Visit Lifecycle

The two lifecycles are related but independent.

### Appointment

```text
BOOKED
  ↓
CONFIRMED
  ↓
CHECKED_IN
  ↓
IN_QUEUE
  ↓
IN_CONSULTATION
  ↓
COMPLETED
```

### Visit

```text
CREATED
  ↓
ARRIVED
  ↓
IN_PROGRESS
  ↓
COMPLETED
```

The implementation should not assume that every appointment becomes a completed visit.

Examples:

```text
Appointment → CANCELLED
Appointment → NO_SHOW
Appointment → no visit created
```

Or:

```text
Walk-in
   ↓
Visit created without appointment
```

---

## 8. Future Clinical Extensions

When clinical functionality is introduced, it should attach to the visit/encounter boundary or separate bounded domains.

Possible future structure:

```text
Visit / Encounter
│
├── Consultation
│    ├── Notes
│    ├── Assessment
│    └── Plan
│
├── Diagnoses
│
├── Prescriptions
│
├── Procedures
│
├── Referrals
│
├── Follow-ups
│
└── Billing / Payments
```

Do not add these fields directly to `appointments`.

---

## 9. Analytics Impact

Separating appointments and visits allows accurate operational analytics.

### Appointment metrics

- Booking volume
- Cancellation rate
- No-show rate
- Booking source
- Schedule utilization

### Visit metrics

- Actual patients served
- Average consultation duration
- Practitioner utilization
- Completed encounters
- Average patient waiting time

### Queue metrics

- Time from check-in to queue entry
- Time waiting before consultation
- Queue abandonment
- Token throughput

This makes analytics substantially more useful than treating appointment completion as proof that a consultation occurred.

---

## 10. Non-Negotiable Rules

1. An appointment is a **booking**, not a clinical interaction.
2. A visit/encounter is the **actual patient interaction**.
3. A visit may exist without an appointment.
4. An appointment may end without a visit, such as cancellation or no-show.
5. Clinical data must not be stored directly inside the appointment document.
6. Billing and payment data must not be forced into the appointment document.
7. Queue entries and visits remain separate operational concepts.
8. Visit state transitions must be enforced in domain/service logic.
9. `organizationId` must scope organization-owned visit data.
10. Future clinical modules should reference the visit/encounter instead of expanding the appointment into a catch-all entity.

---

## 11. Phase 1 Implementation Position

Phase 1 does not need a full EMR or clinical documentation system.

However, the backend architecture **must reserve the `visits` domain now** so the appointment and queue implementations are designed with the correct boundaries from the beginning.

The next schema implementation should therefore define:

- `appointments`
- `check_ins`
- `queues`
- `queue_entries`
- `visits`

as related but distinct operational entities.

This is the architectural contract for future implementation PRs.
