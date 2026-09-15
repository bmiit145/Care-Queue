/**
 * Availability Engine — computes open appointment slots.
 *
 * Architecture requirement:
 *   Recurring schedule
 *     + Schedule exception (leave / special working day)
 *     + Break times (future: add breaks to schedule model)
 *     + Existing appointments
 *     + Service duration
 *     → AVAILABLE SLOTS
 *
 * Used by:
 *   GET /api/schedules/availability?practitionerId=&date=&serviceId=
 */
export interface TimeSlot {
    start: Date;
    end: Date;
}
interface AvailabilityOptions {
    organizationId: string;
    practitionerId: string;
    date: Date;
    /** Duration of each slot in minutes (from service or default) */
    slotDurationMin?: number;
}
/**
 * Compute available slots for a practitioner on a given date.
 * Returns an empty array if the practitioner is on leave that day.
 */
export declare function getAvailableSlots(opts: AvailabilityOptions): Promise<TimeSlot[]>;
export {};
//# sourceMappingURL=availability.service.d.ts.map
