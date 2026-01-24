/**
 * Fusion Lab Arcade - Main Export
 */

export { ArcadeContainer } from './components/ArcadeContainer';
export { GameSelector } from './components/GameSelector';
export { GameCanvas } from './components/GameCanvas';

export * from './types';
export { storage } from './utils/storage';
export { DrawHelpers } from './utils/drawHelpers';

// Multiplayer exports
export { GameLobby } from './multiplayer/components/GameLobby';
export { gameSessionService } from './multiplayer/GameSessionService';
export { MultiplayerPongGame } from './multiplayer/MultiplayerPong';
export * from './multiplayer/types';

// Games
import { CableRouterGame } from './games/CableRouter';
import { BlockDemolitionGame } from './games/BlockDemolition';
import { VectorDefenseGame } from './games/VectorDefense';
import { DualAxisGame } from './games/DualAxis';
import { VoidDriftGame } from './games/VoidDrift';
import { ShaftClimberGame } from './games/ShaftClimber';
import { ScaffoldRunGame } from './games/ScaffoldRun';
import { GridMazeGame } from './games/GridMaze';
import { CrossingProtocolGame } from './games/CrossingProtocol';
import { SoftLandingGame } from './games/SoftLanding';
import { MultiplayerPongGame } from './multiplayer/MultiplayerPong';
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
  {
    id: 'block-demolition',
    name: 'Block Demolition',
    number: '02',
    originalGame: 'Breakout / Arkanoid (1976)',
    difficulty: 'simple',
    estimatedTime: '3-4 hours',
    genre: 'Arcade',
    description: 'Break all the blocks',
  },
  {
    id: 'vector-defense',
    name: 'Vector Defense',
    number: '03',
    originalGame: 'Space Invaders (1978)',
    difficulty: 'medium',
    estimatedTime: '4-5 hours',
    genre: 'Shooter',
    description: 'Defend the perimeter',
  },
  {
    id: 'dual-axis',
    name: 'Dual Axis',
    number: '05',
    originalGame: 'Pong (1972)',
    difficulty: 'simple',
    estimatedTime: '2-3 hours',
    genre: 'Sports Arcade',
    description: 'Classic two-player competition',
  },
  {
    id: 'void-drift',
    name: 'Void Drift',
    number: '04',
    originalGame: 'Asteroids (1979)',
    difficulty: 'medium',
    estimatedTime: '5-6 hours',
    genre: 'Arcade Shooter',
    description: 'Clear the debris field',
  },
  {
    id: 'shaft-climber',
    name: 'Shaft Climber',
    number: '06',
    originalGame: 'Doodle Jump (2009) / Icy Tower (2001)',
    difficulty: 'medium',
    estimatedTime: '4-5 hours',
    genre: 'Vertical Platformer',
    description: 'Ascend the elevator shaft',
  },
  {
    id: 'scaffold-run',
    name: 'Scaffold Run',
    number: '07',
    originalGame: 'Donkey Kong (1981)',
    difficulty: 'complex',
    estimatedTime: '6-8 hours',
    genre: 'Platformer',
    description: 'Reach the exit at the top',
  },
  {
    id: 'grid-maze',
    name: 'Grid Maze',
    number: '08',
    originalGame: 'Pac-Man (1980)',
    difficulty: 'complex',
    estimatedTime: '6-8 hours',
    genre: 'Maze / Chase',
    description: 'Clear all data points',
  },
  {
    id: 'crossing-protocol',
    name: 'Crossing Protocol',
    number: '09',
    originalGame: 'Frogger (1981)',
    difficulty: 'medium',
    estimatedTime: '4-5 hours',
    genre: 'Arcade / Puzzle',
    description: 'Cross the active construction zone',
  },
  {
    id: 'soft-landing',
    name: 'Soft Landing',
    number: '10',
    originalGame: 'Lunar Lander (1979)',
    difficulty: 'medium',
    estimatedTime: '5-6 hours',
    genre: 'Simulator / Arcade',
    description: 'Land the module safely',
  },
  {
    id: 'multiplayer-pong',
    name: 'Dual Axis Online',
    number: '05+',
    originalGame: 'Pong (1972)',
    difficulty: 'medium',
    estimatedTime: '5-10 min',
    genre: 'Online Multiplayer',
    description: 'Real-time 2-player competition',
  },
];

// Game factory registry
export const GAME_REGISTRY: GameRegistry = {
  'cable-router': () => new CableRouterGame(),
  'block-demolition': () => new BlockDemolitionGame(),
  'vector-defense': () => new VectorDefenseGame(),
  'dual-axis': () => new DualAxisGame(),
  'void-drift': () => new VoidDriftGame(),
  'shaft-climber': () => new ShaftClimberGame(),
  'scaffold-run': () => new ScaffoldRunGame(),
  'grid-maze': () => new GridMazeGame(),
  'crossing-protocol': () => new CrossingProtocolGame(),
  'soft-landing': () => new SoftLandingGame(),
  'multiplayer-pong': () => new MultiplayerPongGame(),
};
