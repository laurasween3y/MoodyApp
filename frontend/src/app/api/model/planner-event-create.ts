/* tslint:disable */
/* eslint-disable */
export interface PlannerEventCreate {
    title: string;
    description?: string | null;
    event_date: string; // YYYY-MM-DD
    start_time?: string | null; // HH:MM[:SS]
    end_time?: string | null;
    reminder_minutes_before?: number | null;
}
