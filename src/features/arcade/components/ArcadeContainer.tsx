/**
 * Fusion Lab Arcade - Container Component
 * Main arcade container with flip animation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSelector } from './GameSelector';
import { GameCanvas } from './GameCanvas';
import type { BaseGameEngine, GameMetadata } from '../types';

interface ArcadeContainerProps {
  isOpen: boolean;
  onClose: () => void;
  games: GameMetadata[];
  gameRegistry: Record<string, () => BaseGameEngine>;
}

export const ArcadeContainer: React.FC<ArcadeContainerProps> = ({
  isOpen,
  onClose,
  games,
  gameRegistry,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameInstance, setGameInstance] = useState<BaseGameEngine | null>(null);

  const handleSelectGame = (gameId: string) => {
    const gameFactory = gameRegistry[gameId];
    if (gameFactory) {
      const instance = gameFactory();
      setGameInstance(instance);
      setSelectedGameId(gameId);
    }
  };

  const handleBackToMenu = () => {
    if (gameInstance) {
      gameInstance.cleanup();
    }
    setGameInstance(null);
    setSelectedGameId(null);
  };

  const handleClose = () => {
    if (gameInstance) {
      gameInstance.cleanup();
    }
    setGameInstance(null);
    setSelectedGameId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black"
        >
          <div className="w-full h-full relative">
            {/* Game Selector or Game Canvas */}
            {!selectedGameId || !gameInstance ? (
              <GameSelector
                games={games}
                onSelectGame={handleSelectGame}
                onClose={handleClose}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black">
                {/* Game Info Header */}
                <div className="mb-4 text-center font-mono text-white">
                  <h2 className="text-2xl font-bold tracking-wider mb-1">
                    {games.find(g => g.id === selectedGameId)?.name}
                  </h2>
                  <p className="text-sm text-white/40">
                    Simulation #{games.find(g => g.id === selectedGameId)?.number}
                  </p>
                </div>

                {/* Game Canvas */}
                <div className="relative">
                  <GameCanvas game={gameInstance} width={800} height={500} />
                </div>

                {/* Controls */}
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleBackToMenu}
                    className="px-6 py-2 border border-white/20 hover:border-white/60 hover:bg-white/10 text-white font-mono text-sm transition-colors"
                  >
                    [ESC] Back to Menu
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 border border-white/20 hover:border-white/60 hover:bg-white/10 text-white font-mono text-sm transition-colors"
                  >
                    × Close Arcade
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
