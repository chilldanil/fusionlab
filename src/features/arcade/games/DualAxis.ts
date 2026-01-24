/**
 * Fusion Lab Arcade - Dual Axis (Pong Clone)
 * Game #05 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  score: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  speed: number;
}

type GameMode = 'ai' | 'human' | null;

export class DualAxisGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'dual-axis',
    name: 'DUAL AXIS',
    number: '05',
    originalGame: 'Pong (1972)',
    difficulty: 'simple',
    estimatedTime: '2-3 hours',
    genre: 'Sports Arcade',
    description: 'Classic two-player competition',
  };

  controls: GameControls = {
    'W': 'Player 1 up',
    'S': 'Player 1 down',
    'ArrowUp': 'Player 2 up',
    'ArrowDown': 'Player 2 down',
    '1': 'Single player mode',
    '2': 'Two player mode',
    ' ': 'Start / Pause',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game constants
  private readonly PADDLE_WIDTH = 10;
  private readonly PADDLE_HEIGHT = 80;
  private readonly PADDLE_OFFSET = 30;
  private readonly PADDLE_SPEED = 8;
  private readonly BALL_SIZE = 12;
  private readonly INITIAL_BALL_SPEED = 6;
  private readonly MAX_BALL_SPEED = 15;
  private readonly WIN_SCORE = 11;

  // Game state
  private paddle1!: Paddle;
  private paddle2!: Paddle;
  private ball!: Ball;
  private mode: GameMode = null;
  private p1UpPressed = false;
  private p1DownPressed = false;
  private p2UpPressed = false;
  private p2DownPressed = false;
  private servingPlayer = 1;
  private serveDelay = 0;
  private flashScore = false;
  private flashTimer = 0;
  private winnerPlayer: number | null = null;
  private ballTrail: Array<{ x: number; y: number; alpha: number }> = [];

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
    this.paddle1 = {
      x: this.PADDLE_OFFSET,
      y: this.height / 2 - this.PADDLE_HEIGHT / 2,
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.PADDLE_SPEED,
      score: 0,
    };

    this.paddle2 = {
      x: this.width - this.PADDLE_OFFSET - this.PADDLE_WIDTH,
      y: this.height / 2 - this.PADDLE_HEIGHT / 2,
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.PADDLE_SPEED,
      score: 0,
    };

    this.resetBall();
    this.servingPlayer = 1;
    this.serveDelay = 0;
    this.winnerPlayer = null;
  }

  private resetBall(): void {
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      size: this.BALL_SIZE,
      speed: this.INITIAL_BALL_SPEED,
    };
    this.ballTrail = [];
  }

  private serveBall(): void {
    const angle = (Math.random() * 60 - 30) * (Math.PI / 180); // -30 to +30 degrees
    const direction = this.servingPlayer === 1 ? 1 : -1;

    this.ball.vx = Math.cos(angle) * this.ball.speed * direction;
    this.ball.vy = Math.sin(angle) * this.ball.speed;
    this.serveDelay = 0;
  }

  start(): void {
    if (this.state === 'idle' && this.mode) {
      this.state = 'playing';
      this.resetGame();
      this.serveBall();
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
    this.resetGame();
    this.serveBall();
  }

  cleanup(): void {
    // Cleanup if needed
  }

  update(deltaTime: number): void {
    if (this.state !== 'playing') return;

    // Flash score animation
    if (this.flashScore) {
      this.flashTimer += deltaTime;
      if (this.flashTimer >= 200) {
        this.flashTimer = 0;
        this.flashScore = false;
      }
    }

    // Serve delay
    if (this.serveDelay > 0) {
      this.serveDelay -= deltaTime;
      if (this.serveDelay <= 0) {
        this.serveBall();
      }
      return;
    }

    // Update paddle 1
    if (this.p1UpPressed) {
      this.paddle1.y -= this.paddle1.speed;
    }
    if (this.p1DownPressed) {
      this.paddle1.y += this.paddle1.speed;
    }
    this.paddle1.y = Math.max(0, Math.min(this.height - this.paddle1.height, this.paddle1.y));

    // Update paddle 2 (AI or human)
    if (this.mode === 'ai') {
      // Simple AI
      const paddleCenter = this.paddle2.y + this.paddle2.height / 2;
      const ballCenter = this.ball.y + this.ball.size / 2;
      const diff = ballCenter - paddleCenter;

      // Add some delay/error to make it beatable
      if (Math.abs(diff) > 10) {
        const aiSpeed = this.paddle2.speed * 0.85;
        if (diff > 0) {
          this.paddle2.y += aiSpeed;
        } else {
          this.paddle2.y -= aiSpeed;
        }
      }
    } else {
      // Human player 2
      if (this.p2UpPressed) {
        this.paddle2.y -= this.paddle2.speed;
      }
      if (this.p2DownPressed) {
        this.paddle2.y += this.paddle2.speed;
      }
    }
    this.paddle2.y = Math.max(0, Math.min(this.height - this.paddle2.height, this.paddle2.y));

    // Update ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Ball trail
    this.ballTrail.unshift({ x: this.ball.x, y: this.ball.y, alpha: 1 });
    if (this.ballTrail.length > 4) {
      this.ballTrail.pop();
    }
    this.ballTrail.forEach((t, i) => {
      t.alpha = 1 - (i / this.ballTrail.length);
    });

    // Top and bottom wall collision
    if (this.ball.y <= 0 || this.ball.y + this.ball.size >= this.height) {
      this.ball.vy *= -1;
      this.ball.y = Math.max(0, Math.min(this.height - this.ball.size, this.ball.y));
    }

    // Paddle collisions
    // Paddle 1
    if (this.ball.vx < 0 &&
        this.ball.x <= this.paddle1.x + this.paddle1.width &&
        this.ball.x + this.ball.size >= this.paddle1.x &&
        this.ball.y + this.ball.size >= this.paddle1.y &&
        this.ball.y <= this.paddle1.y + this.paddle1.height) {
      this.handlePaddleCollision(this.paddle1);
    }

    // Paddle 2
    if (this.ball.vx > 0 &&
        this.ball.x + this.ball.size >= this.paddle2.x &&
        this.ball.x <= this.paddle2.x + this.paddle2.width &&
        this.ball.y + this.ball.size >= this.paddle2.y &&
        this.ball.y <= this.paddle2.y + this.paddle2.height) {
      this.handlePaddleCollision(this.paddle2);
    }

    // Score (ball out of bounds)
    if (this.ball.x < -this.ball.size) {
      // Player 2 scores
      this.paddle2.score++;
      this.flashScore = true;
      this.flashTimer = 0;
      this.checkWin();
      this.resetBall();
      this.servingPlayer = 1;
      this.serveDelay = 1000;
    } else if (this.ball.x > this.width + this.ball.size) {
      // Player 1 scores
      this.paddle1.score++;
      this.flashScore = true;
      this.flashTimer = 0;
      this.checkWin();
      this.resetBall();
      this.servingPlayer = 2;
      this.serveDelay = 1000;
    }
  }

  private handlePaddleCollision(paddle: Paddle): void {
    // Calculate hit position on paddle (0 to 1)
    const hitY = this.ball.y + this.ball.size / 2 - paddle.y;
    const relativeHit = hitY / paddle.height; // 0 to 1

    // Calculate angle based on where ball hit paddle
    // Center = 0°, edges = ±60°
    const angle = (relativeHit - 0.5) * 120; // -60 to +60
    const angleRad = (angle * Math.PI) / 180;

    // Increase speed slightly
    this.ball.speed = Math.min(this.MAX_BALL_SPEED, this.ball.speed + 0.5);

    // Set new velocity
    const direction = this.ball.vx > 0 ? -1 : 1; // Reverse horizontal direction
    this.ball.vx = Math.cos(angleRad) * this.ball.speed * direction;
    this.ball.vy = Math.sin(angleRad) * this.ball.speed;

    // Push ball away from paddle to prevent multiple collisions
    if (direction > 0) {
      this.ball.x = paddle.x + paddle.width;
    } else {
      this.ball.x = paddle.x - this.ball.size;
    }
  }

  private checkWin(): void {
    if (this.paddle1.score >= this.WIN_SCORE && this.paddle1.score - this.paddle2.score >= 2) {
      this.winnerPlayer = 1;
      this.state = 'gameover';
      this.score.current = this.paddle1.score + this.paddle2.score;
      storage.setHighScore(this.metadata.id, this.score.current);
      this.score.high = storage.getHighScore(this.metadata.id);
    } else if (this.paddle2.score >= this.WIN_SCORE && this.paddle2.score - this.paddle1.score >= 2) {
      this.winnerPlayer = 2;
      this.state = 'gameover';
      this.score.current = this.paddle1.score + this.paddle2.score;
      storage.setHighScore(this.metadata.id, this.score.current);
      this.score.high = storage.getHighScore(this.metadata.id);
    }
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
    this.draw.textCentered('DUAL AXIS', centerX, centerY - 50, 32);
    this.draw.textCentered('Simulation #05', centerX, centerY - 10, 14);

    this.draw.textCentered('[1] Single player', centerX, centerY + 40, 18);
    this.draw.textCentered('[2] Two players', centerX, centerY + 70, 18);

    this.draw.textCentered('First to 11 wins', centerX, centerY + 120, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`Longest Match: ${this.score.high} points`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    // Draw boundaries
    this.draw.line(0, 0, this.width, 0, 2);
    this.draw.line(0, this.height, this.width, this.height, 2);

    // Draw center line (dashed)
    this.draw.dashedLine(this.width / 2, 0, this.width / 2, this.height, [20, 10], 2);

    // Draw paddles
    this.renderPaddle(this.paddle1);
    this.renderPaddle(this.paddle2);

    // Draw ball trail
    for (let i = this.ballTrail.length - 1; i >= 0; i--) {
      const trail = this.ballTrail[i];
      this.ctx.save();
      this.ctx.globalAlpha = trail.alpha * 0.3;
      this.draw.rectFilled(trail.x, trail.y, this.ball.size, this.ball.size);
      this.ctx.restore();
    }

    // Draw ball
    this.draw.rect(this.ball.x, this.ball.y, this.ball.size, this.ball.size, 2);

    // Draw score (flash if just scored)
    const scoreSize = 32;
    const scoreY = 40;
    const shouldShow = !this.flashScore || Math.floor(performance.now() / 100) % 2 === 0;

    if (shouldShow) {
      this.draw.text(
        `${this.paddle1.score}`,
        this.width / 2 - 60,
        scoreY,
        scoreSize,
        'center',
        'top'
      );
      this.draw.text(':', this.width / 2, scoreY, scoreSize, 'center', 'top');
      this.draw.text(
        `${this.paddle2.score}`,
        this.width / 2 + 60,
        scoreY,
        scoreSize,
        'center',
        'top'
      );
    }

    // Draw player labels
    this.draw.text('P1 [W/S]', 10, this.height - 25, 10);
    this.draw.text(
      this.mode === 'ai' ? 'AI [Auto]' : 'P2 [↑/↓]',
      this.width - 80,
      this.height - 25,
      10,
      'left'
    );
  }

  private renderPaddle(paddle: Paddle): void {
    // Draw paddle outline
    this.draw.rect(paddle.x, paddle.y, paddle.width, paddle.height, 2);

    // Draw measurement lines inside
    const lineCount = 3;
    for (let i = 1; i < lineCount; i++) {
      const y = paddle.y + (i * paddle.height) / lineCount;
      this.draw.line(paddle.x, y, paddle.x + paddle.width, y, 1);
    }
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

    const winner = this.winnerPlayer === 1 ? 'PLAYER 1' : this.mode === 'ai' ? 'AI' : 'PLAYER 2';
    this.draw.textCentered(`${winner} WINS`, centerX, centerY - 80, 28);
    this.draw.textCentered('─────────────', centerX, centerY - 45, 14);
    this.draw.textCentered(
      `Final score: ${this.paddle1.score} : ${this.paddle2.score}`,
      centerX,
      centerY - 10,
      20
    );

    this.draw.textCentered('[SPACE] to rematch', centerX, centerY + 50, 16);
    this.draw.textCentered('[ESC] to menu', centerX, centerY + 80, 14);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    // Mode selection (only in idle state)
    if (this.state === 'idle') {
      if (key === '1') {
        this.mode = 'ai';
        this.start();
        return;
      }
      if (key === '2') {
        this.mode = 'human';
        this.start();
        return;
      }
    }

    if (key === ' ') {
      if (this.state === 'idle') {
        // Can't start without selecting mode
        return;
      } else if (this.state === 'gameover') {
        if (this.mode) {
          this.restart();
        }
      } else if (this.state === 'paused') {
        this.resume();
      } else if (this.state === 'playing') {
        this.pause();
      }
      return;
    }

    if (key === 'Escape') {
      if (this.state === 'playing') {
        this.pause();
      } else if (this.state === 'paused') {
        this.resume();
      } else if (this.state === 'gameover') {
        this.state = 'idle';
        this.mode = null;
        this.resetGame();
      }
      return;
    }

    if (this.state !== 'playing') return;

    // Player 1 controls
    if (key === 'w' || key === 'W') {
      this.p1UpPressed = true;
    }
    if (key === 's' || key === 'S') {
      this.p1DownPressed = true;
    }

    // Player 2 controls (only in human mode)
    if (this.mode === 'human') {
      if (key === 'ArrowUp') {
        this.p2UpPressed = true;
      }
      if (key === 'ArrowDown') {
        this.p2DownPressed = true;
      }
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    const key = event.key;

    if (key === 'w' || key === 'W') {
      this.p1UpPressed = false;
    }
    if (key === 's' || key === 'S') {
      this.p1DownPressed = false;
    }
    if (key === 'ArrowUp') {
      this.p2UpPressed = false;
    }
    if (key === 'ArrowDown') {
      this.p2DownPressed = false;
    }
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
