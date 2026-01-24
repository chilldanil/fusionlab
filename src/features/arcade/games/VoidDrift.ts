/**
 * Fusion Lab Arcade - Void Drift (Asteroids Clone)
 * Game #04 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

interface Ship {
  x: number;
  y: number;
  angle: number; // in degrees
  vx: number;
  vy: number;
  thrust: boolean;
  invulnerable: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number; // 0 = large, 1 = medium, 2 = small
  radius: number;
  rotation: number;
  rotationSpeed: number;
  points: number[];
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface UFO {
  x: number;
  y: number;
  vx: number;
  size: number; // 0 = large, 1 = small
  active: boolean;
  shootTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class VoidDriftGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'void-drift',
    name: 'VOID DRIFT',
    number: '04',
    originalGame: 'Asteroids (1979)',
    difficulty: 'medium',
    estimatedTime: '5-6 hours',
    genre: 'Arcade Shooter',
    description: 'Clear the debris field',
  };

  controls: GameControls = {
    'ArrowLeft': 'Rotate left',
    'ArrowRight': 'Rotate right',
    'ArrowUp': 'Thrust',
    'A': 'Rotate left',
    'D': 'Rotate right',
    'W': 'Thrust',
    ' ': 'Fire',
    'Shift': 'Hyperspace jump',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game state
  private ship!: Ship;
  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];
  private ufo: UFO | null = null;
  private particles: Particle[] = [];
  private lives = 3;
  private wave = 1;
  private leftPressed = false;
  private rightPressed = false;
  private upPressed = false;
  private lastShotTime = 0;
  private ufoTimer = 0;
  private hyperspaceReady = true;
  private hyperspaceCooldown = 0;

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
    this.resetShip();
    this.startWave();
  }

  private resetShip(): void {
    this.ship = {
      x: this.width / 2,
      y: this.height / 2,
      angle: 270, // pointing up
      vx: 0,
      vy: 0,
      thrust: false,
      invulnerable: 2000,
    };
  }

  private startWave(): void {
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
    this.ufo = null;
    this.ufoTimer = 0;

    const numAsteroids = 4 + this.wave - 1;
    for (let i = 0; i < numAsteroids; i++) {
      this.spawnAsteroid(0, true);
    }
  }

  private spawnAsteroid(size: number, initial: boolean = false): void {
    let x, y;

    if (initial) {
      // Spawn at edges, away from ship
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: x = Math.random() * this.width; y = 0; break;
        case 1: x = this.width; y = Math.random() * this.height; break;
        case 2: x = Math.random() * this.width; y = this.height; break;
        default: x = 0; y = Math.random() * this.height;
      }
    } else {
      x = Math.random() * this.width;
      y = Math.random() * this.height;
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = (3 - size) * 0.5 + Math.random() * 0.5;

    const radiusMap = [45, 25, 12];
    const radius = radiusMap[size];

    // Generate irregular polygon
    const points: number[] = [];
    const numPoints = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.3);
      points.push(Math.cos(a) * r);
      points.push(Math.sin(a) * r);
    }

    this.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      radius,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 2,
      points,
    });
  }

  private splitAsteroid(asteroid: Asteroid): void {
    if (asteroid.size < 2) {
      // Split into 2 smaller asteroids
      for (let i = 0; i < 2; i++) {
        const newSize = asteroid.size + 1;
        const angle = Math.random() * Math.PI * 2;
        const speed = (3 - newSize) * 0.5 + Math.random() * 0.5;

        const radiusMap = [45, 25, 12];
        const radius = radiusMap[newSize];

        const points: number[] = [];
        const numPoints = 8 + Math.floor(Math.random() * 4);
        for (let j = 0; j < numPoints; j++) {
          const a = (j / numPoints) * Math.PI * 2;
          const r = radius * (0.7 + Math.random() * 0.3);
          points.push(Math.cos(a) * r);
          points.push(Math.sin(a) * r);
        }

        this.asteroids.push({
          x: asteroid.x,
          y: asteroid.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: newSize,
          radius,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 3,
          points,
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
    if (this.state !== 'playing') return;

    // Update invulnerability
    if (this.ship.invulnerable > 0) {
      this.ship.invulnerable -= deltaTime;
    }

    // Update hyperspace cooldown
    if (!this.hyperspaceReady) {
      this.hyperspaceCooldown -= deltaTime;
      if (this.hyperspaceCooldown <= 0) {
        this.hyperspaceReady = true;
      }
    }

    // Rotate ship
    if (this.leftPressed) {
      this.ship.angle -= 5;
    }
    if (this.rightPressed) {
      this.ship.angle += 5;
    }

    // Thrust
    if (this.upPressed) {
      const rad = (this.ship.angle * Math.PI) / 180;
      this.ship.vx += Math.cos(rad) * 0.15;
      this.ship.vy += Math.sin(rad) * 0.15;
      this.ship.thrust = true;

      // Add thrust particles
      if (Math.random() < 0.3) {
        const backRad = rad + Math.PI;
        this.particles.push({
          x: this.ship.x + Math.cos(backRad) * 15,
          y: this.ship.y + Math.sin(backRad) * 15,
          vx: Math.cos(backRad) * 2 + (Math.random() - 0.5),
          vy: Math.sin(backRad) * 2 + (Math.random() - 0.5),
          life: 300,
          maxLife: 300,
        });
      }
    } else {
      this.ship.thrust = false;
    }

    // Apply friction
    this.ship.vx *= 0.99;
    this.ship.vy *= 0.99;

    // Limit speed
    const speed = Math.sqrt(this.ship.vx ** 2 + this.ship.vy ** 2);
    if (speed > 8) {
      this.ship.vx = (this.ship.vx / speed) * 8;
      this.ship.vy = (this.ship.vy / speed) * 8;
    }

    // Move ship
    this.ship.x += this.ship.vx;
    this.ship.y += this.ship.vy;

    // Wrap ship
    this.ship.x = (this.ship.x + this.width) % this.width;
    this.ship.y = (this.ship.y + this.height) % this.height;

    // Update asteroids
    for (const asteroid of this.asteroids) {
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;
      asteroid.rotation += asteroid.rotationSpeed;

      // Wrap asteroids
      asteroid.x = (asteroid.x + this.width) % this.width;
      asteroid.y = (asteroid.y + this.height) % this.height;
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life -= deltaTime;

      // Wrap bullets
      bullet.x = (bullet.x + this.width) % this.width;
      bullet.y = (bullet.y + this.height) % this.height;

      if (bullet.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    // Check bullet-asteroid collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        const dx = bullet.x - asteroid.x;
        const dy = bullet.y - asteroid.y;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);

        if (dist < asteroid.radius) {
          // Hit!
          const points = asteroid.size === 0 ? 20 : asteroid.size === 1 ? 50 : 100;
          this.score.current += points;

          this.createExplosion(asteroid.x, asteroid.y);
          this.splitAsteroid(asteroid);
          this.asteroids.splice(j, 1);
          this.bullets.splice(i, 1);
          break;
        }
      }
    }

    // Check ship-asteroid collisions
    if (this.ship.invulnerable <= 0) {
      for (const asteroid of this.asteroids) {
        const dx = this.ship.x - asteroid.x;
        const dy = this.ship.y - asteroid.y;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);

        if (dist < asteroid.radius + 12) {
          this.destroyShip();
          break;
        }
      }
    }

    // UFO logic
    this.ufoTimer += deltaTime;
    if (this.ufoTimer > 30000 + Math.random() * 15000 && !this.ufo) {
      this.spawnUFO();
    }

    if (this.ufo) {
      this.ufo.x += this.ufo.vx;

      // Wrap UFO
      if (this.ufo.x < -50 || this.ufo.x > this.width + 50) {
        this.ufo = null;
      }

      if (this.ufo) {
        // UFO shooting
        this.ufo.shootTimer += deltaTime;
        if (this.ufo.shootTimer > (this.ufo.size === 0 ? 2000 : 1000)) {
          this.ufo.shootTimer = 0;
          this.ufoShoot();
        }

        // Check bullet-UFO collision
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const bullet = this.bullets[i];
          const dx = bullet.x - this.ufo.x;
          const dy = bullet.y - this.ufo.y;
          const dist = Math.sqrt(dx ** 2 + dy ** 2);

          if (dist < 20) {
            const points = this.ufo.size === 0 ? 200 : 1000;
            this.score.current += points;
            this.createExplosion(this.ufo.x, this.ufo.y);
            this.ufo = null;
            this.bullets.splice(i, 1);
            break;
          }
        }

        // Check ship-UFO collision
        if (this.ufo && this.ship.invulnerable <= 0) {
          const dx = this.ship.x - this.ufo.x;
          const dy = this.ship.y - this.ufo.y;
          const dist = Math.sqrt(dx ** 2 + dy ** 2);

          if (dist < 30) {
            this.destroyShip();
          }
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Check wave completion
    if (this.asteroids.length === 0 && !this.ufo) {
      this.wave++;
      this.score.current += 1000;
      this.startWave();
    }

    // Extra life every 10000 points
    const extraLives = Math.floor(this.score.current / 10000);
    if (extraLives > 0 && this.lives < 5) {
      this.lives = Math.min(5, 3 + extraLives);
    }
  }

  private spawnUFO(): void {
    const size = Math.random() > 0.7 ? 1 : 0; // 30% chance for small UFO
    const direction = Math.random() > 0.5 ? 1 : -1;

    this.ufo = {
      x: direction > 0 ? -40 : this.width + 40,
      y: Math.random() * this.height,
      vx: direction * 2,
      size,
      active: true,
      shootTimer: 0,
    };
    this.ufoTimer = 0;
  }

  private ufoShoot(): void {
    if (!this.ufo) return;

    let angle: number;
    if (this.ufo.size === 0) {
      // Large UFO: random shooting
      angle = Math.random() * Math.PI * 2;
    } else {
      // Small UFO: aim at player
      const dx = this.ship.x - this.ufo.x;
      const dy = this.ship.y - this.ufo.y;
      angle = Math.atan2(dy, dx);
    }

    this.bullets.push({
      x: this.ufo.x,
      y: this.ufo.y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      life: 2000,
    });
  }

  private createExplosion(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
      });
    }
  }

  private destroyShip(): void {
    this.createExplosion(this.ship.x, this.ship.y);

    // Create ship debris
    for (let i = 0; i < 8; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: this.ship.x,
        y: this.ship.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1000,
        maxLife: 1000,
      });
    }

    this.lives--;

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.resetShip();
    }
  }

  private hyperspace(): void {
    if (!this.hyperspaceReady) return;

    // Teleport to random location
    this.ship.x = Math.random() * this.width;
    this.ship.y = Math.random() * this.height;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.invulnerable = 2000;

    // 20% chance to appear inside asteroid and die
    if (Math.random() < 0.2) {
      for (const asteroid of this.asteroids) {
        const dx = this.ship.x - asteroid.x;
        const dy = this.ship.y - asteroid.y;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);

        if (dist < asteroid.radius + 12) {
          this.ship.invulnerable = 0;
          this.destroyShip();
          break;
        }
      }
    }

    this.hyperspaceReady = false;
    this.hyperspaceCooldown = 3000;
  }

  private gameOver(): void {
    this.state = 'gameover';
    storage.setHighScore(this.metadata.id, this.score.current);
    this.score.high = storage.getHighScore(this.metadata.id);
  }

  render(): void {
    this.draw.clear(this.width, this.height);

    // Background noise
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.draw.circleFilled(x, y, 1);
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
    this.draw.textCentered('VOID DRIFT', centerX, centerY - 30, 32);
    this.draw.textCentered('Simulation #04', centerX, centerY + 10, 14);

    this.draw.textCentered('Clear the debris field', centerX, centerY + 50, 14);

    this.draw.textCentered('[ARROWS] to navigate', centerX, centerY + 90, 16);
    this.draw.textCentered('[SPACE] to fire', centerX, centerY + 115, 14);
    this.draw.textCentered('[SHIFT] to jump', centerX, centerY + 140, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    // Draw ship
    if (this.ship.invulnerable <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
      this.ctx.save();
      this.ctx.translate(this.ship.x, this.ship.y);
      this.ctx.rotate((this.ship.angle * Math.PI) / 180);

      // Ship triangle
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(12, 0);
      this.ctx.lineTo(-8, -8);
      this.ctx.lineTo(-8, 8);
      this.ctx.closePath();
      this.ctx.stroke();

      // Center line
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(12, 0);
      this.ctx.stroke();

      // Thrust flames
      if (this.ship.thrust) {
        const flameLen = 10 + Math.random() * 5;
        this.ctx.beginPath();
        this.ctx.moveTo(-8, -3);
        this.ctx.lineTo(-8 - flameLen, 0);
        this.ctx.lineTo(-8, 3);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    // Draw asteroids
    for (const asteroid of this.asteroids) {
      this.ctx.save();
      this.ctx.translate(asteroid.x, asteroid.y);
      this.ctx.rotate((asteroid.rotation * Math.PI) / 180);

      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      for (let i = 0; i < asteroid.points.length; i += 2) {
        if (i === 0) {
          this.ctx.moveTo(asteroid.points[i], asteroid.points[i + 1]);
        } else {
          this.ctx.lineTo(asteroid.points[i], asteroid.points[i + 1]);
        }
      }
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.restore();
    }

    // Draw bullets
    for (const bullet of this.bullets) {
      this.draw.circleFilled(bullet.x, bullet.y, 2);
    }

    // Draw UFO
    if (this.ufo) {
      this.ctx.save();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;

      // UFO body (two triangles forming diamond shape)
      this.ctx.beginPath();
      this.ctx.moveTo(this.ufo.x - 20, this.ufo.y);
      this.ctx.lineTo(this.ufo.x, this.ufo.y - 10);
      this.ctx.lineTo(this.ufo.x + 20, this.ufo.y);
      this.ctx.lineTo(this.ufo.x, this.ufo.y + 10);
      this.ctx.closePath();
      this.ctx.stroke();

      // Center line
      this.ctx.beginPath();
      this.ctx.moveTo(this.ufo.x - 20, this.ufo.y);
      this.ctx.lineTo(this.ufo.x + 20, this.ufo.y);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.draw.line(p.x, p.y, p.x + p.vx, p.y + p.vy, 1);
      this.ctx.restore();
    }

    // Draw UI
    this.draw.text(`SCORE: ${this.score.current}`, 10, 10, 14);

    // Draw lives
    const livesX = this.width - 100;
    this.draw.text(`×${this.lives}`, livesX + 30, 10, 14);
    this.ctx.save();
    this.ctx.translate(livesX, 20);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(8, 0);
    this.ctx.lineTo(-5, -5);
    this.ctx.lineTo(-5, 5);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();

    // Hyperspace cooldown indicator
    if (!this.hyperspaceReady) {
      const progress = 1 - (this.hyperspaceCooldown / 3000);
      this.draw.text('JUMP:', 10, this.height - 30, 10);
      this.draw.rect(50, this.height - 30, 100, 10, 1);
      this.draw.rectFilled(50, this.height - 30, 100 * progress, 10);
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

    this.draw.textCentered('DEBRIS FIELD CLEARED', centerX, centerY - 80, 24);
    this.draw.textCentered(`Final Score: ${this.score.current}`, centerX, centerY - 30, 20);
    this.draw.textCentered(`Waves Completed: ${this.wave - 1}`, centerX, centerY, 18);

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
    }
    if (key === 'Shift') {
      this.hyperspace();
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
  }

  private shoot(): void {
    const currentTime = performance.now();
    if (currentTime - this.lastShotTime < 150) return;

    // Max 4 bullets
    if (this.bullets.length >= 4) return;

    const rad = (this.ship.angle * Math.PI) / 180;
    this.bullets.push({
      x: this.ship.x + Math.cos(rad) * 12,
      y: this.ship.y + Math.sin(rad) * 12,
      vx: Math.cos(rad) * 12 + this.ship.vx,
      vy: Math.sin(rad) * 12 + this.ship.vy,
      life: 1000,
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
