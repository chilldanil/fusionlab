/**
 * Fusion Lab Arcade - Cable Router (Snake Clone)
 * Game #01 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

export class CableRouterGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'cable-router',
    name: 'CABLE ROUTER',
    number: '01',
    originalGame: 'Snake (1976)',
    difficulty: 'simple',
    estimatedTime: '2-3 hours',
    genre: 'Arcade / Puzzle',
    description: 'Route the cable through the grid',
  };

  controls: GameControls = {
    'ArrowUp': 'Move up',
    'ArrowDown': 'Move down',
    'ArrowLeft': 'Move left',
    'ArrowRight': 'Move right',
    'W': 'Move up',
    'S': 'Move down',
    'A': 'Move left',
    'D': 'Move right',
    ' ': 'Start/Restart',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game constants
  private readonly CELL_SIZE = 20;
  private readonly GRID_WIDTH = 40;
  private readonly GRID_HEIGHT = 20;
  private readonly INITIAL_SPEED = 125; // ms per move (8 cells/sec)
  private readonly SPEED_INCREMENT = 0.5;

  // Game state
  private snake: Point[] = [];
  private direction: Direction = 'right';
  private nextDirection: Direction = 'right';
  private food: Point = { x: 0, y: 0 };
  private speed = this.INITIAL_SPEED;
  private lastMoveTime = 0;
  private foodBlink = true;
  private lastBlinkTime = 0;
  private trail: Point[] = [];
  private deathAnimation = 0;

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
    // Initialize snake in center
    const centerX = Math.floor(this.GRID_WIDTH / 2);
    const centerY = Math.floor(this.GRID_HEIGHT / 2);

    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ];

    this.direction = 'right';
    this.nextDirection = 'right';
    this.speed = this.INITIAL_SPEED;
    this.trail = [];
    this.deathAnimation = 0;

    this.spawnFood();
  }

  private spawnFood(): void {
    let attempts = 0;
    do {
      this.food = {
        x: Math.floor(Math.random() * this.GRID_WIDTH),
        y: Math.floor(Math.random() * this.GRID_HEIGHT),
      };
      attempts++;
    } while (this.isSnakeCell(this.food.x, this.food.y) && attempts < 100);
  }

  private isSnakeCell(x: number, y: number): boolean {
    return this.snake.some(segment => segment.x === x && segment.y === y);
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
    // Cleanup resources if needed
  }

  update(deltaTime: number): void {
    const currentTime = performance.now();

    // Blink food
    if (currentTime - this.lastBlinkTime > 500) {
      this.foodBlink = !this.foodBlink;
      this.lastBlinkTime = currentTime;
    }

    if (this.state !== 'playing') return;

    // Move snake
    if (currentTime - this.lastMoveTime > this.speed) {
      this.direction = this.nextDirection;

      // Calculate new head position
      const head = { ...this.snake[0] };

      switch (this.direction) {
        case 'up':
          head.y--;
          break;
        case 'down':
          head.y++;
          break;
        case 'left':
          head.x--;
          break;
        case 'right':
          head.x++;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= this.GRID_WIDTH || head.y < 0 || head.y >= this.GRID_HEIGHT) {
        this.gameOver();
        return;
      }

      // Check self collision
      if (this.isSnakeCell(head.x, head.y)) {
        this.gameOver();
        return;
      }

      // Add new head
      this.snake.unshift(head);

      // Add to trail (keep last 5 positions)
      this.trail.unshift({ ...this.snake[0] });
      if (this.trail.length > 5) {
        this.trail.pop();
      }

      // Check food collision
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score.current += 10;
        this.spawnFood();

        // Increase speed every 5 points
        if (this.score.current % 50 === 0) {
          this.speed = Math.max(67, this.speed - 8); // Max 15 cells/sec
        }
      } else {
        // Remove tail if no food eaten
        this.snake.pop();
      }

      this.lastMoveTime = currentTime;
    }
  }

  private gameOver(): void {
    this.state = 'gameover';
    storage.setHighScore(this.metadata.id, this.score.current);
    this.score.high = storage.getHighScore(this.metadata.id);
  }

  render(): void {
    // Clear screen
    this.draw.clear(this.width, this.height);

    // Draw grid
    this.draw.grid(this.width, this.height, this.CELL_SIZE, '#111111');

    // Draw field border
    this.draw.rect(0, 0, this.width, this.height, 1);

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

    this.draw.textCentered('FUSION LAB ARCADE', centerX, centerY - 80, 20);
    this.draw.textCentered('─────────────────', centerX, centerY - 50, 14);
    this.draw.textCentered('CABLE ROUTER', centerX, centerY - 20, 24);
    this.draw.textCentered('Simulation #01', centerX, centerY + 15, 14);

    this.draw.textCentered('[SPACE] to start', centerX, centerY + 60, 16);
    this.draw.textCentered('[←↑↓→] to navigate', centerX, centerY + 85, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    // Draw trail (faint lines)
    this.ctx.save();
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    for (let i = 1; i < this.trail.length; i++) {
      const alpha = 1 - (i / this.trail.length);
      this.ctx.globalAlpha = alpha * 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(this.trail[i - 1].x * this.CELL_SIZE + this.CELL_SIZE / 2,
                      this.trail[i - 1].y * this.CELL_SIZE + this.CELL_SIZE / 2);
      this.ctx.lineTo(this.trail[i].x * this.CELL_SIZE + this.CELL_SIZE / 2,
                      this.trail[i].y * this.CELL_SIZE + this.CELL_SIZE / 2);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Draw snake body
    for (let i = 1; i < this.snake.length; i++) {
      const segment = this.snake[i];
      const x = segment.x * this.CELL_SIZE + 2;
      const y = segment.y * this.CELL_SIZE + 2;

      // Body segment
      this.draw.rect(x, y, this.CELL_SIZE - 4, this.CELL_SIZE - 4, 2);

      // Connection lines to previous segment
      if (i > 0) {
        const prev = this.snake[i - 1];
        const centerX1 = segment.x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const centerY1 = segment.y * this.CELL_SIZE + this.CELL_SIZE / 2;
        const centerX2 = prev.x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const centerY2 = prev.y * this.CELL_SIZE + this.CELL_SIZE / 2;
        this.draw.line(centerX1, centerY1, centerX2, centerY2, 2);
      }
    }

    // Draw snake head (with cross inside)
    if (this.snake.length > 0) {
      const head = this.snake[0];
      const x = head.x * this.CELL_SIZE + 1;
      const y = head.y * this.CELL_SIZE + 1;

      this.draw.rect(x, y, this.CELL_SIZE - 2, this.CELL_SIZE - 2, 2);

      // Cross inside head
      const centerX = head.x * this.CELL_SIZE + this.CELL_SIZE / 2;
      const centerY = head.y * this.CELL_SIZE + this.CELL_SIZE / 2;
      const size = 6;
      this.draw.line(centerX - size, centerY - size, centerX + size, centerY + size, 1);
      this.draw.line(centerX + size, centerY - size, centerX - size, centerY + size, 1);
    }

    // Draw food (blinking)
    if (this.foodBlink) {
      const foodX = this.food.x * this.CELL_SIZE + 3;
      const foodY = this.food.y * this.CELL_SIZE + 3;
      const foodSize = this.CELL_SIZE - 6;

      this.draw.rect(foodX, foodY, foodSize, foodSize, 2);

      // Dot in center
      const centerX = this.food.x * this.CELL_SIZE + this.CELL_SIZE / 2;
      const centerY = this.food.y * this.CELL_SIZE + this.CELL_SIZE / 2;
      this.draw.circleFilled(centerX, centerY, 2);
    }

    // Draw UI
    this.draw.text('CABLE ROUTER', 10, 10, 12);
    this.draw.text(`LENGTH: ${this.snake.length}`, this.width - 150, 10, 14, 'left');
  }

  private renderPauseScreen(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('PAUSED', centerX, centerY - 20, 32);
    this.draw.textCentered('[SPACE] to continue', centerX, centerY + 30, 16);
  }

  private renderGameOverScreen(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('CIRCUIT OVERLOAD', centerX, centerY - 60, 28);
    this.draw.textCentered(`Final length: ${this.snake.length}`, centerX, centerY - 10, 18);
    this.draw.textCentered(`Score: ${this.score.current}`, centerX, centerY + 20, 18);

    if (this.score.current >= this.score.high) {
      this.draw.textCentered('NEW HIGH SCORE!', centerX, centerY + 50, 16);
    } else {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, centerY + 50, 14);
    }

    this.draw.textCentered('[SPACE] to restart', centerX, centerY + 90, 16);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    // Global controls
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

    // Movement controls (only during playing)
    if (this.state !== 'playing') return;

    // Prevent 180° turns
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (this.direction !== 'down') this.nextDirection = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (this.direction !== 'up') this.nextDirection = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (this.direction !== 'right') this.nextDirection = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (this.direction !== 'left') this.nextDirection = 'right';
        break;
    }
  }

  handleKeyUp(_event: KeyboardEvent): void {
    // No key up handling needed
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
