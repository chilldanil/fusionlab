import { supabase } from '../../shared/config/supabase';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface ProfileSummary {
    id: string;
    fullName: string;
    role?: string | null;
    bio?: string | null;
    xp?: number | null;
    isIncognito?: boolean | null;
}

export interface FriendshipEdge {
    id: string;
    requesterId: string;
    receiverId: string;
    status: FriendshipStatus;
    createdAt: string;
    requester?: ProfileSummary | null;
    receiver?: ProfileSummary | null;
}

export class SocialService {
    static async sendFriendRequest(requesterId: string, receiverId: string) {
        if (!requesterId || !receiverId) throw new Error('Both requester and receiver are required.');
        if (requesterId === receiverId) throw new Error('You cannot send a request to yourself.');

        const { data: existing, error: existingError } = await supabase
            .from('friendships')
            .select('id, status, requester_id, receiver_id')
            .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
            .maybeSingle();

        if (existingError) throw existingError;

        if (existing) {
            if (existing.status === 'rejected') {
                // Allow re-request after rejection by recreating the row
                await supabase.from('friendships').delete().eq('id', existing.id);
            } else {
                return { alreadyRequested: true };
            }
        }

        const { data, error } = await supabase
            .from('friendships')
            .insert({
                requester_id: requesterId,
                receiver_id: receiverId,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async acceptFriendRequest(friendshipId: string) {
        const { data, error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async rejectFriendRequest(friendshipId: string) {
        const { data, error } = await supabase
            .from('friendships')
            .update({ status: 'rejected' })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async listFriendships(userId: string): Promise<FriendshipEdge[]> {
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                requester_id,
                receiver_id,
                status,
                created_at,
                requester:profiles!friendships_requester_id_fkey(id, full_name, role, bio, xp, is_incognito),
                receiver:profiles!friendships_receiver_id_fkey(id, full_name, role, bio, xp, is_incognito)
            `)
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row) => ({
            id: row.id,
            requesterId: row.requester_id,
            receiverId: row.receiver_id,
            status: row.status as FriendshipStatus,
            createdAt: row.created_at,
            requester: row.requester
                ? {
                    id: row.requester.id,
                    fullName: row.requester.full_name,
                    role: row.requester.role,
                    bio: row.requester.bio,
                    xp: row.requester.xp,
                    isIncognito: row.requester.is_incognito,
                }
                : null,
            receiver: row.receiver
                ? {
                    id: row.receiver.id,
                    fullName: row.receiver.full_name,
                    role: row.receiver.role,
                    bio: row.receiver.bio,
                    xp: row.receiver.xp,
                    isIncognito: row.receiver.is_incognito,
                }
                : null,
        }));
    }
}
