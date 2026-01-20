import { supabase } from '../../../shared/config/supabase';
import type { CreateEventFormData, Event } from '../types';

export const EventsService = {
    async getProposals(): Promise<Event[]> {
        const { data, error } = await supabase
            .from('events')
            .select(`
        *,
        votes:event_votes(count)
      `)
            .eq('status', 'proposal')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // We need to sort by vote count manually since we can't easily order by related count in Supabase JS client without RPC or complex queries
        // But for now, let's just fetch and sort in JS as the dataset is likely small for this demo
        // A better approach for scale would be a view or a computed column
        const events = (data || []) as Event[];
        const normalized = events.map((event) => ({
            ...event,
            votes: event.votes && event.votes.length > 0 ? event.votes : [{ count: 0 }],
        }));

        return normalized.sort((a, b) => {
            const votesA = a.votes?.[0]?.count || 0;
            const votesB = b.votes?.[0]?.count || 0;
            return votesB - votesA;
        });
    },

    async getUpcoming(): Promise<Event[]> {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'confirmed')
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true });

        if (error) throw error;
        return (data || []) as Event[];
    },

    async createEvent(formData: CreateEventFormData, creatorId: string): Promise<Event> {
        const { data, error } = await supabase
            .from('events')
            .insert({
                creator_id: creatorId,
                title: formData.title,
                description: formData.description,
                event_date: formData.event_date.toISOString(),
                poster_url: formData.poster_url,
                status: 'proposal',
            })
            .select()
            .single();

        if (error) {
            if (error.message.includes('You can only propose 1 event per month')) {
                throw new Error('You can only propose 1 event per month.');
            }
            throw error;
        }
        return data as Event;
    },

    async vote(eventId: string, userId: string): Promise<void> {
        // Check if vote exists
        const { data: existingVote } = await supabase
            .from('event_votes')
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();

        if (existingVote) {
            // Remove vote
            const { error } = await supabase
                .from('event_votes')
                .delete()
                .eq('event_id', eventId)
                .eq('user_id', userId);
            if (error) throw error;
        } else {
            // Add vote
            const { error } = await supabase
                .from('event_votes')
                .insert({
                    event_id: eventId,
                    user_id: userId,
                });
            if (error) throw error;
        }
    },

    async join(eventId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('event_participants')
            .insert({
                event_id: eventId,
                user_id: userId,
            });

        if (error) throw error;
    },

    async getUserVotes(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('event_votes')
            .select('event_id')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(v => v.event_id);
    },

    async getUserParticipations(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('event_participants')
            .select('event_id')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(row => row.event_id);
    },

    async uploadPoster(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('event-posters')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('event-posters')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async deleteEvent(eventId: string): Promise<void> {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;
    }
};
