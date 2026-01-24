/**
 * Fusion Lab Arcade - Scaffold Run (Donkey Kong Clone)
 * Game #07 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  onLadder: boolean;
  climbing: boolean;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Ladder {
  x: number;
  y: number;
  height: number;
}

interface Barrel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
}

interface Bonus {
  x: number;
  y: number;
  points: number;
  collected: boolean;
}

export class ScaffoldRunGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'scaffold-run',
    name: 'SCAFFOLD RUN',
    number: '07',
    originalGame: 'Donkey Kong (1981)',
    difficulty: 'complex',
    estimatedTime: '6-8 hours',
    genre: 'Platformer',
    description: 'Reach the exit at the top',
  };

  controls: GameControls = {
    'ArrowLeft': 'Move left',
    'ArrowRight': 'Move right',
    'ArrowUp': 'Climb / Jump',
    'ArrowDown': 'Descend',
    ' ': 'Jump',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game constants
  private readonly GRAVITY = 0.8;
  private readonly JUMP_FORCE = -13;
  private readonly MOVE_SPEED = 3;
  private readonly CLIMB_SPEED = 2.5;
  private readonly BARREL_SPAWN_INTERVAL = 3000;

  // Game state
  private player!: Player;
  private platforms: Platform[] = [];
  private ladders: Ladder[] = [];
  private barrels: Barrel[] = [];
  private bonuses: Bonus[] = [];
  private lives = 3;
  private level = 1;
  private leftPressed = false;
  private rightPressed = false;
  private upPressed = false;
  private downPressed = false;
  private barrelTimer = 0;
  private exitReached = false;
  private exitX = 0;
  private exitY = 0;

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
    this.level = 1;
    this.resetLevel();
  }

  private resetLevel(): void {
    // Reset player
    this.player = {
      x: 50,
      y: this.height - 80,
      vx: 0,
      vy: 0,
      width: 16,
      height: 24,
      onGround: false,
      onLadder: false,
      climbing: false,
    };

    this.platforms = [];
    this.ladders = [];
    this.barrels = [];
    this.bonuses = [];
    this.barrelTimer = 0;
    this.exitReached = false;

    // Build level structure
    this.buildLevel();
  }

  private buildLevel(): void {
    const platformHeight = 8;
    const platformSpacing = 100;

    // Ground platform
    this.platforms.push({
      x: 0,
      y: this.height - 30,
      width: this.width,
      height: platformHeight,
    });

    // Platform 1 (bottom)
    this.platforms.push({
      x: 0,
      y: this.height - 130,
      width: this.width - 100,
      height: platformHeight,
    });

    // Platform 2
    this.platforms.push({
      x: 100,
      y: this.height - 230,
      width: this.width - 100,
      height: platformHeight,
    });

    // Platform 3
    this.platforms.push({
      x: 0,
      y: this.height - 330,
      width: this.width - 100,
      height: platformHeight,
    });

    // Platform 4 (top)
    this.platforms.push({
      x: 100,
      y: this.height - 430,
      width: this.width - 100,
      height: platformHeight,
    });

    // Exit platform
    this.platforms.push({
      x: this.width / 2 - 50,
      y: 40,
      width: 100,
      height: platformHeight,
    });

    this.exitX = this.width / 2;
    this.exitY = 30;

    // Ladders connecting platforms
    this.ladders.push({ x: this.width - 150, y: this.height - 130, height: 100 });
    this.ladders.push({ x: 150, y: this.height - 230, height: 100 });
    this.ladders.push({ x: this.width - 150, y: this.height - 330, height: 100 });
    this.ladders.push({ x: 150, y: this.height - 430, height: 100 });
    this.ladders.push({ x: this.width / 2, y: 40, height: this.height - 470 });

    // Bonuses
    this.bonuses.push({
      x: this.width / 2,
      y: this.height - 140,
      points: 100,
      collected: false,
    });
    this.bonuses.push({
      x: this.width / 2,
      y: this.height - 340,
      points: 200,
      collected: false,
    });
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

  cleanup(): void {
    // Cleanup if needed
  }

  update(deltaTime: number): void {
    if (this.state !== 'playing') return;

    // Check if player is on ladder
    this.player.onLadder = false;
    for (const ladder of this.ladders) {
      if (
        this.player.x > ladder.x - 10 &&
        this.player.x < ladder.x + 20 &&
        this.player.y + this.player.height > ladder.y &&
        this.player.y < ladder.y + ladder.height
      ) {
        this.player.onLadder = true;
        break;
      }
    }

    // Handle climbing
    if (this.player.onLadder && (this.upPressed || this.downPressed)) {
      this.player.climbing = true;
      this.player.vy = 0;

      if (this.upPressed) {
        this.player.y -= this.CLIMB_SPEED;
      }
      if (this.downPressed) {
        this.player.y += this.CLIMB_SPEED;
      }
    } else {
      this.player.climbing = false;
    }

    // Horizontal movement
    this.player.vx = 0;
    if (this.leftPressed) {
      this.player.vx = -this.MOVE_SPEED;
    }
    if (this.rightPressed) {
      this.player.vx = this.MOVE_SPEED;
    }

    // Apply gravity (not when climbing)
    if (!this.player.climbing) {
      this.player.vy += this.GRAVITY;
    }

    // Update player position
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    // Constrain to screen
    this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));

    // Platform collisions
    this.player.onGround = false;
    for (const platform of this.platforms) {
      if (
        this.player.vy >= 0 &&
        this.player.x + this.player.width > platform.x &&
        this.player.x < platform.x + platform.width &&
        this.player.y + this.player.height >= platform.y &&
        this.player.y + this.player.height <= platform.y + platform.height + 10
      ) {
        this.player.y = platform.y - this.player.height;
        this.player.vy = 0;
        this.player.onGround = true;
        break;
      }
    }

    // Spawn barrels
    this.barrelTimer += deltaTime;
    if (this.barrelTimer >= this.BARREL_SPAWN_INTERVAL) {
      this.barrelTimer = 0;
      this.spawnBarrel();
    }

    // Update barrels
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const barrel = this.barrels[i];

      barrel.x += barrel.vx;
      barrel.y += barrel.vy;
      barrel.rotation += barrel.vx * 2;

      // Apply gravity
      barrel.vy += this.GRAVITY;

      // Platform collisions for barrels
      for (const platform of this.platforms) {
        if (
          barrel.vy >= 0 &&
          barrel.x > platform.x &&
          barrel.x < platform.x + platform.width &&
          barrel.y + barrel.radius >= platform.y &&
          barrel.y + barrel.radius <= platform.y + platform.height + 10
        ) {
          barrel.y = platform.y - barrel.radius;
          barrel.vy = 0;

          // Chance to go down ladder
          if (Math.random() < 0.3) {
            for (const ladder of this.ladders) {
              if (Math.abs(barrel.x - ladder.x) < 20) {
                barrel.vy = 3;
                break;
              }
            }
          }
          break;
        }
      }

      // Bounce off edges
      if (barrel.x < barrel.radius || barrel.x > this.width - barrel.radius) {
        barrel.vx *= -1;
        barrel.x = Math.max(barrel.radius, Math.min(this.width - barrel.radius, barrel.x));
      }

      // Remove if off screen
      if (barrel.y > this.height + 50) {
        this.barrels.splice(i, 1);
      }
    }

    // Check barrel collisions with player
    for (const barrel of this.barrels) {
      const dx = this.player.x + this.player.width / 2 - barrel.x;
      const dy = this.player.y + this.player.height / 2 - barrel.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < barrel.radius + this.player.width / 2) {
        this.loseLife();
        return;
      }
    }

    // Check bonus collection
    for (const bonus of this.bonuses) {
      if (bonus.collected) continue;

      const dx = Math.abs(this.player.x - bonus.x);
      const dy = Math.abs(this.player.y - bonus.y);

      if (dx < 20 && dy < 20) {
        bonus.collected = true;
        this.score.current += bonus.points;
      }
    }

    // Check exit reached
    if (!this.exitReached) {
      const dx = Math.abs(this.player.x - this.exitX);
      const dy = Math.abs(this.player.y - this.exitY);

      if (dx < 30 && dy < 30) {
        this.exitReached = true;
        this.nextLevel();
      }
    }

    // Check if player fell off
    if (this.player.y > this.height) {
      this.loseLife();
    }
  }

  private spawnBarrel(): void {
    this.barrels.push({
      x: this.width - 50,
      y: this.height - 440,
      vx: -3,
      vy: 0,
      radius: 10,
      rotation: 0,
    });
  }

  private loseLife(): void {
    this.lives--;

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.resetLevel();
    }
  }

  private nextLevel(): void {
    this.level++;
    this.score.current += 1000;
    this.resetLevel();
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

    this.draw.textCentered('FUSION LAB ARCADE', centerX, centerY - 120, 20);
    this.draw.textCentered('─────────────────', centerX, centerY - 90, 14);
    this.draw.textCentered('SCAFFOLD RUN', centerX, centerY - 40, 28);
    this.draw.textCentered('Simulation #07', centerX, centerY, 14);

    this.draw.textCentered('Reach the exit', centerX, centerY + 50, 14);
    this.draw.textCentered('Avoid the barrels', centerX, centerY + 75, 14);

    this.draw.textCentered('[←→] to move', centerX, centerY + 110, 16);
    this.draw.textCentered('[↑] to climb/jump', centerX, centerY + 135, 14);
    this.draw.textCentered('[SPACE] to start', centerX, centerY + 160, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    // Draw platforms
    for (const platform of this.platforms) {
      this.draw.rect(platform.x, platform.y, platform.width, platform.height, 2);

      // Support beams
      const beamSpacing = 30;
      for (let x = platform.x; x < platform.x + platform.width; x += beamSpacing) {
        this.draw.line(x, platform.y, x, platform.y + platform.height, 1);
      }
    }

    // Draw ladders
    for (const ladder of this.ladders) {
      const rungSpacing = 15;

      // Vertical rails
      this.draw.line(ladder.x, ladder.y, ladder.x, ladder.y + ladder.height, 2);
      this.draw.line(ladder.x + 20, ladder.y, ladder.x + 20, ladder.y + ladder.height, 2);

      // Rungs
      for (let y = ladder.y; y < ladder.y + ladder.height; y += rungSpacing) {
        this.draw.line(ladder.x, y, ladder.x + 20, y, 1);
      }
    }

    // Draw exit
    this.ctx.save();
    const pulse = Math.sin(performance.now() / 300) * 0.3 + 0.7;
    this.ctx.globalAlpha = pulse;
    this.draw.rect(this.exitX - 25, this.exitY - 15, 50, 30, 2);
    this.draw.text('EXIT', this.exitX - 15, this.exitY - 8, 12);
    this.ctx.restore();

    // Draw bonuses
    for (const bonus of this.bonuses) {
      if (bonus.collected) continue;

      // Draw as a tool icon (simplified wrench)
      this.draw.circle(bonus.x, bonus.y, 8, 2);
      this.draw.line(bonus.x - 5, bonus.y - 5, bonus.x + 5, bonus.y + 5, 2);
    }

    // Draw barrels
    for (const barrel of this.barrels) {
      this.ctx.save();
      this.ctx.translate(barrel.x, barrel.y);
      this.ctx.rotate((barrel.rotation * Math.PI) / 180);

      // Barrel outline
      this.draw.circle(0, 0, barrel.radius, 2);

      // Horizontal line
      this.draw.line(-barrel.radius, 0, barrel.radius, 0, 1);

      this.ctx.restore();
    }

    // Draw player
    this.draw.rect(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      2
    );

    // Player body parts (simplified)
    // Head
    this.draw.circle(
      this.player.x + this.player.width / 2,
      this.player.y + 6,
      4,
      1
    );

    // Arms
    this.draw.line(
      this.player.x + this.player.width / 2,
      this.player.y + 10,
      this.player.x + this.player.width / 2 - 4,
      this.player.y + 14,
      1
    );
    this.draw.line(
      this.player.x + this.player.width / 2,
      this.player.y + 10,
      this.player.x + this.player.width / 2 + 4,
      this.player.y + 14,
      1
    );

    // Legs
    this.draw.line(
      this.player.x + this.player.width / 2,
      this.player.y + 16,
      this.player.x + this.player.width / 2 - 3,
      this.player.y + this.player.height,
      1
    );
    this.draw.line(
      this.player.x + this.player.width / 2,
      this.player.y + 16,
      this.player.x + this.player.width / 2 + 3,
      this.player.y + this.player.height,
      1
    );

    // Draw UI
    this.draw.text('SCAFFOLD RUN', 10, 10, 12);
    this.draw.text(`SCORE: ${this.score.current}`, this.width / 2 - 60, 10, 14);
    this.draw.text(`LIVES: ${this.lives}`, this.width - 100, 10, 14);
    this.draw.text(`LEVEL: ${this.level}`, this.width - 100, 30, 12);
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

    this.draw.textCentered('CONSTRUCTION HALTED', centerX, centerY - 80, 22);
    this.draw.textCentered('───────────────────', centerX, centerY - 50, 14);
    this.draw.textCentered(`Final score: ${this.score.current}`, centerX, centerY - 10, 20);
    this.draw.textCentered(`Levels completed: ${this.level - 1}`, centerX, centerY + 20, 18);

    if (this.score.current >= this.score.high) {
      this.draw.textCentered('NEW HIGH SCORE!', centerX, centerY + 60, 16);
    } else {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, centerY + 60, 14);
    }

    this.draw.textCentered('[SPACE] to rebuild', centerX, centerY + 100, 16);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    if (key === ' ') {
      if (this.state === 'idle' || this.state === 'gameover') {
        this.restart();
      } else if (this.state === 'paused') {
        this.resume();
      } else if (this.state === 'playing') {
        if (this.player.onGround && !this.player.climbing) {
          this.player.vy = this.JUMP_FORCE;
        }
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

    if (this.state !== 'playing') return;

    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.leftPressed = true;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.rightPressed = true;
    }
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.upPressed = true;

      // Jump if on ground and not on ladder
      if (this.player.onGround && !this.player.onLadder) {
        this.player.vy = this.JUMP_FORCE;
      }
    }
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.downPressed = true;
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    const key = event.key;

    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.leftPressed = false;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.rightPressed = false;
    }
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.upPressed = false;
    }
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.downPressed = false;
    }
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
