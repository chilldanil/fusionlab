/**
 * Fusion Lab Arcade - Shaft Climber (Doodle Jump Clone)
 * Game #06 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

type PlatformType = 'normal' | 'moving' | 'breaking' | 'spring' | 'disappearing';

interface Platform {
  x: number;
  y: number;
  width: number;
  type: PlatformType;
  vx?: number; // for moving platforms
  touched?: boolean; // for breaking/disappearing platforms
  breakTimer?: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export class ShaftClimberGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'shaft-climber',
    name: 'SHAFT CLIMBER',
    number: '06',
    originalGame: 'Doodle Jump (2009) / Icy Tower (2001)',
    difficulty: 'medium',
    estimatedTime: '4-5 hours',
    genre: 'Vertical Platformer',
    description: 'Ascend the elevator shaft',
  };

  controls: GameControls = {
    'ArrowLeft': 'Move left',
    'ArrowRight': 'Move right',
    'A': 'Move left',
    'D': 'Move right',
    ' ': 'Start',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game constants
  private readonly GRAVITY = 0.6;
  private readonly JUMP_FORCE = -12;
  private readonly SPRING_JUMP_FORCE = -20;
  private readonly MOVE_SPEED = 5;
  private readonly FRICTION = 0.85;
  private readonly PLATFORM_MIN_WIDTH = 60;
  private readonly PLATFORM_MAX_WIDTH = 100;
  private readonly PLATFORM_HEIGHT = 8;

  // Game state
  private player!: Player;
  private platforms: Platform[] = [];
  private cameraY = 0;
  private height_score = 0;
  private maxHeight = 0;
  private leftPressed = false;
  private rightPressed = false;
  private platformIdCounter = 0;

  private draw!: DrawHelpers;

  init(context: GameContext): void {
    this.ctx = context.ctx;
    this.canvas = context.canvas;
    this.width = context.width;
    this.height = context.height;
    this.score = storage.getGameScore(this.metadata.id);
    this.draw = new DrawHelpers(this.ctx);

    // Use narrower width for vertical format
    this.width = 400;

    this.resetGame();
  }

  private resetGame(): void {
    this.player = {
      x: this.width / 2,
      y: this.height - 100,
      vx: 0,
      vy: 0,
      size: 20,
    };

    this.platforms = [];
    this.cameraY = 0;
    this.height_score = 0;
    this.maxHeight = 0;

    // Create initial platforms
    this.createPlatform(this.width / 2 - 50, this.height - 50, 100, 'normal');

    for (let i = 0; i < 15; i++) {
      this.generatePlatform();
    }
  }

  private createPlatform(x: number, y: number, width: number, type: PlatformType): void {
    const platform: Platform = { x, y, width, type };

    if (type === 'moving') {
      platform.vx = 1 + Math.random() * 2;
      if (Math.random() > 0.5) platform.vx *= -1;
    }

    this.platforms.push(platform);
  }

  private generatePlatform(): void {
    const lastPlatform = this.platforms[this.platforms.length - 1];
    const minY = lastPlatform.y - 80;
    const maxY = lastPlatform.y - 140;
    const y = minY + Math.random() * (maxY - minY);

    const x = Math.random() * (this.width - this.PLATFORM_MAX_WIDTH);
    const width = this.PLATFORM_MIN_WIDTH + Math.random() * (this.PLATFORM_MAX_WIDTH - this.PLATFORM_MIN_WIDTH);

    // Determine platform type based on height
    let type: PlatformType = 'normal';
    const heightCategory = Math.floor(this.maxHeight / 1000);

    if (heightCategory === 0) {
      // 0-1000: mostly normal, some moving
      type = Math.random() < 0.8 ? 'normal' : 'moving';
    } else if (heightCategory < 3) {
      // 1000-3000: normal, moving, disappearing
      const rand = Math.random();
      if (rand < 0.5) type = 'normal';
      else if (rand < 0.8) type = 'moving';
      else type = 'disappearing';
    } else {
      // 3000+: all types
      const rand = Math.random();
      if (rand < 0.3) type = 'normal';
      else if (rand < 0.5) type = 'moving';
      else if (rand < 0.65) type = 'disappearing';
      else if (rand < 0.8) type = 'spring';
      else type = 'breaking';
    }

    this.createPlatform(x, y, width, type);
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

    // Apply horizontal movement
    if (this.leftPressed) {
      this.player.vx -= 0.5;
    }
    if (this.rightPressed) {
      this.player.vx += 0.5;
    }

    // Limit horizontal speed
    this.player.vx = Math.max(-this.MOVE_SPEED, Math.min(this.MOVE_SPEED, this.player.vx));

    // Apply friction
    this.player.vx *= this.FRICTION;

    // Apply gravity
    this.player.vy += this.GRAVITY;

    // Update player position
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    // Wrap around horizontally
    if (this.player.x < -this.player.size) {
      this.player.x = this.width;
    } else if (this.player.x > this.width + this.player.size) {
      this.player.x = -this.player.size;
    }

    // Update camera (follow player when going up)
    const playerScreenY = this.player.y - this.cameraY;
    if (playerScreenY < this.height / 3) {
      this.cameraY = this.player.y - this.height / 3;
    }

    // Update height score
    const currentHeight = Math.max(0, -this.player.y);
    if (currentHeight > this.maxHeight) {
      this.maxHeight = currentHeight;
      this.height_score = Math.floor(this.maxHeight);
      this.score.current = this.height_score;
    }

    // Check platform collisions (only when falling down)
    if (this.player.vy > 0) {
      for (const platform of this.platforms) {
        if (platform.touched && platform.type === 'breaking') continue;
        if (platform.touched && platform.type === 'disappearing') continue;

        const playerBottom = this.player.y + this.player.size / 2;
        const playerTop = this.player.y - this.player.size / 2;

        if (
          playerBottom >= platform.y &&
          playerTop < platform.y + this.PLATFORM_HEIGHT &&
          this.player.x > platform.x - this.player.size / 2 &&
          this.player.x < platform.x + platform.width + this.player.size / 2
        ) {
          // Land on platform
          if (platform.type === 'spring') {
            this.player.vy = this.SPRING_JUMP_FORCE;
          } else {
            this.player.vy = this.JUMP_FORCE;
          }

          this.player.y = platform.y - this.player.size / 2;

          // Handle special platform types
          if (platform.type === 'breaking') {
            platform.touched = true;
            platform.breakTimer = 200;
          } else if (platform.type === 'disappearing') {
            platform.touched = true;
            platform.breakTimer = 500;
          }

          break;
        }
      }
    }

    // Update moving platforms
    for (const platform of this.platforms) {
      if (platform.type === 'moving' && platform.vx) {
        platform.x += platform.vx;

        // Bounce off walls
        if (platform.x < 0 || platform.x + platform.width > this.width) {
          platform.vx *= -1;
          platform.x = Math.max(0, Math.min(this.width - platform.width, platform.x));
        }
      }

      // Update breaking/disappearing platforms
      if (platform.touched && platform.breakTimer !== undefined) {
        platform.breakTimer -= deltaTime;
      }
    }

    // Remove platforms that are too far below camera
    this.platforms = this.platforms.filter(p => {
      if (p.touched && p.breakTimer !== undefined && p.breakTimer <= 0) {
        return false;
      }
      return p.y < this.cameraY + this.height + 100;
    });

    // Generate new platforms as we climb
    while (this.platforms.length < 20) {
      this.generatePlatform();
    }

    // Check if player fell too far below camera
    if (this.player.y > this.cameraY + this.height) {
      this.gameOver();
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

    this.draw.textCentered('FUSION LAB ARCADE', centerX, centerY - 120, 18);
    this.draw.textCentered('─────────────────', centerX, centerY - 90, 12);
    this.draw.textCentered('SHAFT CLIMBER', centerX, centerY - 50, 24);
    this.draw.textCentered('Simulation #06', centerX, centerY - 15, 12);

    this.draw.textCentered('Ascend the elevator shaft', centerX, centerY + 30, 12);

    this.draw.textCentered('[←→] to move', centerX, centerY + 70, 14);
    this.draw.textCentered('[SPACE] to start', centerX, centerY + 95, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`Best height: ${this.score.high} m`, centerX, this.height - 40, 12);
    }
  }

  private renderGame(): void {
    // Draw shaft walls
    this.draw.line(0, 0, 0, this.height, 2);
    this.draw.line(this.width, 0, this.width, this.height, 2);

    // Draw measurement marks on walls (every 100px)
    for (let y = 0; y < this.height; y += 20) {
      const worldY = y + this.cameraY;
      if (worldY % 100 === 0) {
        this.draw.line(0, y, 10, y, 1);
        this.draw.line(this.width - 10, y, this.width, y, 1);

        const heightMark = Math.floor(-worldY / 100) * 100;
        if (heightMark > 0) {
          this.draw.text(`${heightMark}`, 12, y - 5, 8);
        }
      }
    }

    // Draw platforms
    for (const platform of this.platforms) {
      const screenY = platform.y - this.cameraY;

      if (screenY < -50 || screenY > this.height + 50) continue;

      let alpha = 1;
      if (platform.touched && platform.breakTimer !== undefined) {
        alpha = platform.breakTimer / (platform.type === 'breaking' ? 200 : 500);

        // Blink before disappearing
        if (platform.type === 'disappearing' && platform.breakTimer < 300) {
          if (Math.floor(performance.now() / 100) % 2 === 0) continue;
        }
      }

      this.ctx.save();
      this.ctx.globalAlpha = alpha;

      if (platform.type === 'normal') {
        this.draw.line(platform.x, screenY, platform.x + platform.width, screenY, 2);
      } else if (platform.type === 'moving') {
        this.draw.line(platform.x, screenY, platform.x + platform.width, screenY, 2);
        // Arrows
        this.draw.line(platform.x - 5, screenY, platform.x, screenY - 3, 1);
        this.draw.line(platform.x - 5, screenY, platform.x, screenY + 3, 1);
        this.draw.line(platform.x + platform.width + 5, screenY, platform.x + platform.width, screenY - 3, 1);
        this.draw.line(platform.x + platform.width + 5, screenY, platform.x + platform.width, screenY + 3, 1);
      } else if (platform.type === 'disappearing') {
        this.draw.dashedLine(platform.x, screenY, platform.x + platform.width, screenY, [5, 5], 2);
      } else if (platform.type === 'spring') {
        this.draw.line(platform.x, screenY, platform.x + platform.width, screenY, 2);
        // Spring zigzag
        const segments = 8;
        const segWidth = platform.width / segments;
        for (let i = 0; i < segments; i++) {
          const x1 = platform.x + i * segWidth;
          const x2 = platform.x + (i + 1) * segWidth;
          const y1 = screenY + (i % 2 === 0 ? 5 : -5);
          const y2 = screenY + (i % 2 === 0 ? -5 : 5);
          this.draw.line(x1, y1, x2, y2, 1);
        }
      } else if (platform.type === 'breaking') {
        this.draw.line(platform.x, screenY, platform.x + platform.width, screenY, 2);
        // Cracks
        const numCracks = 3;
        for (let i = 0; i < numCracks; i++) {
          const x = platform.x + (platform.width / (numCracks + 1)) * (i + 1);
          this.draw.line(x, screenY - 3, x + 2, screenY + 3, 1);
        }
      }

      this.ctx.restore();
    }

    // Draw player
    const playerScreenY = this.player.y - this.cameraY;
    this.draw.rect(
      this.player.x - this.player.size / 2,
      playerScreenY - this.player.size / 2,
      this.player.size,
      this.player.size,
      2
    );

    // Draw cross inside player
    this.draw.line(
      this.player.x - 6,
      playerScreenY - 6,
      this.player.x + 6,
      playerScreenY + 6,
      1
    );
    this.draw.line(
      this.player.x + 6,
      playerScreenY - 6,
      this.player.x - 6,
      playerScreenY + 6,
      1
    );

    // Draw UI
    this.draw.text(`HEIGHT: ${this.height_score} m`, 10, 10, 14);

    // Height scale on right
    const scaleX = this.width - 30;
    const scaleHeight = 200;
    const scaleY = this.height - scaleHeight - 20;

    this.draw.line(scaleX, scaleY, scaleX, scaleY + scaleHeight, 1);

    // Scale marks
    for (let i = 0; i <= 5; i++) {
      const y = scaleY + (i * scaleHeight) / 5;
      this.draw.line(scaleX - 3, y, scaleX + 3, y, 1);
    }

    // Current height marker
    const progress = Math.min(1, this.height_score / 5000);
    const markerY = scaleY + scaleHeight - (progress * scaleHeight);
    this.draw.line(scaleX - 5, markerY, scaleX + 5, markerY, 2);

    if (this.score.high > 0) {
      this.draw.text(`BEST`, this.width - 50, 10, 10);
      this.draw.text(`${this.score.high}m`, this.width - 50, 22, 10);
    }
  }

  private renderPauseScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('PAUSED', centerX, centerY - 20, 28);
    this.draw.textCentered('[SPACE] to continue', centerX, centerY + 30, 14);
  }

  private renderGameOverScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('SYSTEM FAILURE', centerX, centerY - 80, 22);
    this.draw.textCentered('──────────────', centerX, centerY - 50, 12);
    this.draw.textCentered(`Final height: ${this.height_score} m`, centerX, centerY - 10, 18);

    if (this.score.current >= this.score.high) {
      this.draw.textCentered('NEW RECORD!', centerX, centerY + 30, 16);
    } else {
      this.draw.textCentered(`Best height: ${this.score.high} m`, centerX, centerY + 30, 14);
    }

    this.draw.textCentered('[SPACE] to retry', centerX, centerY + 70, 14);
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

    if (this.state !== 'playing') return;

    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.leftPressed = true;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.rightPressed = true;
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
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
