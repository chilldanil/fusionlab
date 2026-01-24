/**
 * Game Lobby Component
 * UI for finding and creating multiplayer game sessions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSessionService } from '../GameSessionService';
import type { GameSession } from '../types';

interface GameLobbyProps {
  gameId: string;
  gameName: string;
  onJoinSession: (session: GameSession, isHost: boolean) => void;
  onClose: () => void;
}

type LobbyTab = 'quick' | 'browse' | 'private';

export function GameLobby({ gameId, gameName, onJoinSession, onClose }: GameLobbyProps) {
  const [activeTab, setActiveTab] = useState<LobbyTab>('quick');
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [createdSession, setCreatedSession] = useState<GameSession | null>(null);

  // Load available sessions
  useEffect(() => {
    if (activeTab === 'browse') {
      loadSessions();
    }
  }, [activeTab, gameId]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const available = await gameSessionService.findAvailableSessions(gameId);
      setSessions(available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to find existing session
      const available = await gameSessionService.findAvailableSessions(gameId);

      if (available.length > 0) {
        // Join first available
        const session = await gameSessionService.joinSession(available[0].id);
        onJoinSession(session, false);
      } else {
        // Create new public session
        const session = await gameSessionService.createSession({
          gameId,
          isPrivate: false,
        });
        onJoinSession(session, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find match');
      setLoading(false);
    }
  };

  const handleCreatePrivate = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await gameSessionService.createSession({
        gameId,
        isPrivate: true,
      });
      setCreatedSession(session);
      onJoinSession(session, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (inviteCode.length !== 6) {
      setError('Enter 6-character code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await gameSessionService.joinByInviteCode(inviteCode);
      onJoinSession(session, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const session = await gameSessionService.joinSession(sessionId);
      onJoinSession(session, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-neutral-900 border border-neutral-700 rounded-lg w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-neutral-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-mono font-bold text-white">{gameName}</h2>
              <p className="text-sm text-neutral-400">Online Multiplayer</p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {(['quick', 'browse', 'private'] as LobbyTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {tab === 'quick' && 'Quick Match'}
                {tab === 'browse' && 'Browse'}
                {tab === 'private' && 'Private'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 min-h-[300px]">
          <AnimatePresence mode="wait">
            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded mb-4 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Quick Match */}
            {activeTab === 'quick' && (
              <motion.div
                key="quick"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center h-64"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-neutral-400">
                    Find an opponent or create a new game
                  </p>
                </div>
                <button
                  onClick={handleQuickMatch}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-mono px-8 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      Find Match
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Browse Sessions */}
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-neutral-400">
                    {sessions.length} game{sessions.length !== 1 ? 's' : ''} available
                  </span>
                  <button
                    onClick={loadSessions}
                    disabled={loading}
                    className="text-sm text-neutral-400 hover:text-white"
                  >
                    ↻ Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-neutral-400">
                    Loading...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-400 mb-4">No games available</p>
                    <button
                      onClick={handleQuickMatch}
                      className="text-green-400 hover:text-green-300"
                    >
                      Create one →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-neutral-800 rounded p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-white">
                            {session.host?.fullName ?? 'Unknown'}
                          </div>
                          <div className="text-xs text-neutral-400">
                            Level {Math.floor((session.host?.xp ?? 0) / 100) + 1}
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinSession(session.id)}
                          disabled={loading}
                          className="bg-white text-black px-4 py-1 rounded font-mono text-sm hover:bg-neutral-200 transition-colors"
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Private Game */}
            {activeTab === 'private' && (
              <motion.div
                key="private"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Create Private */}
                <div className="bg-neutral-800 rounded-lg p-4">
                  <h3 className="font-mono text-white mb-2">Create Private Game</h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    Get a code to share with a friend
                  </p>
                  <button
                    onClick={handleCreatePrivate}
                    disabled={loading}
                    className="w-full bg-white text-black py-2 rounded font-mono hover:bg-neutral-200 transition-colors"
                  >
                    Create Game
                  </button>
                </div>

                {/* Join with Code */}
                <div className="bg-neutral-800 rounded-lg p-4">
                  <h3 className="font-mono text-white mb-2">Join with Code</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="XXXXXX"
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 font-mono text-center text-xl tracking-widest focus:outline-none focus:border-white"
                      maxLength={6}
                    />
                    <button
                      onClick={handleJoinWithCode}
                      disabled={loading || inviteCode.length !== 6}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white px-4 rounded font-mono transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-700 p-4">
          <p className="text-xs text-neutral-500 text-center">
            Win games to earn XP and level up!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
