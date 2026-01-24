/**
 * Fusion Lab Arcade - Vector Defense (Space Invaders Clone)
 * Game #03 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

interface Invader {
  x: number;
  y: number;
  type: number; // 0 = drone, 1 = cruiser, 2 = commander
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 'player' | 'enemy';
}

interface Shelter {
  x: number;
  y: number;
  segments: boolean[][]; // 6x4 grid
}

interface BonusShip {
  x: number;
  y: number;
  vx: number;
  active: boolean;
  points: number;
}

interface Explosion {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export class VectorDefenseGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'vector-defense',
    name: 'VECTOR DEFENSE',
    number: '03',
    originalGame: 'Space Invaders (1978)',
    difficulty: 'medium',
    estimatedTime: '4-5 hours',
    genre: 'Shooter',
    description: 'Defend the perimeter',
  };

  controls: GameControls = {
    'ArrowLeft': 'Move left',
    'ArrowRight': 'Move right',
    'A': 'Move left',
    'D': 'Move right',
    ' ': 'Fire',
    'ArrowUp': 'Fire',
    'W': 'Fire',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game constants
  private readonly PLAYER_WIDTH = 30;
  private readonly PLAYER_HEIGHT = 20;
  private readonly PLAYER_Y_OFFSET = 40;
  private readonly PLAYER_SPEED = 8;
  private readonly INVADER_WIDTH = 24;
  private readonly INVADER_HEIGHT = 16;
  private readonly INVADER_COLS = 11;
  private readonly INVADER_ROWS = 5;
  private readonly INVADER_SPACING_X = 12;
  private readonly INVADER_SPACING_Y = 12;
  private readonly SHELTER_WIDTH = 60;
  private readonly SHELTER_HEIGHT = 40;
  private readonly SHELTER_SEGMENTS_X = 6;
  private readonly SHELTER_SEGMENTS_Y = 4;

  // Game state
  private playerX = 0;
  private playerY = 0;
  private playerVx = 0;
  private invaders: Invader[] = [];
  private invaderDirection = 1; // 1 = right, -1 = left
  private invaderSpeed = 1;
  private invaderMoveTimer = 0;
  private invaderMoveDelay = 500;
  private bullets: Bullet[] = [];
  private shelters: Shelter[] = [];
  private bonusShip: BonusShip = { x: 0, y: 0, vx: 0, active: false, points: 0 };
  private bonusTimer = 0;
  private enemyShootTimer = 0;
  private explosions: Explosion[] = [];
  private lives = 3;
  private wave = 1;
  private leftPressed = false;
  private rightPressed = false;
  private lastShotTime = 0;
  private shootCooldown = 300;
  private invulnerableTimer = 0;

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
    this.wave = 1;
    this.playerX = this.width / 2 - this.PLAYER_WIDTH / 2;
    this.playerY = this.height - this.PLAYER_Y_OFFSET;
    this.resetWave();
  }

  private resetWave(): void {
    this.invaders = [];
    this.bullets = [];
    this.explosions = [];
    this.bonusShip.active = false;
    this.bonusTimer = 0;
    this.enemyShootTimer = 0;
    this.invaderDirection = 1;
    this.invaderSpeed = 1 + (this.wave - 1) * 0.2;
    this.invaderMoveDelay = Math.max(200, 500 - (this.wave - 1) * 50);

    // Create invaders
    const startX = (this.width - (this.INVADER_COLS * (this.INVADER_WIDTH + this.INVADER_SPACING_X))) / 2;
    const startY = 60;

    for (let row = 0; row < this.INVADER_ROWS; row++) {
      for (let col = 0; col < this.INVADER_COLS; col++) {
        let type = 0;
        if (row === 0) type = 2; // Commander
        else if (row === 1 || row === 2) type = 1; // Cruiser
        else type = 0; // Drone

        this.invaders.push({
          x: startX + col * (this.INVADER_WIDTH + this.INVADER_SPACING_X),
          y: startY + row * (this.INVADER_HEIGHT + this.INVADER_SPACING_Y),
          type,
          alive: true,
        });
      }
    }

    // Create shelters (only on first wave)
    if (this.wave === 1) {
      this.shelters = [];
      const shelterY = this.height - 120;
      const spacing = this.width / 5;

      for (let i = 0; i < 4; i++) {
        const segments: boolean[][] = [];
        for (let x = 0; x < this.SHELTER_SEGMENTS_X; x++) {
          segments[x] = [];
          for (let y = 0; y < this.SHELTER_SEGMENTS_Y; y++) {
            segments[x][y] = true;
          }
        }

        this.shelters.push({
          x: spacing * (i + 1) - this.SHELTER_WIDTH / 2,
          y: shelterY,
          segments,
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
    // Cleanup if needed
  }

  update(deltaTime: number): void {
    const currentTime = performance.now();

    if (this.state !== 'playing') return;

    // Update invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
    }

    // Update player
    this.playerVx = 0;
    if (this.leftPressed) this.playerVx = -this.PLAYER_SPEED;
    if (this.rightPressed) this.playerVx = this.PLAYER_SPEED;
    this.playerX += this.playerVx;
    this.playerX = Math.max(0, Math.min(this.width - this.PLAYER_WIDTH, this.playerX));

    // Update invaders
    this.invaderMoveTimer += deltaTime;
    if (this.invaderMoveTimer >= this.invaderMoveDelay) {
      this.invaderMoveTimer = 0;
      this.moveInvaders();
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // Remove off-screen bullets
      if (bullet.y < 0 || bullet.y > this.height) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collisions
      if (bullet.owner === 'player') {
        // Check invader hits
        for (let j = 0; j < this.invaders.length; j++) {
          const inv = this.invaders[j];
          if (!inv.alive) continue;

          if (bullet.x > inv.x && bullet.x < inv.x + this.INVADER_WIDTH &&
              bullet.y > inv.y && bullet.y < inv.y + this.INVADER_HEIGHT) {
            inv.alive = false;
            this.bullets.splice(i, 1);
            this.createExplosion(inv.x + this.INVADER_WIDTH / 2, inv.y + this.INVADER_HEIGHT / 2);

            // Award points
            const points = inv.type === 2 ? 30 : inv.type === 1 ? 20 : 10;
            this.score.current += points;

            // Speed up remaining invaders
            const aliveCount = this.invaders.filter(iv => iv.alive).length;
            this.invaderSpeed = 1 + (this.INVADER_COLS * this.INVADER_ROWS - aliveCount) * 0.05;
            break;
          }
        }

        // Check bonus ship hit
        if (this.bonusShip.active &&
            bullet.x > this.bonusShip.x - 30 && bullet.x < this.bonusShip.x + 30 &&
            bullet.y > this.bonusShip.y - 10 && bullet.y < this.bonusShip.y + 10) {
          this.score.current += this.bonusShip.points;
          this.bonusShip.active = false;
          this.bullets.splice(i, 1);
          this.createExplosion(this.bonusShip.x, this.bonusShip.y);
        }

        // Check shelter hits
        this.checkShelterCollision(bullet, i);
      } else {
        // Enemy bullet
        // Check player hit
        if (this.invulnerableTimer <= 0 &&
            bullet.x > this.playerX && bullet.x < this.playerX + this.PLAYER_WIDTH &&
            bullet.y > this.playerY && bullet.y < this.playerY + this.PLAYER_HEIGHT) {
          this.loseLife();
          this.bullets.splice(i, 1);
          continue;
        }

        // Check shelter hits
        this.checkShelterCollision(bullet, i);
      }
    }

    // Enemy shooting
    this.enemyShootTimer += deltaTime;
    if (this.enemyShootTimer >= 1000 + Math.random() * 1000) {
      this.enemyShootTimer = 0;
      this.enemyShoot();
    }

    // Bonus ship
    this.bonusTimer += deltaTime;
    if (this.bonusTimer >= 25000 && !this.bonusShip.active) {
      this.bonusTimer = 0;
      this.spawnBonusShip();
    }

    if (this.bonusShip.active) {
      this.bonusShip.x += this.bonusShip.vx;
      if (this.bonusShip.x < -100 || this.bonusShip.x > this.width + 100) {
        this.bonusShip.active = false;
      }
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].life -= deltaTime;
      if (this.explosions[i].life <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    // Check win condition
    const aliveInvaders = this.invaders.filter(inv => inv.alive);
    if (aliveInvaders.length === 0) {
      this.nextWave();
    }

    // Check loss condition
    for (const inv of this.invaders) {
      if (inv.alive && inv.y + this.INVADER_HEIGHT >= this.playerY) {
        this.gameOver();
        return;
      }
    }
  }

  private moveInvaders(): void {
    let hitEdge = false;

    for (const inv of this.invaders) {
      if (!inv.alive) continue;

      const newX = inv.x + this.invaderDirection * this.invaderSpeed * 10;
      if (newX <= 0 || newX + this.INVADER_WIDTH >= this.width) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      // Move down and reverse direction
      this.invaderDirection *= -1;
      for (const inv of this.invaders) {
        if (inv.alive) {
          inv.y += 20;
        }
      }
    } else {
      // Move horizontally
      for (const inv of this.invaders) {
        if (inv.alive) {
          inv.x += this.invaderDirection * this.invaderSpeed * 10;
        }
      }
    }
  }

  private enemyShoot(): void {
    const aliveInvaders = this.invaders.filter(inv => inv.alive);
    if (aliveInvaders.length === 0) return;

    // Count enemy bullets
    const enemyBullets = this.bullets.filter(b => b.owner === 'enemy');
    if (enemyBullets.length >= 5) return;

    const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
    this.bullets.push({
      x: shooter.x + this.INVADER_WIDTH / 2,
      y: shooter.y + this.INVADER_HEIGHT,
      vx: 0,
      vy: 5,
      owner: 'enemy',
    });
  }

  private spawnBonusShip(): void {
    const points = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
    const direction = Math.random() > 0.5 ? 1 : -1;

    this.bonusShip = {
      x: direction > 0 ? -50 : this.width + 50,
      y: 30,
      vx: direction * 3,
      active: true,
      points,
    };
  }

  private checkShelterCollision(bullet: Bullet, bulletIndex: number): void {
    for (const shelter of this.shelters) {
      if (bullet.x < shelter.x || bullet.x > shelter.x + this.SHELTER_WIDTH ||
          bullet.y < shelter.y || bullet.y > shelter.y + this.SHELTER_HEIGHT) {
        continue;
      }

      const segmentW = this.SHELTER_WIDTH / this.SHELTER_SEGMENTS_X;
      const segmentH = this.SHELTER_HEIGHT / this.SHELTER_SEGMENTS_Y;
      const segX = Math.floor((bullet.x - shelter.x) / segmentW);
      const segY = Math.floor((bullet.y - shelter.y) / segmentH);

      if (segX >= 0 && segX < this.SHELTER_SEGMENTS_X &&
          segY >= 0 && segY < this.SHELTER_SEGMENTS_Y) {
        if (shelter.segments[segX][segY]) {
          shelter.segments[segX][segY] = false;
          this.bullets.splice(bulletIndex, 1);
          break;
        }
      }
    }
  }

  private createExplosion(x: number, y: number): void {
    this.explosions.push({
      x,
      y,
      life: 200,
      maxLife: 200,
    });
  }

  private loseLife(): void {
    this.lives--;
    this.invulnerableTimer = 2000;

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  private nextWave(): void {
    this.wave++;
    this.score.current += 1000;
    this.resetWave();
  }

  private gameOver(): void {
    this.state = 'gameover';
    storage.setHighScore(this.metadata.id, this.score.current);
    this.score.high = storage.getHighScore(this.metadata.id);
  }

  render(): void {
    this.draw.clear(this.width, this.height);

    // Draw scanlines
    this.ctx.save();
    this.ctx.strokeStyle = '#0a0a0a';
    this.ctx.lineWidth = 1;
    for (let y = 0; y < this.height; y += 4) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();

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
    this.draw.textCentered('VECTOR DEFENSE', centerX, centerY - 30, 28);
    this.draw.textCentered('Simulation #03', centerX, centerY + 10, 14);

    this.draw.textCentered('Defend the perimeter', centerX, centerY + 50, 14);

    this.draw.textCentered('[SPACE] to fire', centerX, centerY + 80, 16);
    this.draw.textCentered('[←→] to move', centerX, centerY + 105, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    // Draw ground line
    this.draw.line(0, this.height - 20, this.width, this.height - 20, 2);
    for (let x = 0; x < this.width; x += 40) {
      this.draw.line(x, this.height - 20, x, this.height - 15, 1);
    }

    // Draw shelters
    for (const shelter of this.shelters) {
      const segmentW = this.SHELTER_WIDTH / this.SHELTER_SEGMENTS_X;
      const segmentH = this.SHELTER_HEIGHT / this.SHELTER_SEGMENTS_Y;

      for (let x = 0; x < this.SHELTER_SEGMENTS_X; x++) {
        for (let y = 0; y < this.SHELTER_SEGMENTS_Y; y++) {
          if (shelter.segments[x][y]) {
            const px = shelter.x + x * segmentW;
            const py = shelter.y + y * segmentH;
            this.draw.rect(px, py, segmentW - 1, segmentH - 1, 1);
            // Hatch pattern
            this.draw.line(px, py, px + segmentW, py + segmentH, 0.5);
          }
        }
      }
    }

    // Draw invaders
    for (const inv of this.invaders) {
      if (!inv.alive) continue;

      if (inv.type === 2) {
        // Commander - diamond
        this.ctx.save();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(inv.x + this.INVADER_WIDTH / 2, inv.y);
        this.ctx.lineTo(inv.x + this.INVADER_WIDTH, inv.y + this.INVADER_HEIGHT / 2);
        this.ctx.lineTo(inv.x + this.INVADER_WIDTH / 2, inv.y + this.INVADER_HEIGHT);
        this.ctx.lineTo(inv.x, inv.y + this.INVADER_HEIGHT / 2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
      } else if (inv.type === 1) {
        // Cruiser - inverted triangle
        this.ctx.save();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(inv.x, inv.y);
        this.ctx.lineTo(inv.x + this.INVADER_WIDTH, inv.y);
        this.ctx.lineTo(inv.x + this.INVADER_WIDTH / 2, inv.y + this.INVADER_HEIGHT);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
      } else {
        // Drone - square
        this.draw.rect(inv.x, inv.y, this.INVADER_WIDTH, this.INVADER_HEIGHT, 2);
      }
    }

    // Draw player
    if (this.invulnerableTimer <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
      this.ctx.save();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.playerX + this.PLAYER_WIDTH / 2, this.playerY);
      this.ctx.lineTo(this.playerX, this.playerY + this.PLAYER_HEIGHT);
      this.ctx.lineTo(this.playerX + this.PLAYER_WIDTH, this.playerY + this.PLAYER_HEIGHT);
      this.ctx.closePath();
      this.ctx.stroke();
      // Gun barrel
      this.draw.line(
        this.playerX + this.PLAYER_WIDTH / 2,
        this.playerY + this.PLAYER_HEIGHT / 2,
        this.playerX + this.PLAYER_WIDTH / 2,
        this.playerY,
        1
      );
      this.ctx.restore();
    }

    // Draw bullets
    for (const bullet of this.bullets) {
      if (bullet.owner === 'player') {
        this.draw.line(bullet.x, bullet.y, bullet.x, bullet.y - 12, 2);
      } else {
        this.draw.line(bullet.x, bullet.y, bullet.x, bullet.y + 8, 2);
        this.draw.circleFilled(bullet.x, bullet.y + 8, 2);
      }
    }

    // Draw bonus ship
    if (this.bonusShip.active) {
      // Hexagon
      this.ctx.save();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = this.bonusShip.x + Math.cos(angle) * 20;
        const y = this.bonusShip.y + Math.sin(angle) * 8;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw explosions
    for (const exp of this.explosions) {
      const alpha = exp.life / exp.maxLife;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const len = (1 - alpha) * 20;
        this.draw.line(
          exp.x,
          exp.y,
          exp.x + Math.cos(angle) * len,
          exp.y + Math.sin(angle) * len,
          2
        );
      }
      this.ctx.restore();
    }

    // Draw UI
    this.draw.text(`SCORE: ${this.score.current}`, 10, 10, 14);
    this.draw.text('VECTOR DEFENSE', this.width / 2 - 80, 10, 14);

    // Draw lives
    let livesText = '';
    for (let i = 0; i < this.lives; i++) {
      livesText += '▲ ';
    }
    this.draw.text(livesText, this.width - 100, 10, 14, 'right');
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

    this.draw.textCentered('PERIMETER BREACHED', centerX, centerY - 80, 24);
    this.draw.textCentered(`Final Score: ${this.score.current}`, centerX, centerY - 30, 20);
    this.draw.textCentered(`Waves Cleared: ${this.wave - 1}`, centerX, centerY, 18);

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
        this.shoot();
      }
      return;
    }

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      if (this.state === 'playing') {
        this.shoot();
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

  private shoot(): void {
    const currentTime = performance.now();
    if (currentTime - this.lastShotTime < this.shootCooldown) return;

    // Max 3 player bullets
    const playerBullets = this.bullets.filter(b => b.owner === 'player');
    if (playerBullets.length >= 3) return;

    this.bullets.push({
      x: this.playerX + this.PLAYER_WIDTH / 2,
      y: this.playerY,
      vx: 0,
      vy: -12,
      owner: 'player',
    });

    this.lastShotTime = currentTime;
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
