/**
 * Fusion Lab Arcade - Main Export
 */

export { ArcadeContainer } from './components/ArcadeContainer';
export { GameSelector } from './components/GameSelector';
export { GameCanvas } from './components/GameCanvas';

export * from './types';
export { storage } from './utils/storage';
export { DrawHelpers } from './utils/drawHelpers';

// Games
import { CableRouterGame } from './games/CableRouter';
import type { GameMetadata, GameRegistry } from './types';

// Game metadata registry
export const GAME_METADATA: GameMetadata[] = [
  {
    id: 'cable-router',
    name: 'Cable Router',
    number: '01',
    originalGame: 'Snake (1976)',
    difficulty: 'simple',
    estimatedTime: '2-3 hours',
    genre: 'Arcade / Puzzle',
    description: 'Route the cable through the grid',
  },
  // More games will be added here
];

// Game factory registry
export const GAME_REGISTRY: GameRegistry = {
  'cable-router': () => new CableRouterGame(),
  // More games will be registered here
};
