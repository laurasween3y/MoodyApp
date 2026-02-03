/* tslint:disable */
/* eslint-disable */
export interface PlannerEventResponse {
    id?: number;
    title?: string;
    description?: string | null;
    event_date?: string;
    start_time?: string | null;
    end_time?: string | null;
    reminder_minutes_before?: number | null;
    created_at?: string;
    updated_at?: string;
}
