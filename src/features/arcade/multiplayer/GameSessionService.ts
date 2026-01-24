/**
 * Game Session Service
 * Handles real-time multiplayer game sessions via Supabase
 */

import { supabase } from '../../../shared/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  GameSession,
  GameMove,
  CreateSessionOptions,
  SessionCallback,
  MoveCallback,
  PongMove,
  GameSessionRow,
  GameMoveRow,
} from './types';
import { transformSession, transformMove } from './types';

class GameSessionService {
  private activeChannel: RealtimeChannel | null = null;
  private currentSessionId: string | null = null;
  private moveSequence = 0;

  // Callbacks
  private onSessionUpdate: SessionCallback | null = null;
  private onMoveReceived: MoveCallback | null = null;
  private onOpponentJoined: (() => void) | null = null;
  private onOpponentLeft: (() => void) | null = null;

  /**
   * Create a new game session
   */
  async createSession(options: CreateSessionOptions): Promise<GameSession> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Generate invite code for private sessions
    const inviteCode = options.isPrivate
      ? Math.random().toString(36).substring(2, 8).toUpperCase()
      : null;

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        game_id: options.gameId,
        host_id: user.user.id,
        max_score: options.maxScore ?? 11,
        is_private: options.isPrivate ?? false,
        invite_code: inviteCode,
      })
      .select(`
        *,
        host:profiles!game_sessions_host_id_fkey(id, full_name, avatar_url, xp)
      `)
      .single();

    if (error) throw error;
    return transformSession(data as GameSessionRow);
  }

  /**
   * Find available sessions to join
   */
  async findAvailableSessions(gameId: string): Promise<GameSession[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        host:profiles!game_sessions_host_id_fkey(id, full_name, avatar_url, xp)
      `)
      .eq('game_id', gameId)
      .eq('status', 'waiting')
      .eq('is_private', false)
      .neq('host_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data as GameSessionRow[]).map(transformSession);
  }

  /**
   * Join a session by ID
   */
  async joinSession(sessionId: string): Promise<GameSession> {
    const { data, error } = await supabase.rpc('join_game_session', {
      p_session_id: sessionId,
    });

    if (error) throw error;

    // Fetch full session with profiles
    return this.getSession(sessionId);
  }

  /**
   * Join a session by invite code
   */
  async joinByInviteCode(inviteCode: string): Promise<GameSession> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('status', 'waiting')
      .single();

    if (error || !data) throw new Error('Invalid or expired invite code');

    return this.joinSession(data.id);
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<GameSession> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        host:profiles!game_sessions_host_id_fkey(id, full_name, avatar_url, xp),
        guest:profiles!game_sessions_guest_id_fkey(id, full_name, avatar_url, xp)
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return transformSession(data as GameSessionRow);
  }

  /**
   * Subscribe to session updates (real-time)
   */
  subscribeToSession(
    sessionId: string,
    callbacks: {
      onSessionUpdate?: SessionCallback;
      onMoveReceived?: MoveCallback;
      onOpponentJoined?: () => void;
      onOpponentLeft?: () => void;
    }
  ): void {
    // Store callbacks
    this.onSessionUpdate = callbacks.onSessionUpdate ?? null;
    this.onMoveReceived = callbacks.onMoveReceived ?? null;
    this.onOpponentJoined = callbacks.onOpponentJoined ?? null;
    this.onOpponentLeft = callbacks.onOpponentLeft ?? null;

    // Unsubscribe from previous channel
    this.unsubscribe();

    this.currentSessionId = sessionId;
    this.moveSequence = 0;

    // Create channel for this session
    this.activeChannel = supabase.channel(`game_session:${sessionId}`);

    // Subscribe to session changes
    this.activeChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const session = transformSession(payload.new as GameSessionRow);

          // Check if opponent joined
          if (payload.old.guest_id === null && payload.new.guest_id !== null) {
            this.onOpponentJoined?.();
          }

          // Check if opponent left (session abandoned)
          if (payload.new.status === 'abandoned') {
            this.onOpponentLeft?.();
          }

          this.onSessionUpdate?.(session);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_moves',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const move = transformMove(payload.new as GameMoveRow);

          // Only process moves from opponent
          const { data: user } = await supabase.auth.getUser();
          if (move.playerId !== user.user?.id) {
            this.onMoveReceived?.(move);
          }
        }
      )
      .subscribe();
  }

  /**
   * Send a move to the opponent
   */
  async sendMove(move: PongMove): Promise<void> {
    if (!this.currentSessionId) throw new Error('Not in a session');

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    this.moveSequence++;

    const { error } = await supabase.from('game_moves').insert({
      session_id: this.currentSessionId,
      player_id: user.user.id,
      move_type: move.type,
      move_data: move,
      sequence_num: this.moveSequence,
    });

    if (error) console.error('Failed to send move:', error);
  }

  /**
   * Update game state in session
   */
  async updateGameState(gameState: Record<string, unknown>): Promise<void> {
    if (!this.currentSessionId) throw new Error('Not in a session');

    const { error } = await supabase
      .from('game_sessions')
      .update({ game_state: gameState })
      .eq('id', this.currentSessionId);

    if (error) console.error('Failed to update game state:', error);
  }

  /**
   * Finish the game and award XP
   */
  async finishGame(hostScore: number, guestScore: number): Promise<GameSession> {
    if (!this.currentSessionId) throw new Error('Not in a session');

    const { data, error } = await supabase.rpc('finish_game_session', {
      p_session_id: this.currentSessionId,
      p_host_score: hostScore,
      p_guest_score: guestScore,
    });

    if (error) throw error;

    return this.getSession(this.currentSessionId);
  }

  /**
   * Leave/abandon a session
   */
  async leaveSession(): Promise<void> {
    if (!this.currentSessionId) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Get session to determine role
    const session = await this.getSession(this.currentSessionId);

    if (session.status === 'waiting') {
      // Delete if waiting (host only)
      if (session.hostId === user.user.id) {
        await supabase
          .from('game_sessions')
          .delete()
          .eq('id', this.currentSessionId);
      }
    } else if (session.status === 'playing') {
      // Mark as abandoned
      await supabase
        .from('game_sessions')
        .update({ status: 'abandoned' })
        .eq('id', this.currentSessionId);
    }

    this.unsubscribe();
  }

  /**
   * Unsubscribe from current session
   */
  unsubscribe(): void {
    if (this.activeChannel) {
      supabase.removeChannel(this.activeChannel);
      this.activeChannel = null;
    }
    this.currentSessionId = null;
    this.moveSequence = 0;
    this.onSessionUpdate = null;
    this.onMoveReceived = null;
    this.onOpponentJoined = null;
    this.onOpponentLeft = null;
  }

  /**
   * Get current user's ID
   */
  async getCurrentUserId(): Promise<string | null> {
    const { data: user } = await supabase.auth.getUser();
    return user.user?.id ?? null;
  }

  /**
   * Check if current user is the host
   */
  async isHost(session: GameSession): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    return userId === session.hostId;
  }

  /**
   * Get recent sessions for current user
   */
  async getMyRecentSessions(limit = 10): Promise<GameSession[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        host:profiles!game_sessions_host_id_fkey(id, full_name, avatar_url, xp),
        guest:profiles!game_sessions_guest_id_fkey(id, full_name, avatar_url, xp)
      `)
      .or(`host_id.eq.${user.user.id},guest_id.eq.${user.user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as GameSessionRow[]).map(transformSession);
  }
}

// Export singleton instance
export const gameSessionService = new GameSessionService();
