/**
 * Fusion Lab Arcade - Block Demolition (Breakout Clone)
 * Game #02 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number; // 0 = destroyed, 1-3 = normal/strong/tough, -1 = indestructible
  maxHits: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class BlockDemolitionGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'block-demolition',
    name: 'BLOCK DEMOLITION',
    number: '02',
    originalGame: 'Breakout / Arkanoid (1976)',
    difficulty: 'simple',
    estimatedTime: '3-4 hours',
    genre: 'Arcade',
    description: 'Break all the blocks',
  };

  controls: GameControls = {
    'ArrowLeft': 'Move left',
    'ArrowRight': 'Move right',
    'A': 'Move left',
    'D': 'Move right',
    ' ': 'Launch ball / Start',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game constants
  private readonly PADDLE_WIDTH = 100;
  private readonly PADDLE_HEIGHT = 10;
  private readonly PADDLE_Y_OFFSET = 30;
  private readonly BALL_RADIUS = 6;
  private readonly BALL_SPEED = 6;
  private readonly BLOCK_WIDTH = 60;
  private readonly BLOCK_HEIGHT = 20;
  private readonly BLOCK_COLS = 12;
  private readonly BLOCK_ROWS = 5;
  private readonly BLOCK_PADDING = 4;
  private readonly BLOCK_OFFSET_TOP = 60;

  // Game state
  private paddle!: Paddle;
  private ball!: Ball;
  private blocks: Block[] = [];
  private lives = 3;
  private level = 1;
  private particles: Particle[] = [];
  private mouseX = 0;
  private leftPressed = false;
  private rightPressed = false;

  private draw!: DrawHelpers;

  init(context: GameContext): void {
    this.ctx = context.ctx;
    this.canvas = context.canvas;
    this.width = context.width;
    this.height = context.height;
    this.score = storage.getGameScore(this.metadata.id);
    this.draw = new DrawHelpers(this.ctx);

    // Mouse tracking
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

    this.resetGame();
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
  }

  private resetGame(): void {
    this.lives = 3;
    this.level = 1;
    this.resetLevel();
  }

  private resetLevel(): void {
    // Initialize paddle
    this.paddle = {
      x: this.width / 2 - this.PADDLE_WIDTH / 2,
      y: this.height - this.PADDLE_Y_OFFSET,
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: 8,
    };

    // Initialize ball
    this.ball = {
      x: this.width / 2,
      y: this.paddle.y - this.BALL_RADIUS - 2,
      vx: 0,
      vy: 0,
      radius: this.BALL_RADIUS,
      active: false,
    };

    // Initialize blocks
    this.blocks = [];
    this.createBlocks();

    this.particles = [];
  }

  private createBlocks(): void {
    const totalWidth = this.BLOCK_COLS * this.BLOCK_WIDTH + (this.BLOCK_COLS - 1) * this.BLOCK_PADDING;
    const startX = (this.width - totalWidth) / 2;

    for (let row = 0; row < this.BLOCK_ROWS; row++) {
      for (let col = 0; col < this.BLOCK_COLS; col++) {
        const x = startX + col * (this.BLOCK_WIDTH + this.BLOCK_PADDING);
        const y = this.BLOCK_OFFSET_TOP + row * (this.BLOCK_HEIGHT + this.BLOCK_PADDING);

        let hits = 1;
        let maxHits = 1;

        // Determine block type based on row
        if (row === 0) {
          // Top row: tough blocks (3 hits)
          hits = 3;
          maxHits = 3;
        } else if (row === 1 || row === 2) {
          // Middle rows: strong blocks (2 hits)
          hits = 2;
          maxHits = 2;
        } else {
          // Bottom rows: normal blocks (1 hit)
          hits = 1;
          maxHits = 1;
        }

        // Occasionally add indestructible blocks
        if (this.level > 1 && Math.random() < 0.05) {
          hits = -1; // Indestructible
          maxHits = -1;
        }

        this.blocks.push({
          x,
          y,
          width: this.BLOCK_WIDTH,
          height: this.BLOCK_HEIGHT,
          hits,
          maxHits,
        });
      }
    }
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
    // Cleanup event listeners if needed
  }

  update(deltaTime: number): void {
    if (this.state !== 'playing') return;

    // Update paddle position (mouse or keyboard)
    if (this.mouseX > 0) {
      this.paddle.x = this.mouseX - this.PADDLE_WIDTH / 2;
    } else {
      if (this.leftPressed) {
        this.paddle.x -= this.paddle.speed;
      }
      if (this.rightPressed) {
        this.paddle.x += this.paddle.speed;
      }
    }

    // Clamp paddle to screen
    this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));

    // Update ball
    if (!this.ball.active) {
      // Ball follows paddle when not launched
      this.ball.x = this.paddle.x + this.paddle.width / 2;
      this.ball.y = this.paddle.y - this.BALL_RADIUS - 2;
    } else {
      // Move ball
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      // Wall collisions
      if (this.ball.x - this.ball.radius <= 0 || this.ball.x + this.ball.radius >= this.width) {
        this.ball.vx *= -1;
        this.ball.x = Math.max(this.ball.radius, Math.min(this.width - this.ball.radius, this.ball.x));
      }

      if (this.ball.y - this.ball.radius <= 0) {
        this.ball.vy *= -1;
        this.ball.y = this.ball.radius;
      }

      // Ball fell off bottom
      if (this.ball.y - this.ball.radius > this.height) {
        this.loseLife();
      }

      // Paddle collision
      if (this.ball.vy > 0 &&
          this.ball.y + this.ball.radius >= this.paddle.y &&
          this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
          this.ball.x >= this.paddle.x &&
          this.ball.x <= this.paddle.x + this.paddle.width) {

        // Calculate angle based on hit position
        const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width; // 0 to 1
        const angle = -60 + hitPos * 120; // -60 to +60 degrees
        const angleRad = (angle * Math.PI) / 180;

        const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        this.ball.vx = Math.sin(angleRad) * speed;
        this.ball.vy = -Math.abs(Math.cos(angleRad) * speed);

        this.ball.y = this.paddle.y - this.ball.radius;
      }

      // Block collisions
      for (let i = this.blocks.length - 1; i >= 0; i--) {
        const block = this.blocks[i];

        if (block.hits === 0) continue; // Already destroyed
        if (block.hits === -1) {
          // Indestructible - just bounce
          if (this.checkBallBlockCollision(this.ball, block)) {
            this.bounceBallOffBlock(this.ball, block);
          }
          continue;
        }

        if (this.checkBallBlockCollision(this.ball, block)) {
          // Hit the block
          block.hits--;

          if (block.hits === 0) {
            // Block destroyed
            const points = block.maxHits === 1 ? 10 : block.maxHits === 2 ? 20 : 30;
            this.score.current += points;
            this.createBlockParticles(block);
          }

          this.bounceBallOffBlock(this.ball, block);
          break;
        }
      }

      // Check for level completion
      const destructibleBlocks = this.blocks.filter(b => b.hits > 0);
      if (destructibleBlocks.length === 0) {
        this.nextLevel();
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private checkBallBlockCollision(ball: Ball, block: Block): boolean {
    return (
      ball.x + ball.radius > block.x &&
      ball.x - ball.radius < block.x + block.width &&
      ball.y + ball.radius > block.y &&
      ball.y - ball.radius < block.y + block.height
    );
  }

  private bounceBallOffBlock(ball: Ball, block: Block): void {
    const blockCenterX = block.x + block.width / 2;
    const blockCenterY = block.y + block.height / 2;

    const dx = ball.x - blockCenterX;
    const dy = ball.y - blockCenterY;

    if (Math.abs(dx / block.width) > Math.abs(dy / block.height)) {
      ball.vx *= -1;
    } else {
      ball.vy *= -1;
    }
  }

  private createBlockParticles(block: Block): void {
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 20,
        maxLife: 20,
      });
    }
  }

  private loseLife(): void {
    this.lives--;

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Reset ball
      this.ball.active = false;
      this.ball.x = this.paddle.x + this.paddle.width / 2;
      this.ball.y = this.paddle.y - this.BALL_RADIUS - 2;
      this.ball.vx = 0;
      this.ball.vy = 0;
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

    this.draw.textCentered('FUSION LAB ARCADE', centerX, centerY - 100, 20);
    this.draw.textCentered('─────────────────', centerX, centerY - 70, 14);
    this.draw.textCentered('BLOCK DEMOLITION', centerX, centerY - 30, 28);
    this.draw.textCentered('Simulation #02', centerX, centerY + 10, 14);

    this.draw.textCentered('[SPACE] to launch', centerX, centerY + 60, 16);
    this.draw.textCentered('[MOUSE] to move', centerX, centerY + 85, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    // Draw boundaries
    this.draw.line(0, 0, this.width, 0, 2); // Top
    this.draw.line(0, 0, 0, this.height, 2); // Left
    this.draw.line(this.width, 0, this.width, this.height, 2); // Right

    // Draw blocks
    this.blocks.forEach(block => {
      if (block.hits === 0) return;

      if (block.hits === -1) {
        // Indestructible - filled
        this.ctx.save();
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(block.x, block.y, block.width, block.height);
        this.ctx.restore();
      } else if (block.maxHits === 1) {
        // Normal block - thin outline
        this.draw.rect(block.x, block.y, block.width, block.height, 1);
      } else if (block.maxHits === 2) {
        // Strong block - thick outline + horizontal line
        this.draw.rect(block.x, block.y, block.width, block.height, 2);
        this.draw.line(
          block.x,
          block.y + block.height / 2,
          block.x + block.width,
          block.y + block.height / 2,
          1
        );
      } else if (block.maxHits === 3) {
        // Tough block - thick outline + cross hatch
        this.draw.rect(block.x, block.y, block.width, block.height, 2);
        this.draw.line(
          block.x,
          block.y + block.height / 2,
          block.x + block.width,
          block.y + block.height / 2,
          1
        );
        this.draw.line(
          block.x + block.width / 2,
          block.y,
          block.x + block.width / 2,
          block.y + block.height,
          1
        );
      }

      // Draw damage indicator
      if (block.hits > 0 && block.hits < block.maxHits) {
        const alpha = 0.3 + (block.hits / block.maxHits) * 0.7;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
        this.ctx.restore();
      }
    });

    // Draw paddle with hatch pattern
    this.draw.rect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 2);
    for (let i = 0; i < 5; i++) {
      const x = this.paddle.x + (i * this.paddle.width) / 4;
      this.draw.line(x, this.paddle.y, x, this.paddle.y + this.paddle.height, 1);
    }

    // Draw ball
    this.draw.circle(this.ball.x, this.ball.y, this.ball.radius, 2);

    // Draw particles
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.draw.line(p.x, p.y, p.x + p.vx, p.y + p.vy, 1);
      this.ctx.restore();
    });

    // Draw UI
    this.draw.text('BLOCK DEMOLITION', 10, 10, 12);
    this.draw.text(`SCORE: ${this.score.current}`, this.width / 2 - 60, 10, 16);

    // Draw lives
    let livesText = 'LIVES: ';
    for (let i = 0; i < 3; i++) {
      livesText += i < this.lives ? '●' : '○';
      livesText += ' ';
    }
    this.draw.text(livesText, this.width - 140, 10, 14);
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

    this.draw.textCentered('DEMOLITION COMPLETE', centerX, centerY - 80, 24);
    this.draw.textCentered(`Final Score: ${this.score.current}`, centerX, centerY - 30, 20);
    this.draw.textCentered(`Level Reached: ${this.level}`, centerX, centerY, 18);

    if (this.score.current >= this.score.high) {
      this.draw.textCentered('NEW HIGH SCORE!', centerX, centerY + 40, 16);
    } else {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, centerY + 40, 14);
    }

    this.draw.textCentered('[SPACE] to restart', centerX, centerY + 80, 16);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    if (key === ' ') {
      if (this.state === 'idle' || this.state === 'gameover') {
        this.restart();
      } else if (this.state === 'paused') {
        this.resume();
      } else if (this.state === 'playing') {
        if (!this.ball.active) {
          // Launch ball
          this.ball.active = true;
          const angle = -75 + Math.random() * 30; // -75 to -45 degrees
          const angleRad = (angle * Math.PI) / 180;
          this.ball.vx = Math.sin(angleRad) * this.BALL_SPEED;
          this.ball.vy = Math.cos(angleRad) * this.BALL_SPEED;
        } else {
          this.pause();
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
