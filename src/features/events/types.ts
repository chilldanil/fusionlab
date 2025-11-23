import { z } from 'zod';

export type EventStatus = 'proposal' | 'confirmed' | 'cancelled';

export interface Event {
    id: string;
    creator_id: string;
    created_at: string;
    title: string;
    description: string;
    event_date: string;
    poster_url?: string;
    status: EventStatus;
    votes?: { count: number }[]; // Joined view
    user_has_voted?: boolean; // Helper for UI
    user_has_joined?: boolean; // Helper for UI
}

export interface EventVote {
    event_id: string;
    user_id: string;
    created_at: string;
}

export interface EventParticipant {
    event_id: string;
    user_id: string;
    created_at: string;
}

// Zod Schema for creating an event
export const createEventSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    event_date: z.date().refine((date) => {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 21);
        return date > minDate;
    }, {
        message: 'Event must be scheduled at least 21 days in the future',
    }),
    poster_url: z.string().optional(),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
