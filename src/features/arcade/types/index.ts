/**
 * Fusion Lab Arcade - Type Definitions
 * Engineering blueprint style arcade games
 */

export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameMetadata {
  id: string;
  name: string;
  number: string; // e.g., "01", "02"
  originalGame: string; // e.g., "Snake (1976)"
  difficulty: 'simple' | 'medium' | 'complex';
  estimatedTime: string; // e.g., "2-3 hours"
  genre: string;
  description: string;
}

export interface GameControls {
  [key: string]: string; // e.g., { "SPACE": "start", "ESC": "pause" }
}

export interface GameScore {
  current: number;
  high: number;
  lastUpdated?: Date;
}

export interface GameContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  state: GameState;
  score: GameScore;
  lives?: number;
  level?: number;
}

export interface BaseGameEngine {
  metadata: GameMetadata;
  controls: GameControls;

  // Lifecycle methods
  init: (context: GameContext) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  cleanup: () => void;

  // Game loop
  update: (deltaTime: number) => void;
  render: () => void;

  // Event handlers
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;

  // State management
  getState: () => GameState;
  getScore: () => GameScore;
}

export interface ArcadeConfig {
  backgroundColor: string; // Default: #000000
  primaryColor: string; // Default: #FFFFFF
  accentColor?: string; // Default: #00FF00
  fontFamily: string; // Default: 'JetBrains Mono', 'Roboto Mono', monospace
  lineWidth: number; // Default: 1-2px
}

export const DEFAULT_ARCADE_CONFIG: ArcadeConfig = {
  backgroundColor: '#000000',
  primaryColor: '#FFFFFF',
  accentColor: '#00FF00',
  fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
  lineWidth: 2,
};

// Game registry type
export type GameRegistry = {
  [key: string]: () => BaseGameEngine;
};
