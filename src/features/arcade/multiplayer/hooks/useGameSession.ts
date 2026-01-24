/**
 * useGameSession Hook
 * React hook for managing multiplayer game sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { gameSessionService } from '../GameSessionService';
import type { GameSession, GameMove, SessionStatus } from '../types';

interface UseGameSessionOptions {
  onOpponentJoined?: () => void;
  onOpponentLeft?: () => void;
  onMoveReceived?: (move: GameMove) => void;
}

interface UseGameSessionReturn {
  session: GameSession | null;
  isHost: boolean;
  isConnected: boolean;
  status: SessionStatus | null;
  error: string | null;
  loading: boolean;
  createSession: (gameId: string, isPrivate?: boolean) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  joinByCode: (code: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  findSessions: (gameId: string) => Promise<GameSession[]>;
}

export function useGameSession(options: UseGameSessionOptions = {}): UseGameSessionReturn {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to session updates when we have a session
  useEffect(() => {
    if (!session) return;

    gameSessionService.subscribeToSession(session.id, {
      onSessionUpdate: (updatedSession) => {
        setSession(updatedSession);
      },
      onMoveReceived: options.onMoveReceived,
      onOpponentJoined: () => {
        setIsConnected(true);
        options.onOpponentJoined?.();
      },
      onOpponentLeft: () => {
        setIsConnected(false);
        options.onOpponentLeft?.();
      },
    });

    // Check if already connected
    if (session.guestId && session.status === 'playing') {
      setIsConnected(true);
    }

    return () => {
      gameSessionService.unsubscribe();
    };
  }, [session?.id]);

  const createSession = useCallback(async (gameId: string, isPrivate = false) => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await gameSessionService.createSession({
        gameId,
        isPrivate,
      });
      setSession(newSession);
      setIsHost(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const joinedSession = await gameSessionService.joinSession(sessionId);
      setSession(joinedSession);
      setIsHost(false);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinByCode = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const joinedSession = await gameSessionService.joinByInviteCode(code);
      setSession(joinedSession);
      setIsHost(false);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveSession = useCallback(async () => {
    try {
      await gameSessionService.leaveSession();
    } finally {
      setSession(null);
      setIsHost(false);
      setIsConnected(false);
    }
  }, []);

  const findSessions = useCallback(async (gameId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await gameSessionService.findAvailableSessions(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find sessions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    isHost,
    isConnected,
    status: session?.status ?? null,
    error,
    loading,
    createSession,
    joinSession,
    joinByCode,
    leaveSession,
    findSessions,
  };
}
