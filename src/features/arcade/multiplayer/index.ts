/**
 * Multiplayer Arcade Module
 * Real-time game sessions via Supabase
 */

export * from './types';
export { gameSessionService } from './GameSessionService';
export { MultiplayerPongGame } from './MultiplayerPong';
export { GameLobby } from './components/GameLobby';
export { useGameSession } from './hooks/useGameSession';
