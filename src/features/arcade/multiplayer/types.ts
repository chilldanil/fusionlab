/**
 * Multiplayer Game Session Types
 */

export type SessionStatus = 'waiting' | 'playing' | 'finished' | 'abandoned';
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface PlayerInfo {
  id: string;
  fullName: string;
  avatarUrl?: string;
  xp: number;
}

export interface GameSession {
  id: string;
  gameId: string;
  hostId: string;
  guestId: string | null;
  status: SessionStatus;
  gameState: Record<string, unknown>;
  hostScore: number;
  guestScore: number;
  winnerId: string | null;
  hostXpEarned: number;
  guestXpEarned: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  maxScore: number;
  isPrivate: boolean;
  inviteCode: string | null;
  // Joined data
  host?: PlayerInfo;
  guest?: PlayerInfo;
}

export interface GameMove {
  id: string;
  sessionId: string;
  playerId: string;
  moveType: string;
  moveData: Record<string, unknown>;
  sequenceNum: number;
  createdAt: string;
}

export interface GameInvite {
  id: string;
  sessionId: string;
  inviterId: string;
  inviteeId: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
  // Joined data
  inviter?: PlayerInfo;
  session?: GameSession;
}

// Real-time sync types
export interface PaddleState {
  y: number;
  direction: 'up' | 'down' | 'none';
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PongGameState {
  ball: BallState;
  hostPaddle: PaddleState;
  guestPaddle: PaddleState;
  hostScore: number;
  guestScore: number;
  servingPlayer: 'host' | 'guest';
  lastUpdate: number;
}

export type PongMoveType = 'paddle_move' | 'ball_sync' | 'score_update' | 'game_start' | 'game_end';

export interface PongMove {
  type: PongMoveType;
  paddleY?: number;
  direction?: 'up' | 'down' | 'none';
  ball?: BallState;
  hostScore?: number;
  guestScore?: number;
  timestamp: number;
}

// Session events for real-time updates
export type SessionEventType =
  | 'player_joined'
  | 'player_left'
  | 'game_started'
  | 'game_finished'
  | 'move_received';

export interface SessionEvent {
  type: SessionEventType;
  sessionId: string;
  playerId?: string;
  data?: unknown;
  timestamp: number;
}

// Callback types
export type SessionCallback = (session: GameSession) => void;
export type MoveCallback = (move: GameMove) => void;
export type EventCallback = (event: SessionEvent) => void;

// Create session options
export interface CreateSessionOptions {
  gameId: string;
  maxScore?: number;
  isPrivate?: boolean;
}

// Database row types (snake_case from Supabase)
export interface GameSessionRow {
  id: string;
  game_id: string;
  host_id: string;
  guest_id: string | null;
  status: SessionStatus;
  game_state: Record<string, unknown>;
  host_score: number;
  guest_score: number;
  winner_id: string | null;
  host_xp_earned: number;
  guest_xp_earned: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  max_score: number;
  is_private: boolean;
  invite_code: string | null;
  // Joined profiles
  host?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    xp: number;
  };
  guest?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    xp: number;
  } | null;
}

export interface GameMoveRow {
  id: string;
  session_id: string;
  player_id: string;
  move_type: string;
  move_data: Record<string, unknown>;
  sequence_num: number;
  created_at: string;
}

// Transform functions
export function transformSession(row: GameSessionRow): GameSession {
  return {
    id: row.id,
    gameId: row.game_id,
    hostId: row.host_id,
    guestId: row.guest_id,
    status: row.status,
    gameState: row.game_state,
    hostScore: row.host_score,
    guestScore: row.guest_score,
    winnerId: row.winner_id,
    hostXpEarned: row.host_xp_earned,
    guestXpEarned: row.guest_xp_earned,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    maxScore: row.max_score,
    isPrivate: row.is_private,
    inviteCode: row.invite_code,
    host: row.host ? {
      id: row.host.id,
      fullName: row.host.full_name,
      avatarUrl: row.host.avatar_url,
      xp: row.host.xp,
    } : undefined,
    guest: row.guest ? {
      id: row.guest.id,
      fullName: row.guest.full_name,
      avatarUrl: row.guest.avatar_url,
      xp: row.guest.xp,
    } : undefined,
  };
}

export function transformMove(row: GameMoveRow): GameMove {
  return {
    id: row.id,
    sessionId: row.session_id,
    playerId: row.player_id,
    moveType: row.move_type,
    moveData: row.move_data,
    sequenceNum: row.sequence_num,
    createdAt: row.created_at,
  };
}
