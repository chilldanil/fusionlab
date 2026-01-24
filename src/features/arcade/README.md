# Fusion Lab Arcade

Engineering blueprint style arcade games integrated into the Fusion Lab footer.

## Architecture

The arcade system is built with a modular architecture that allows easy addition of new games:

### Core Components

- **ArcadeContainer** - Main container with flip animation and game management
- **GameSelector** - Menu interface for selecting games
- **GameCanvas** - Canvas renderer for game engines

### Game Engine System

Each game implements the `BaseGameEngine` interface:

```typescript
interface BaseGameEngine {
  metadata: GameMetadata;
  controls: GameControls;

  // Lifecycle
  init(context: GameContext): void;
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  cleanup(): void;

  // Game loop
  update(deltaTime: number): void;
  render(): void;

  // Events
  handleKeyDown(event: KeyboardEvent): void;
  handleKeyUp(event: KeyboardEvent): void;

  // State
  getState(): GameState;
  getScore(): GameScore;
}
```

### Visual Style

All games follow the engineering blueprint aesthetic:

- **Background**: Black (#000000)
- **Primary Color**: White (#FFFFFF)
- **Accent Color**: Green (#00FF00) - optional
- **Font**: 'JetBrains Mono', 'Roboto Mono', monospace
- **Line Width**: 1-2px
- **Style**: Wireframe / Vector graphics / 70s-80s arcade

### Game States

- `idle` - Start screen
- `playing` - Active gameplay
- `paused` - Game paused
- `gameover` - Game over screen

## Current Games

### 01. Cable Router (Snake)
- Classic snake game in blueprint style
- Control the cable, collect nodes, avoid collisions
- **Controls**: Arrow keys or WASD

### 02. Block Demolition (Breakout)
- Destroy all blocks with the ball
- Different block types with varying durability (1-3 hits)
- Indestructible blocks appear on higher levels
- Mouse or keyboard control for paddle
- **Controls**: Mouse movement or ←→ arrows, SPACE to launch ball

### 03. Vector Defense (Space Invaders)
- Defend against waves of invaders
- Three enemy types: Drones (10pts), Cruisers (20pts), Commanders (30pts)
- Destructible shelters provide cover
- Bonus ships appear periodically
- Progressive difficulty with each wave
- **Controls**: ←→ to move, SPACE/↑/W to fire

### 04. Void Drift (Asteroids)
- Navigate through asteroid fields with inertial physics
- Rotate and thrust ship with realistic momentum
- Three asteroid sizes that split when destroyed (Large→Medium→Small)
- UFO enemies with different behaviors (Large: random, Small: tracking)
- Hyperspace jump with 20% chance of instant death
- Torus topology (wrap-around edges)
- **Controls**: ←→ to rotate, ↑/W for thrust, SPACE to fire, SHIFT for hyperspace

### 05. Dual Axis (Pong)
- Classic two-player competition
- Single player vs AI or two-player mode
- First to 11 wins (with 2-point advantage)
- Ball speed increases with each hit
- Paddle hit position affects ball angle
- **Controls**: Player 1: W/S, Player 2: ↑/↓, Press 1 for AI or 2 for human

### 06. Shaft Climber (Doodle Jump)
- Vertical endless climber with procedural generation
- Five platform types: Normal, Moving, Breaking, Spring (2× jump), Disappearing
- Automatic jump on platform landing
- Horizontal wrap-around movement
- Progressive difficulty with height
- Height-based scoring system
- **Controls**: ←→ to move, auto-jump on landing

### 07. Scaffold Run (Donkey Kong)
- Classic platform climber with obstacles
- Multi-level scaffolding structure with ladders
- Rolling barrels that follow platforms and descend ladders
- Climb ladders and jump over obstacles
- Collectible bonus items
- Reach the exit at the top to progress
- **Controls**: ←→ to move, ↑ to climb/jump, ↓ to descend, SPACE to jump

### 08. Grid Maze (Pac-Man)
- Navigate maze and collect all dots
- Four ghosts with unique AI behaviors:
  - Shadow: Direct pursuit
  - Speedy: Ambush ahead of player
  - Bashful: Complex flanking
  - Pokey: Contextual chase/retreat
- Power pellets enable eating ghosts (200-1600 pts combo)
- Three ghost modes: Chase, Scatter, Frightened
- Wrap-around tunnel passages
- Level progression with increasing difficulty
- **Controls**: ←→↑↓ to navigate, SPACE to start/pause

### 09. Crossing Protocol (Frogger)
- Multi-zone crossing challenge
- 5 vehicle lanes with varying speeds and types
- 5 river lanes with platforms and diving obstacles
- 5 goal slots to fill
- 60-second time limit per round
- Hop animation system
- Platform riding mechanics
- Time bonus scoring
- **Controls**: ←→↑↓ to hop, SPACE to start

### 10. Soft Landing (Lunar Lander)
- Physics-based lunar lander simulation
- Realistic inertial dynamics with rotation and thrust
- Procedural terrain generation
- Multiple landing pads with score multipliers (×1, ×2, ×3)
- Fuel management system
- Instrument panel with real-time telemetry:
  - Altitude, vertical/horizontal velocity
  - Angle, fuel percentage
  - Status warnings
- Landing criteria: Speed < 2 m/s, Angle < 15°
- Fuel bonus and accuracy scoring
- **Controls**: ←→ to rotate, ↑/SPACE for thrust

## Adding New Games

1. Create a new game class in `src/features/arcade/games/`
2. Implement the `BaseGameEngine` interface
3. Register the game in `src/features/arcade/index.ts`:

```typescript
// Add metadata
export const GAME_METADATA: GameMetadata[] = [
  // ...existing games
  {
    id: 'your-game',
    name: 'Your Game',
    number: '02',
    originalGame: 'Original (Year)',
    difficulty: 'simple',
    estimatedTime: '2-3 hours',
    genre: 'Genre',
    description: 'Description',
  },
];

// Register factory
export const GAME_REGISTRY: GameRegistry = {
  // ...existing games
  'your-game': () => new YourGame(),
};
```

## Utilities

### DrawHelpers

Utility class for blueprint-style drawing:

```typescript
const draw = new DrawHelpers(ctx);

draw.text('Hello', x, y, size);
draw.rect(x, y, width, height);
draw.circle(x, y, radius);
draw.line(x1, y1, x2, y2);
draw.grid(width, height, cellSize);
```

### Storage

localStorage utilities for high scores:

```typescript
import { storage } from './utils/storage';

storage.getHighScore('game-id');
storage.setHighScore('game-id', score);
storage.getAllHighScores();
```

## Integration

The arcade is integrated into the Footer component:

```tsx
<ArcadeContainer
  isOpen={arcadeOpen}
  onClose={() => setArcadeOpen(false)}
  games={GAME_METADATA}
  gameRegistry={GAME_REGISTRY}
/>
```

## Game Progress

The complete arcade collection of 10 classic games:

1. ✅ Cable Router (Snake)
2. ✅ Block Demolition (Breakout)
3. ✅ Vector Defense (Space Invaders)
4. ✅ Void Drift (Asteroids)
5. ✅ Dual Axis (Pong)
6. ✅ Shaft Climber (Doodle Jump)
7. ✅ Scaffold Run (Donkey Kong)
8. ✅ Grid Maze (Pac-Man)
9. ✅ Crossing Protocol (Frogger)
10. ✅ Soft Landing (Lunar Lander)

**Status**: ✅ **100% COMPLETE** - All 10 games implemented!

**Total Lines of Code**: ~6,500 lines
**Total Features**:
- 10 fully playable games
- Unified game engine architecture
- Blueprint/wireframe visual style
- High score persistence
- Comprehensive controls
- Professional game mechanics
