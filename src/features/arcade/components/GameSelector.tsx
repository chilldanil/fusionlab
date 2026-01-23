/**
 * Fusion Lab Arcade - Game Selector Component
 * Menu for selecting arcade games
 */

import { useEffect } from 'react';
import type { GameMetadata } from '../types';

interface GameSelectorProps {
  games: GameMetadata[];
  onSelectGame: (gameId: string) => void;
  onClose: () => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  games,
  onSelectGame,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Number keys 0-9 for game selection
      const num = parseInt(e.key, 10);
      if (!isNaN(num)) {
        const index = num === 0 ? 9 : num - 1; // 0 maps to 10th game
        if (index >= 0 && index < games.length) {
          onSelectGame(games[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [games, onSelectGame, onClose]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black text-white font-mono">
      <div className="max-w-3xl w-full px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 tracking-wider">
            FUSION LAB ARCADE
          </h1>
          <div className="text-white/40 text-sm">
            ─────────────────────────────────
          </div>
          <p className="mt-4 text-white/60">Select simulation:</p>
        </div>

        {/* Game List */}
        <div className="space-y-2 mb-8">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/30 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-white/40 font-bold min-w-[2rem]">
                    [{index === 9 ? 0 : index + 1}]
                  </span>
                  <span className="font-bold">{game.name}</span>
                </div>
                <span className="text-white/40 text-sm group-hover:text-white/60">
                  {game.originalGame}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-white/40 text-sm space-y-1">
          <p>Press [1-9, 0] to select game</p>
          <p>[ESC] to return</p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center border border-white/20 hover:border-white/60 hover:bg-white/10 transition-colors text-xl"
          aria-label="Close arcade"
        >
          ×
        </button>
      </div>
    </div>
  );
};
