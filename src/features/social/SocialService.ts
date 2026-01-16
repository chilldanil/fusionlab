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

interface ProfileData {
    id: string;
    full_name: string;
    role?: string | null;
    bio?: string | null;
    xp?: number | null;
    is_incognito?: boolean | null;
}

interface FriendshipRow {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: FriendshipStatus;
    created_at: string;
    requester?: ProfileData | ProfileData[] | null;
    receiver?: ProfileData | ProfileData[] | null;
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
                requester:requester_id(id, full_name, role, bio, xp, is_incognito),
                receiver:receiver_id(id, full_name, role, bio, xp, is_incognito)
            `)
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: FriendshipRow) => {
            const requesterData = Array.isArray(row.requester) ? row.requester[0] : row.requester;
            const receiverData = Array.isArray(row.receiver) ? row.receiver[0] : row.receiver;

            return {
                id: row.id,
                requesterId: row.requester_id,
                receiverId: row.receiver_id,
                status: row.status as FriendshipStatus,
                createdAt: row.created_at,
                requester: requesterData
                    ? {
                        id: requesterData.id,
                        fullName: requesterData.full_name,
                        role: requesterData.role,
                        bio: requesterData.bio,
                        xp: requesterData.xp,
                        isIncognito: requesterData.is_incognito,
                    }
                    : null,
                receiver: receiverData
                    ? {
                        id: receiverData.id,
                        fullName: receiverData.full_name,
                        role: receiverData.role,
                        bio: receiverData.bio,
                        xp: receiverData.xp,
                        isIncognito: receiverData.is_incognito,
                    }
                    : null,
            };
        });
    }
}
