/**
 * Fusion Lab Arcade - Grid Maze (Pac-Man Clone)
 * Game #08 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

type Direction = 'up' | 'down' | 'left' | 'right' | null;
type GhostMode = 'chase' | 'scatter' | 'frightened' | 'eyes';

interface Ghost {
  x: number;
  y: number;
  direction: Direction;
  mode: GhostMode;
  target: { x: number; y: number };
  homeCorner: { x: number; y: number };
  type: number; // 0-3 for different ghosts
}

interface Dot {
  x: number;
  y: number;
  isPowerPellet: boolean;
  collected: boolean;
}

const MAZE_LAYOUT = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#O####.#####.##.#####.####O#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '######.##### ## #####.######',
  '######.##          ##.######',
  '######.## ###--### ##.######',
  '      .   #      #   .      ',
  '######.## ######## ##.######',
  '######.##          ##.######',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#O..##.......  .......##..O#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];

export class GridMazeGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'grid-maze',
    name: 'GRID MAZE',
    number: '08',
    originalGame: 'Pac-Man (1980)',
    difficulty: 'complex',
    estimatedTime: '6-8 hours',
    genre: 'Maze / Chase',
    description: 'Clear all data points',
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
    ' ': 'Start',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  private readonly CELL_SIZE = 20;
  private readonly MOVE_SPEED = 2;

  private playerX = 0;
  private playerY = 0;
  private playerDirection: Direction = null;
  private nextDirection: Direction = null;
  private mouthAngle = 0;
  private mouthOpening = true;

  private ghosts: Ghost[] = [];
  private dots: Dot[] = [];
  private maze: string[] = [];
  private lives = 3;
  private level = 1;
  private frightenedTimer = 0;
  private modeTimer = 0;
  private currentMode: 'chase' | 'scatter' = 'scatter';
  private eatCombo = 0;

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
    this.maze = [...MAZE_LAYOUT];
    this.playerX = 13.5;
    this.playerY = 20;
    this.playerDirection = null;
    this.nextDirection = null;
    this.frightenedTimer = 0;
    this.modeTimer = 0;
    this.currentMode = 'scatter';
    this.eatCombo = 0;

    // Create dots
    this.dots = [];
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        if (this.maze[y][x] === '.') {
          this.dots.push({ x, y, isPowerPellet: false, collected: false });
        } else if (this.maze[y][x] === 'O') {
          this.dots.push({ x, y, isPowerPellet: true, collected: false });
        }
      }
    }

    // Create ghosts
    this.ghosts = [
      { x: 13, y: 11, direction: 'left', mode: 'scatter', target: { x: 0, y: 0 }, homeCorner: { x: 25, y: 0 }, type: 0 },
      { x: 13, y: 13, direction: 'up', mode: 'scatter', target: { x: 0, y: 0 }, homeCorner: { x: 2, y: 0 }, type: 1 },
      { x: 14, y: 13, direction: 'up', mode: 'scatter', target: { x: 0, y: 0 }, homeCorner: { x: 27, y: 25 }, type: 2 },
      { x: 15, y: 13, direction: 'up', mode: 'scatter', target: { x: 0, y: 0 }, homeCorner: { x: 0, y: 25 }, type: 3 },
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

  private isWall(x: number, y: number): boolean {
    const cellY = Math.floor(y);
    const cellX = Math.floor(x);
    if (cellY < 0 || cellY >= this.maze.length || cellX < 0 || cellX >= this.maze[0].length) {
      return true;
    }
    const cell = this.maze[cellY][cellX];
    return cell === '#' || cell === '-';
  }

  private canMove(x: number, y: number, direction: Direction): boolean {
    const offset = 0.4;
    switch (direction) {
      case 'up': return !this.isWall(x, y - offset);
      case 'down': return !this.isWall(x, y + offset);
      case 'left': return !this.isWall(x - offset, y);
      case 'right': return !this.isWall(x + offset, y);
      default: return false;
    }
  }

  update(deltaTime: number): void {
    if (this.state !== 'playing') return;

    // Mouth animation
    if (this.mouthOpening) {
      this.mouthAngle += 3;
      if (this.mouthAngle >= 45) this.mouthOpening = false;
    } else {
      this.mouthAngle -= 3;
      if (this.mouthAngle <= 0) this.mouthOpening = true;
    }

    // Mode switching
    this.modeTimer += deltaTime;
    if (this.currentMode === 'scatter' && this.modeTimer > 7000) {
      this.currentMode = 'chase';
      this.modeTimer = 0;
    } else if (this.currentMode === 'chase' && this.modeTimer > 20000) {
      this.currentMode = 'scatter';
      this.modeTimer = 0;
    }

    // Frightened mode timer
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= deltaTime;
      if (this.frightenedTimer <= 0) {
        this.ghosts.forEach(g => {
          if (g.mode === 'frightened') g.mode = this.currentMode;
        });
        this.eatCombo = 0;
      }
    }

    // Try to change direction
    if (this.nextDirection && this.canMove(this.playerX, this.playerY, this.nextDirection)) {
      this.playerDirection = this.nextDirection;
      this.nextDirection = null;
    }

    // Move player
    if (this.playerDirection && this.canMove(this.playerX, this.playerY, this.playerDirection)) {
      const speed = this.MOVE_SPEED / this.CELL_SIZE;
      switch (this.playerDirection) {
        case 'up': this.playerY -= speed; break;
        case 'down': this.playerY += speed; break;
        case 'left': this.playerX -= speed; break;
        case 'right': this.playerX += speed; break;
      }

      // Wrap around
      if (this.playerX < -1) this.playerX = 28;
      if (this.playerX > 28) this.playerX = -1;
    }

    // Collect dots
    const cellX = Math.round(this.playerX);
    const cellY = Math.round(this.playerY);
    for (const dot of this.dots) {
      if (!dot.collected && dot.x === cellX && dot.y === cellY) {
        dot.collected = true;
        this.score.current += dot.isPowerPellet ? 50 : 10;

        if (dot.isPowerPellet) {
          this.frightenedTimer = 10000;
          this.eatCombo = 0;
          this.ghosts.forEach(g => {
            if (g.mode !== 'eyes') {
              g.mode = 'frightened';
              // Reverse direction
              if (g.direction === 'up') g.direction = 'down';
              else if (g.direction === 'down') g.direction = 'up';
              else if (g.direction === 'left') g.direction = 'right';
              else if (g.direction === 'right') g.direction = 'left';
            }
          });
        }
      }
    }

    // Update ghosts
    for (const ghost of this.ghosts) {
      this.updateGhost(ghost);

      // Check collision with player
      const dx = Math.abs(ghost.x - this.playerX);
      const dy = Math.abs(ghost.y - this.playerY);
      if (dx < 0.5 && dy < 0.5) {
        if (ghost.mode === 'frightened') {
          ghost.mode = 'eyes';
          ghost.x = 13;
          ghost.y = 11;
          this.eatCombo++;
          this.score.current += 200 * Math.pow(2, this.eatCombo - 1);
        } else if (ghost.mode !== 'eyes') {
          this.loseLife();
          return;
        }
      }
    }

    // Check level complete
    const remainingDots = this.dots.filter(d => !d.collected);
    if (remainingDots.length === 0) {
      this.level++;
      this.score.current += 1000;
      this.resetLevel();
    }
  }

  private updateGhost(ghost: Ghost): void {
    // Set target based on mode
    if (ghost.mode === 'scatter') {
      ghost.target = ghost.homeCorner;
    } else if (ghost.mode === 'chase') {
      // Different chase strategies
      if (ghost.type === 0) {
        ghost.target = { x: Math.round(this.playerX), y: Math.round(this.playerY) };
      } else if (ghost.type === 1) {
        const ahead = 4;
        switch (this.playerDirection) {
          case 'up': ghost.target = { x: Math.round(this.playerX), y: Math.round(this.playerY - ahead) }; break;
          case 'down': ghost.target = { x: Math.round(this.playerX), y: Math.round(this.playerY + ahead) }; break;
          case 'left': ghost.target = { x: Math.round(this.playerX - ahead), y: Math.round(this.playerY) }; break;
          case 'right': ghost.target = { x: Math.round(this.playerX + ahead), y: Math.round(this.playerY) }; break;
          default: ghost.target = { x: Math.round(this.playerX), y: Math.round(this.playerY) };
        }
      } else {
        ghost.target = { x: Math.round(this.playerX), y: Math.round(this.playerY) };
      }
    } else if (ghost.mode === 'eyes') {
      ghost.target = { x: 13, y: 11 };
      if (Math.abs(ghost.x - 13) < 0.5 && Math.abs(ghost.y - 11) < 0.5) {
        ghost.mode = this.currentMode;
      }
    }

    // Move ghost
    const speed = ghost.mode === 'frightened' ? this.MOVE_SPEED * 0.5 : this.MOVE_SPEED;
    const moveAmount = speed / this.CELL_SIZE;

    // Simple pathfinding - choose best direction at intersections
    const cellX = Math.round(ghost.x);
    const cellY = Math.round(ghost.y);
    const isAtCenter = Math.abs(ghost.x - cellX) < 0.1 && Math.abs(ghost.y - cellY) < 0.1;

    if (isAtCenter) {
      const possibleDirs: Direction[] = [];
      if (this.canMove(cellX, cellY, 'up') && ghost.direction !== 'down') possibleDirs.push('up');
      if (this.canMove(cellX, cellY, 'down') && ghost.direction !== 'up') possibleDirs.push('down');
      if (this.canMove(cellX, cellY, 'left') && ghost.direction !== 'right') possibleDirs.push('left');
      if (this.canMove(cellX, cellY, 'right') && ghost.direction !== 'left') possibleDirs.push('right');

      if (possibleDirs.length > 0) {
        if (ghost.mode === 'frightened') {
          ghost.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        } else {
          let bestDir = possibleDirs[0];
          let bestDist = Infinity;

          for (const dir of possibleDirs) {
            let testX = cellX;
            let testY = cellY;
            if (dir === 'up') testY--;
            if (dir === 'down') testY++;
            if (dir === 'left') testX--;
            if (dir === 'right') testX++;

            const dist = Math.sqrt(Math.pow(testX - ghost.target.x, 2) + Math.pow(testY - ghost.target.y, 2));
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = dir;
            }
          }
          ghost.direction = bestDir;
        }
      }
    }

    // Apply movement
    if (ghost.direction) {
      switch (ghost.direction) {
        case 'up': ghost.y -= moveAmount; break;
        case 'down': ghost.y += moveAmount; break;
        case 'left': ghost.x -= moveAmount; break;
        case 'right': ghost.x += moveAmount; break;
      }

      // Wrap around
      if (ghost.x < -1) ghost.x = 28;
      if (ghost.x > 28) ghost.x = -1;
    }
  }

  private loseLife(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.playerX = 13.5;
      this.playerY = 20;
      this.playerDirection = null;
      this.ghosts.forEach((g, i) => {
        g.x = 13 + i;
        g.y = 11 + (i > 0 ? 2 : 0);
        g.mode = 'scatter';
        g.direction = 'left';
      });
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
    this.draw.textCentered('GRID MAZE', centerX, centerY - 30, 32);
    this.draw.textCentered('Simulation #08', centerX, centerY + 10, 14);

    this.draw.textCentered('Clear all data points', centerX, centerY + 50, 14);
    this.draw.textCentered('Avoid the search algorithms', centerX, centerY + 75, 12);

    this.draw.textCentered('[←→↑↓] to navigate', centerX, centerY + 110, 16);
    this.draw.textCentered('[SPACE] to start', centerX, centerY + 135, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    const offsetX = (this.width - this.maze[0].length * this.CELL_SIZE) / 2;
    const offsetY = 60;

    // Draw maze
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        const px = offsetX + x * this.CELL_SIZE;
        const py = offsetY + y * this.CELL_SIZE;

        if (this.maze[y][x] === '#' || this.maze[y][x] === '-') {
          this.draw.rect(px, py, this.CELL_SIZE, this.CELL_SIZE, 1);
        }
      }
    }

    // Draw dots
    for (const dot of this.dots) {
      if (dot.collected) continue;

      const px = offsetX + dot.x * this.CELL_SIZE + this.CELL_SIZE / 2;
      const py = offsetY + dot.y * this.CELL_SIZE + this.CELL_SIZE / 2;

      if (dot.isPowerPellet) {
        const pulse = Math.sin(performance.now() / 200) * 2 + 6;
        this.draw.circleFilled(px, py, pulse);
      } else {
        this.draw.circleFilled(px, py, 2);
      }
    }

    // Draw player
    const px = offsetX + this.playerX * this.CELL_SIZE;
    const py = offsetY + this.playerY * this.CELL_SIZE;

    this.ctx.save();
    this.ctx.translate(px, py);

    let rotation = 0;
    if (this.playerDirection === 'right') rotation = 0;
    else if (this.playerDirection === 'down') rotation = 90;
    else if (this.playerDirection === 'left') rotation = 180;
    else if (this.playerDirection === 'up') rotation = 270;

    this.ctx.rotate((rotation * Math.PI) / 180);

    // Pac-Man circle with mouth
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    const startAngle = (this.mouthAngle * Math.PI) / 180;
    const endAngle = (360 - this.mouthAngle) * Math.PI / 180;
    this.ctx.arc(0, 0, 9, startAngle, endAngle);
    this.ctx.lineTo(0, 0);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.restore();

    // Draw ghosts
    for (const ghost of this.ghosts) {
      const gx = offsetX + ghost.x * this.CELL_SIZE;
      const gy = offsetY + ghost.y * this.CELL_SIZE;

      this.ctx.save();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;

      if (ghost.mode === 'frightened') {
        const flashing = this.frightenedTimer < 3000 && Math.floor(performance.now() / 200) % 2 === 0;
        this.ctx.strokeStyle = flashing ? '#666666' : '#FFFFFF';
      } else if (ghost.mode === 'eyes') {
        this.ctx.strokeStyle = '#666666';
      }

      // Ghost body (rounded square)
      const size = 8;
      this.ctx.beginPath();
      this.ctx.arc(gx - size, gy - size, size, Math.PI, Math.PI * 1.5);
      this.ctx.arc(gx + size, gy - size, size, Math.PI * 1.5, 0);
      this.ctx.lineTo(gx + size, gy + size);
      this.ctx.lineTo(gx + size / 2, gy + size - size / 3);
      this.ctx.lineTo(gx, gy + size);
      this.ctx.lineTo(gx - size / 2, gy + size - size / 3);
      this.ctx.lineTo(gx - size, gy + size);
      this.ctx.closePath();
      this.ctx.stroke();

      // Eyes
      if (ghost.mode !== 'frightened') {
        this.draw.circleFilled(gx - 3, gy - 2, 2);
        this.draw.circleFilled(gx + 3, gy - 2, 2);
      }

      this.ctx.restore();
    }

    // UI
    this.draw.text(`SCORE: ${this.score.current}`, 10, 10, 14);
    this.draw.text('GRID MAZE', this.width / 2 - 50, 10, 14);

    let livesText = 'LIVES: ';
    for (let i = 0; i < this.lives; i++) {
      livesText += '● ';
    }
    this.draw.text(livesText, this.width - 140, 10, 14);

    this.draw.text(`LEVEL: ${this.level}`, 10, 30, 12);
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

    this.draw.textCentered('SYSTEM COMPROMISED', centerX, centerY - 80, 24);
    this.draw.textCentered('──────────────────', centerX, centerY - 50, 14);
    this.draw.textCentered(`Final score: ${this.score.current}`, centerX, centerY - 10, 20);
    this.draw.textCentered(`Level reached: ${this.level}`, centerX, centerY + 20, 18);

    if (this.score.current >= this.score.high) {
      this.draw.textCentered('NEW HIGH SCORE!', centerX, centerY + 60, 16);
    } else {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, centerY + 60, 14);
    }

    this.draw.textCentered('[SPACE] to reboot', centerX, centerY + 100, 16);
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

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.nextDirection = 'up';
    }
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.nextDirection = 'down';
    }
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.nextDirection = 'left';
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.nextDirection = 'right';
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
