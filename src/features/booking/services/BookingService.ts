import { supabase } from '../../../shared/config/supabase';

export type BookingStatus = 'pending' | 'reserved' | 'confirmed' | 'cancelled';

export interface BookingRecord {
    id: string;
    zone_id: string;
    seat_id: string | null;
    user_id: string;
    booking_date: string;
    slot_label: string;
    status: BookingStatus;
    arrival_confirmed_at?: string | null;
    rules_accepted_at?: string | null;
    handoff_confirmed_at?: string | null;
    handoff_confirmed_by?: string | null;
    created_at: string;
}

export type InviteStatus = 'pending' | 'accepted' | 'rejected';

export interface BookingInviteRecord {
    id: string;
    booking_id: string;
    inviter_id: string;
    invitee_id: string;
    status: InviteStatus;
    created_at: string;
    booking?: BookingRecord | null;
    inviter?: { full_name: string | null } | null;
    invitee?: { full_name: string | null } | null;
}

type BookingInviteRow = Omit<BookingInviteRecord, 'booking' | 'inviter' | 'invitee'> & {
    booking?: BookingRecord | BookingRecord[] | null;
    inviter?: { full_name: string | null } | { full_name: string | null }[] | null;
    invitee?: { full_name: string | null } | { full_name: string | null }[] | null;
};

interface PropertyKeyRecord {
    id: string;
    key_id: string;
    zone_id: string;
    seat_id: string | null;
    current_holder_id: string | null;
    updated_at: string;
}

interface PropertyKeyWithHolder extends PropertyKeyRecord {
    holder?: { full_name: string | null } | null;
}

export interface BookingNotificationRecord {
    id: string;
    booking_id: string | null;
    user_id: string;
    type: 'checkin_required' | 'no_show_cancelled';
    message: string;
    read_at: string | null;
    created_at: string;
}

interface CreateSeatBookingParams {
    zoneId: string;
    seatId: string;
    bookingDate: string;
    slotLabel: string;
    userId: string;
}

interface CreatePrivateBookingParams {
    zoneId: string;
    bookingDate: string;
    slotLabel: string;
    userId: string;
    inviteeIds: string[];
}

export const BookingService = {
    async listBookings(bookingDate: string, slotLabel: string): Promise<BookingRecord[]> {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('booking_date', bookingDate)
            .eq('slot_label', slotLabel)
            .in('status', ['pending', 'reserved', 'confirmed']);

        if (error) throw error;
        return (data || []) as BookingRecord[];
    },

    async createSeatBooking(params: CreateSeatBookingParams): Promise<BookingRecord> {
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                zone_id: params.zoneId,
                seat_id: params.seatId,
                booking_date: params.bookingDate,
                slot_label: params.slotLabel,
                user_id: params.userId,
                status: 'reserved',
            })
            .select()
            .single();

        if (error) throw error;
        return data as BookingRecord;
    },

    async createPrivateBooking(params: CreatePrivateBookingParams): Promise<BookingRecord> {
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                zone_id: params.zoneId,
                seat_id: null,
                booking_date: params.bookingDate,
                slot_label: params.slotLabel,
                user_id: params.userId,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        if (params.inviteeIds.length > 0) {
            const invites = params.inviteeIds.map((inviteeId) => ({
                booking_id: data.id,
                inviter_id: params.userId,
                invitee_id: inviteeId,
                status: 'pending',
            }));

            const { error: inviteError } = await supabase
                .from('booking_invites')
                .insert(invites);

            if (inviteError) throw inviteError;
        }

        return data as BookingRecord;
    },

    async listBookingsForUser(userId: string): Promise<BookingRecord[]> {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .order('booking_date', { ascending: true })
            .order('slot_label', { ascending: true });

        if (error) throw error;
        return (data || []) as BookingRecord[];
    },

    async listInvitesForUser(userId: string): Promise<BookingInviteRecord[]> {
        const { data, error } = await supabase
            .from('booking_invites')
            .select(`
                id,
                booking_id,
                inviter_id,
                invitee_id,
                status,
                created_at,
                booking:booking_id(*),
                inviter:inviter_id(full_name)
            `)
            .eq('invitee_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const rows = (data || []) as BookingInviteRow[];
        return rows.map((row) => ({
            ...row,
            booking: Array.isArray(row.booking) ? row.booking[0] : row.booking,
            inviter: Array.isArray(row.inviter) ? row.inviter[0] : row.inviter,
        })) as BookingInviteRecord[];
    },

    async listInvitesForBooking(bookingId: string): Promise<BookingInviteRecord[]> {
        const { data, error } = await supabase
            .from('booking_invites')
            .select(`
                id,
                booking_id,
                inviter_id,
                invitee_id,
                status,
                created_at,
                invitee:invitee_id(full_name)
            `)
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        const rows = (data || []) as BookingInviteRow[];
        return rows.map((row) => ({
            ...row,
            invitee: Array.isArray(row.invitee) ? row.invitee[0] : row.invitee,
        })) as BookingInviteRecord[];
    },

    async listBookingsForResource(params: {
        bookingDate: string;
        zoneId: string;
        seatId: string | null;
    }): Promise<BookingRecord[]> {
        const { bookingDate, zoneId, seatId } = params;
        let query = supabase
            .from('bookings')
            .select('*')
            .eq('booking_date', bookingDate)
            .eq('zone_id', zoneId)
            .in('status', ['pending', 'reserved', 'confirmed']);

        query = seatId ? query.eq('seat_id', seatId) : query.is('seat_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as BookingRecord[];
    },

    async confirmArrival(bookingId: string): Promise<void> {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('bookings')
            .update({
                arrival_confirmed_at: now,
                rules_accepted_at: now,
                status: 'confirmed',
            })
            .eq('id', bookingId);

        if (error) throw error;
    },

    async confirmHandoff(bookingId: string, userId: string, keyId: string, zoneId: string, seatId: string | null) {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('bookings')
            .update({
                handoff_confirmed_at: now,
                handoff_confirmed_by: userId,
            })
            .eq('id', bookingId);

        if (error) throw error;

        await BookingService.upsertPropertyKey({
            keyId,
            zoneId,
            seatId,
            currentHolderId: userId,
        });
    },

    async upsertPropertyKey(params: {
        keyId: string;
        zoneId: string;
        seatId: string | null;
        currentHolderId: string;
    }): Promise<PropertyKeyRecord> {
        const { data, error } = await supabase
            .from('property_keys')
            .upsert({
                key_id: params.keyId,
                zone_id: params.zoneId,
                seat_id: params.seatId,
                current_holder_id: params.currentHolderId,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key_id' })
            .select()
            .single();

        if (error) throw error;
        return data as PropertyKeyRecord;
    },

    async getPropertyKey(params: { zoneId: string; seatId: string | null }): Promise<PropertyKeyWithHolder | null> {
        const { zoneId, seatId } = params;
        let query = supabase
            .from('property_keys')
            .select(`
                id,
                key_id,
                zone_id,
                seat_id,
                current_holder_id,
                updated_at,
                holder:current_holder_id(full_name)
            `)
            .eq('zone_id', zoneId);

        query = seatId ? query.eq('seat_id', seatId) : query.is('seat_id', null);

        const { data, error } = await query.maybeSingle();
        if (error) throw error;

        if (!data) return null;
        return {
            ...data,
            holder: Array.isArray(data.holder) ? data.holder[0] : data.holder,
        } as PropertyKeyWithHolder;
    },

    async listNotifications(userId: string): Promise<BookingNotificationRecord[]> {
        const { data, error } = await supabase
            .from('booking_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as BookingNotificationRecord[];
    },

    async markNotificationRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('booking_notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (error) throw error;
    },

    async respondToInvite(inviteId: string, status: InviteStatus): Promise<void> {
        const { error } = await supabase
            .from('booking_invites')
            .update({ status })
            .eq('id', inviteId);

        if (error) throw error;
    },

    async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', bookingId);

        if (error) throw error;
    },

    async cancelBooking(bookingId: string): Promise<void> {
        await BookingService.updateBookingStatus(bookingId, 'cancelled');
    },

    async tryConfirmPrivateBooking(bookingId: string, requiredCount: number): Promise<void> {
        const { data, error } = await supabase
            .from('booking_invites')
            .select('id', { count: 'exact' })
            .eq('booking_id', bookingId)
            .eq('status', 'accepted');

        if (error) throw error;
        const acceptedCount = data?.length ?? 0;
        if (acceptedCount >= requiredCount) {
            await BookingService.updateBookingStatus(bookingId, 'reserved');
        }
    },
};
