/**
 * Fusion Lab Arcade - Crossing Protocol (Frogger Clone)
 * Game #09 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Vehicle {
  x: number;
  lane: number;
  width: number;
  speed: number;
}

interface Platform {
  x: number;
  lane: number;
  width: number;
  speed: number;
  diving: boolean;
  diveTimer: number;
}

interface GoalSlot {
  x: number;
  filled: boolean;
}

export class CrossingProtocolGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'crossing-protocol',
    name: 'CROSSING PROTOCOL',
    number: '09',
    originalGame: 'Frogger (1981)',
    difficulty: 'medium',
    estimatedTime: '4-5 hours',
    genre: 'Arcade / Puzzle',
    description: 'Cross the active construction zone',
  };

  controls: GameControls = {
    'ArrowUp': 'Hop forward',
    'ArrowDown': 'Hop backward',
    'ArrowLeft': 'Hop left',
    'ArrowRight': 'Hop right',
    'W': 'Hop forward',
    'S': 'Hop backward',
    'A': 'Hop left',
    'D': 'Hop right',
    ' ': 'Start',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  private readonly CELL_SIZE = 28;
  private readonly ROWS = 14;
  private readonly COLS = 15;

  private playerX = 7;
  private playerY = 13;
  private vehicles: Vehicle[] = [];
  private platforms: Platform[] = [];
  private goalSlots: GoalSlot[] = [];
  private lives = 3;
  private round = 1;
  private timeLeft = 60;
  private lastTimeUpdate = 0;
  private isHopping = false;
  private hopProgress = 0;
  private hopStartX = 0;
  private hopStartY = 0;
  private hopTargetX = 0;
  private hopTargetY = 0;

  private draw!: DrawHelpers;

  init(context: GameContext): void {
    this.ctx = context.ctx;
    this.canvas = context.canvas;
    this.width = context.width;
    this.height = context.height;
    this.score = storage.getGameScore(this.metadata.id);
    this.draw = new DrawHelpers(this.ctx);

    this.resetGame();
  }

  private resetGame(): void {
    this.lives = 3;
    this.round = 1;
    this.resetRound();
  }

  private resetRound(): void {
    this.playerX = 7;
    this.playerY = 13;
    this.timeLeft = 60;
    this.lastTimeUpdate = performance.now();
    this.isHopping = false;

    // Create vehicles (lanes 8-12)
    this.vehicles = [];
    for (let lane = 8; lane <= 12; lane++) {
      const direction = lane % 2 === 0 ? 1 : -1;
      const speed = (1 + Math.random() * 0.5) * direction;
      const numVehicles = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < numVehicles; i++) {
        const width = lane === 10 ? 3 : lane === 11 ? 4 : 2;
        this.vehicles.push({
          x: (this.COLS / numVehicles) * i + Math.random() * 3,
          lane,
          width,
          speed,
        });
      }
    }

    // Create platforms (lanes 2-6)
    this.platforms = [];
    for (let lane = 2; lane <= 6; lane++) {
      const direction = lane % 2 === 0 ? -1 : 1;
      const speed = (0.5 + Math.random() * 0.3) * direction;
      const numPlatforms = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < numPlatforms; i++) {
        const width = 2 + Math.floor(Math.random() * 2);
        const isDiving = lane === 4 && Math.random() < 0.5;

        this.platforms.push({
          x: (this.COLS / numPlatforms) * i,
          lane,
          width,
          speed,
          diving: isDiving,
          diveTimer: isDiving ? 3000 + Math.random() * 2000 : 0,
        });
      }
    }

    // Create goal slots
    this.goalSlots = [
      { x: 1, filled: false },
      { x: 4, filled: false },
      { x: 7, filled: false },
      { x: 10, filled: false },
      { x: 13, filled: false },
    ];
  }

  start(): void {
    if (this.state === 'idle') {
      this.state = 'playing';
      this.score.current = 0;
      this.resetGame();
    }
  }

  pause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  restart(): void {
    this.state = 'playing';
    this.score.current = 0;
    this.resetGame();
  }

  cleanup(): void {}

  update(deltaTime: number): void {
    if (this.state !== 'playing') return;

    const currentTime = performance.now();

    // Update time
    if (currentTime - this.lastTimeUpdate > 1000) {
      this.timeLeft--;
      this.lastTimeUpdate = currentTime;

      if (this.timeLeft <= 0) {
        this.loseLife();
        return;
      }
    }

    // Update hop animation
    if (this.isHopping) {
      this.hopProgress += deltaTime / 150;
      if (this.hopProgress >= 1) {
        this.hopProgress = 1;
        this.isHopping = false;
        this.playerX = this.hopTargetX;
        this.playerY = this.hopTargetY;

        // Check if landed in water
        if (this.playerY >= 2 && this.playerY <= 6) {
          if (!this.isOnPlatform()) {
            this.loseLife();
            return;
          }
        }

        // Check if reached goal
        if (this.playerY === 0) {
          this.checkGoal();
        }

        // Check if out of bounds
        if (this.playerX < 0 || this.playerX >= this.COLS) {
          this.loseLife();
          return;
        }
      }
      return;
    }

    // Update vehicles
    for (const vehicle of this.vehicles) {
      vehicle.x += vehicle.speed * (deltaTime / 100);

      if (vehicle.speed > 0 && vehicle.x > this.COLS + vehicle.width) {
        vehicle.x = -vehicle.width;
      } else if (vehicle.speed < 0 && vehicle.x < -vehicle.width) {
        vehicle.x = this.COLS + vehicle.width;
      }
    }

    // Update platforms
    for (const platform of this.platforms) {
      platform.x += platform.speed * (deltaTime / 100);

      if (platform.speed > 0 && platform.x > this.COLS + platform.width) {
        platform.x = -platform.width;
      } else if (platform.speed < 0 && platform.x < -platform.width) {
        platform.x = this.COLS + platform.width;
      }

      // Diving platforms
      if (platform.diving) {
        platform.diveTimer -= deltaTime;
        if (platform.diveTimer <= 0) {
          platform.diveTimer = 5000;
        }
      }
    }

    // Move player with platform
    if (this.playerY >= 2 && this.playerY <= 6) {
      const platform = this.findPlatformAt(this.playerX, this.playerY);
      if (platform) {
        this.playerX += platform.speed * (deltaTime / 100);

        // Check if pushed off edge
        if (this.playerX < -0.5 || this.playerX > this.COLS + 0.5) {
          this.loseLife();
          return;
        }
      }
    }

    // Check vehicle collision
    if (this.playerY >= 8 && this.playerY <= 12) {
      for (const vehicle of this.vehicles) {
        if (vehicle.lane === this.playerY) {
          if (
            this.playerX >= vehicle.x &&
            this.playerX <= vehicle.x + vehicle.width
          ) {
            this.loseLife();
            return;
          }
        }
      }
    }
  }

  private isOnPlatform(): boolean {
    return this.findPlatformAt(this.playerX, this.playerY) !== null;
  }

  private findPlatformAt(x: number, y: number): Platform | null {
    for (const platform of this.platforms) {
      if (platform.lane === y) {
        // Check if platform is diving
        if (platform.diving && platform.diveTimer < 2000) {
          continue;
        }

        if (x >= platform.x && x <= platform.x + platform.width) {
          return platform;
        }
      }
    }
    return null;
  }

  private hop(direction: Direction): void {
    if (this.isHopping) return;

    this.hopStartX = this.playerX;
    this.hopStartY = this.playerY;

    switch (direction) {
      case 'up':
        this.hopTargetX = this.playerX;
        this.hopTargetY = Math.max(0, this.playerY - 1);
        break;
      case 'down':
        this.hopTargetX = this.playerX;
        this.hopTargetY = Math.min(13, this.playerY + 1);
        break;
      case 'left':
        this.hopTargetX = Math.max(0, this.playerX - 1);
        this.hopTargetY = this.playerY;
        break;
      case 'right':
        this.hopTargetX = Math.min(this.COLS - 1, this.playerX + 1);
        this.hopTargetY = this.playerY;
        break;
    }

    this.isHopping = true;
    this.hopProgress = 0;
  }

  private checkGoal(): void {
    for (const slot of this.goalSlots) {
      if (Math.abs(this.playerX - slot.x) < 0.5 && !slot.filled) {
        slot.filled = true;
        this.score.current += 50 + Math.floor(this.timeLeft * 0.1);

        // Check if all slots filled
        if (this.goalSlots.every(s => s.filled)) {
          this.round++;
          this.score.current += 1000;
          this.resetRound();
        } else {
          // Reset player position
          this.playerX = 7;
          this.playerY = 13;
        }
        return;
      } else if (Math.abs(this.playerX - slot.x) < 0.5 && slot.filled) {
        // Jumped into filled slot
        this.loseLife();
        return;
      }
    }

    // Jumped into non-slot area
    this.loseLife();
  }

  private loseLife(): void {
    this.lives--;

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.playerX = 7;
      this.playerY = 13;
      this.isHopping = false;
    }
  }

  private gameOver(): void {
    this.state = 'gameover';
    storage.setHighScore(this.metadata.id, this.score.current);
    this.score.high = storage.getHighScore(this.metadata.id);
  }

  render(): void {
    this.draw.clear(this.width, this.height);

    if (this.state === 'idle') {
      this.renderStartScreen();
    } else if (this.state === 'playing' || this.state === 'paused') {
      this.renderGame();
      if (this.state === 'paused') {
        this.renderPauseScreen();
      }
    } else if (this.state === 'gameover') {
      this.renderGame();
      this.renderGameOverScreen();
    }
  }

  private renderStartScreen(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('FUSION LAB ARCADE', centerX, centerY - 100, 20);
    this.draw.textCentered('─────────────────', centerX, centerY - 70, 14);
    this.draw.textCentered('CROSSING PROTOCOL', centerX, centerY - 30, 26);
    this.draw.textCentered('Simulation #09', centerX, centerY + 10, 14);

    this.draw.textCentered('Cross the active construction zone', centerX, centerY + 50, 13);
    this.draw.textCentered('Reach all safety points', centerX, centerY + 70, 13);

    this.draw.textCentered('[←→↑↓] to hop', centerX, centerY + 105, 16);
    this.draw.textCentered('[SPACE] to start', centerX, centerY + 130, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    const offsetX = (this.width - this.COLS * this.CELL_SIZE) / 2;
    const offsetY = 80;

    // Draw zones
    // Goal zone (row 0)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(offsetX, offsetY, this.COLS * this.CELL_SIZE, this.CELL_SIZE);

    // River zone (rows 2-6)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.fillRect(offsetX, offsetY + 2 * this.CELL_SIZE, this.COLS * this.CELL_SIZE, 5 * this.CELL_SIZE);

    // Safe zone (row 7)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(offsetX, offsetY + 7 * this.CELL_SIZE, this.COLS * this.CELL_SIZE, this.CELL_SIZE);

    // Road zone (rows 8-12)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.fillRect(offsetX, offsetY + 8 * this.CELL_SIZE, this.COLS * this.CELL_SIZE, 5 * this.CELL_SIZE);

    // Draw lane dividers
    for (let i = 1; i < this.ROWS; i++) {
      if (i !== 1 && i !== 7 && i !== 13) {
        this.draw.dashedLine(
          offsetX,
          offsetY + i * this.CELL_SIZE,
          offsetX + this.COLS * this.CELL_SIZE,
          offsetY + i * this.CELL_SIZE,
          [10, 5],
          0.5
        );
      }
    }

    // Draw goal slots
    for (const slot of this.goalSlots) {
      const x = offsetX + slot.x * this.CELL_SIZE;
      const y = offsetY;

      if (slot.filled) {
        this.draw.text('☑', x + 5, y + 3, 16);
      } else {
        this.draw.rect(x + 2, y + 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4, 1);
        const pulse = Math.sin(performance.now() / 300) * 0.3 + 0.7;
        this.ctx.save();
        this.ctx.globalAlpha = pulse;
        this.draw.text('PAD', x + 4, y + 8, 10);
        this.ctx.restore();
      }
    }

    // Draw platforms
    for (const platform of this.platforms) {
      const x = offsetX + platform.x * this.CELL_SIZE;
      const y = offsetY + platform.lane * this.CELL_SIZE;
      const w = platform.width * this.CELL_SIZE;

      const isDiving = platform.diving && platform.diveTimer < 2000;
      const isFlashing = platform.diving && platform.diveTimer < 3000 && platform.diveTimer >= 2000;

      if (isDiving) continue;

      if (isFlashing && Math.floor(performance.now() / 100) % 2 === 0) {
        continue;
      }

      // Platform rectangle
      this.draw.rect(x, y + 4, w, this.CELL_SIZE - 8, 2);

      // Hatching
      for (let i = 0; i < w; i += 8) {
        this.draw.line(x + i, y + 4, x + i, y + this.CELL_SIZE - 4, 1);
      }
    }

    // Draw vehicles
    for (const vehicle of this.vehicles) {
      const x = offsetX + vehicle.x * this.CELL_SIZE;
      const y = offsetY + vehicle.lane * this.CELL_SIZE;
      const w = vehicle.width * this.CELL_SIZE;

      // Vehicle body
      this.draw.rect(x, y + 6, w, this.CELL_SIZE - 12, 2);

      // Wheels
      this.draw.circle(x + 4, y + this.CELL_SIZE - 4, 3, 1);
      this.draw.circle(x + w - 4, y + this.CELL_SIZE - 4, 3, 1);

      // Cab indicator
      this.draw.rect(x + w - 8, y + 8, 6, this.CELL_SIZE - 16, 1);
    }

    // Draw player
    let px = this.playerX;
    let py = this.playerY;

    if (this.isHopping) {
      const t = this.hopProgress;
      px = this.hopStartX + (this.hopTargetX - this.hopStartX) * t;
      py = this.hopStartY + (this.hopTargetY - this.hopStartY) * t;
    }

    const playerScreenX = offsetX + px * this.CELL_SIZE;
    const playerScreenY = offsetY + py * this.CELL_SIZE;

    // Player as square with cross
    this.draw.rect(
      playerScreenX + 4,
      playerScreenY + 4,
      this.CELL_SIZE - 8,
      this.CELL_SIZE - 8,
      2
    );
    this.draw.line(
      playerScreenX + 10,
      playerScreenY + 10,
      playerScreenX + this.CELL_SIZE - 10,
      playerScreenY + this.CELL_SIZE - 10,
      1
    );
    this.draw.line(
      playerScreenX + this.CELL_SIZE - 10,
      playerScreenY + 10,
      playerScreenX + 10,
      playerScreenY + this.CELL_SIZE - 10,
      1
    );

    // UI
    this.draw.text('CROSSING PROTOCOL', 10, 10, 12);
    this.draw.text(`SCORE: ${this.score.current}`, this.width / 2 - 60, 10, 14);
    this.draw.text(`TIME: ${this.timeLeft}`, this.width - 100, 10, 14);

    let livesText = 'LIVES: ';
    for (let i = 0; i < this.lives; i++) {
      livesText += '■ ';
    }
    this.draw.text(livesText, 10, 30, 12);
    this.draw.text(`ROUND: ${this.round}`, this.width - 100, 30, 12);
  }

  private renderPauseScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('PAUSED', centerX, centerY - 20, 32);
    this.draw.textCentered('[SPACE] to continue', centerX, centerY + 30, 16);
  }

  private renderGameOverScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('PROTOCOL FAILED', centerX, centerY - 80, 24);
    this.draw.textCentered('───────────────', centerX, centerY - 50, 14);
    this.draw.textCentered(`Final score: ${this.score.current}`, centerX, centerY - 10, 20);
    this.draw.textCentered(`Rounds completed: ${this.round - 1}`, centerX, centerY + 20, 18);

    if (this.score.current >= this.score.high) {
      this.draw.textCentered('NEW HIGH SCORE!', centerX, centerY + 60, 16);
    } else {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, centerY + 60, 14);
    }

    this.draw.textCentered('[SPACE] to retry', centerX, centerY + 100, 16);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    if (key === ' ') {
      if (this.state === 'idle' || this.state === 'gameover') {
        this.restart();
      } else if (this.state === 'paused') {
        this.resume();
      } else if (this.state === 'playing') {
        this.pause();
      }
      return;
    }

    if (key === 'Escape' || key === 'p' || key === 'P') {
      if (this.state === 'playing') {
        this.pause();
      } else if (this.state === 'paused') {
        this.resume();
      }
      return;
    }

    if (this.state !== 'playing' || this.isHopping) return;

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.hop('up');
    }
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.hop('down');
    }
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.hop('left');
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.hop('right');
    }
  }

  handleKeyUp(_event: KeyboardEvent): void {}

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
