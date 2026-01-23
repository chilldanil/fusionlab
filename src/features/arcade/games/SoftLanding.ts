/**
 * Fusion Lab Arcade - Soft Landing (Lunar Lander Clone)
 * Game #10 - Engineering blueprint style
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { storage } from '../utils/storage';

interface Lander {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // degrees
  fuel: number;
  landed: boolean;
}

interface LandingPad {
  x: number;
  width: number;
  multiplier: number; // 1, 2, or 3
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class SoftLandingGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'soft-landing',
    name: 'SOFT LANDING',
    number: '10',
    originalGame: 'Lunar Lander (1979)',
    difficulty: 'medium',
    estimatedTime: '5-6 hours',
    genre: 'Simulator / Arcade',
    description: 'Land the module safely',
  };

  controls: GameControls = {
    'ArrowLeft': 'Rotate left',
    'ArrowRight': 'Rotate right',
    'ArrowUp': 'Main thrust',
    ' ': 'Main thrust',
    'W': 'Main thrust',
    'A': 'Rotate left',
    'D': 'Rotate right',
    'Escape': 'Pause',
  };

  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  private readonly GRAVITY = 0.05;
  private readonly THRUST_POWER = 0.1;
  private readonly ROTATION_SPEED = 3;
  private readonly FUEL_CONSUMPTION = 3;
  private readonly MAX_LANDING_VY = 2;
  private readonly MAX_LANDING_VX = 1;
  private readonly MAX_LANDING_ANGLE = 15;

  private lander!: Lander;
  private terrain: number[] = [];
  private landingPads: LandingPad[] = [];
  private particles: Particle[] = [];
  private level = 1;
  private modules = 3;
  private leftPressed = false;
  private rightPressed = false;
  private thrustPressed = false;
  private landingStatus = '';
  private statusTimer = 0;

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
    this.modules = 3;
    this.level = 1;
    this.resetLevel();
  }

  private resetLevel(): void {
    this.lander = {
      x: 100 + Math.random() * (this.width - 200),
      y: 50,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      angle: -90,
      fuel: 1000,
      landed: false,
    };

    // Generate terrain
    this.terrain = [];
    this.landingPads = [];

    for (let x = 0; x <= this.width; x += 20) {
      let height;

      // Check if this should be a landing pad
      const isPad = this.landingPads.length < 3 && x > 100 && x < this.width - 200 && Math.random() < 0.1;

      if (isPad) {
        const padWidth = 60 + Math.floor(Math.random() * 3) * 20;
        const padHeight = this.height - 80 - Math.random() * 50;

        for (let px = x; px < x + padWidth && px <= this.width; px += 20) {
          this.terrain.push(padHeight);
        }

        const multiplier = padWidth === 60 ? 3 : padWidth === 80 ? 2 : 1;
        this.landingPads.push({
          x: x,
          width: padWidth,
          multiplier,
        });

        x += padWidth - 20;
      } else {
        height = this.height - 50 - Math.random() * 150;
        this.terrain.push(height);
      }
    }

    this.particles = [];
    this.landingStatus = '';
    this.statusTimer = 0;
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

    if (this.lander.landed) {
      this.statusTimer -= deltaTime;
      if (this.statusTimer <= 0) {
        this.level++;
        this.resetLevel();
      }
      return;
    }

    // Rotate lander
    if (this.leftPressed) {
      this.lander.angle -= this.ROTATION_SPEED;
    }
    if (this.rightPressed) {
      this.lander.angle += this.ROTATION_SPEED;
    }

    // Apply thrust
    if (this.thrustPressed && this.lander.fuel > 0) {
      const rad = (this.lander.angle * Math.PI) / 180;
      this.lander.vx += Math.cos(rad) * this.THRUST_POWER;
      this.lander.vy += Math.sin(rad) * this.THRUST_POWER;
      this.lander.fuel -= this.FUEL_CONSUMPTION;

      // Thrust particles
      if (Math.random() < 0.5) {
        const backRad = rad + Math.PI;
        this.particles.push({
          x: this.lander.x + Math.cos(backRad) * 15,
          y: this.lander.y + Math.sin(backRad) * 15,
          vx: Math.cos(backRad) * 2 + (Math.random() - 0.5),
          vy: Math.sin(backRad) * 2 + (Math.random() - 0.5),
          life: 300,
          maxLife: 300,
        });
      }
    }

    // Apply gravity
    this.lander.vy += this.GRAVITY;

    // Update position
    this.lander.x += this.lander.vx;
    this.lander.y += this.lander.vy;

    // Check terrain collision
    this.checkTerrainCollision();

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

    // Check if crashed off screen
    if (this.lander.y > this.height + 50) {
      this.crash();
    }
  }

  private checkTerrainCollision(): void {
    const landerBottom = this.lander.y + 10;

    // Get terrain height at lander position
    const terrainIndex = Math.floor(this.lander.x / 20);
    if (terrainIndex < 0 || terrainIndex >= this.terrain.length) {
      if (this.lander.x < 0 || this.lander.x > this.width) {
        this.crash();
      }
      return;
    }

    const terrainHeight = this.terrain[terrainIndex];

    if (landerBottom >= terrainHeight) {
      // Check if on landing pad
      let onPad = false;
      let padMultiplier = 1;

      for (const pad of this.landingPads) {
        if (this.lander.x >= pad.x && this.lander.x <= pad.x + pad.width) {
          onPad = true;
          padMultiplier = pad.multiplier;
          break;
        }
      }

      if (!onPad) {
        this.crash();
        return;
      }

      // Check landing conditions
      const speedY = Math.abs(this.lander.vy);
      const speedX = Math.abs(this.lander.vx);
      const angleFromVertical = Math.abs(this.lander.angle + 90);

      if (
        speedY <= this.MAX_LANDING_VY &&
        speedX <= this.MAX_LANDING_VX &&
        angleFromVertical <= this.MAX_LANDING_ANGLE
      ) {
        // Successful landing!
        this.land(padMultiplier);
      } else {
        this.crash();
      }
    }
  }

  private land(multiplier: number): void {
    this.lander.landed = true;
    this.lander.vy = 0;
    this.lander.vx = 0;

    const basePoints = 100;
    const fuelBonus = Math.floor(this.lander.fuel * 0.1);
    const accuracyBonus = Math.floor((this.MAX_LANDING_VY - Math.abs(this.lander.vy)) * 10);

    const points = (basePoints + fuelBonus + accuracyBonus) * multiplier;
    this.score.current += points;

    this.landingStatus = 'LANDING SUCCESSFUL';
    this.statusTimer = 3000;
  }

  private crash(): void {
    this.modules--;

    // Create explosion particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x: this.lander.x,
        y: this.lander.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1000,
        maxLife: 1000,
      });
    }

    if (this.modules <= 0) {
      this.gameOver();
    } else {
      this.resetLevel();
    }
  }

  private gameOver(): void {
    this.state = 'gameover';
    storage.setHighScore(this.metadata.id, this.score.current);
    this.score.high = storage.getHighScore(this.metadata.id);
  }

  render(): void {
    this.draw.clear(this.width, this.height);

    // Stars background
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    for (let i = 0; i < 80; i++) {
      const x = (i * 73) % this.width;
      const y = (i * 127) % this.height;
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
    this.draw.textCentered('SOFT LANDING', centerX, centerY - 30, 32);
    this.draw.textCentered('Simulation #10', centerX, centerY + 10, 14);

    this.draw.textCentered('Land the module safely', centerX, centerY + 50, 14);
    this.draw.textCentered('Watch your fuel and speed', centerX, centerY + 75, 12);

    this.draw.textCentered('[↑] thrust', centerX, centerY + 110, 16);
    this.draw.textCentered('[←→] rotate', centerX, centerY + 135, 14);
    this.draw.textCentered('[SPACE] to launch', centerX, centerY + 160, 14);

    if (this.score.high > 0) {
      this.draw.textCentered(`High Score: ${this.score.high}`, centerX, this.height - 40, 14);
    }
  }

  private renderGame(): void {
    // Draw terrain
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let i = 0; i < this.terrain.length; i++) {
      const x = i * 20;
      const y = this.terrain[i];

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // Draw landing pads
    for (const pad of this.landingPads) {
      const y = this.terrain[Math.floor(pad.x / 20)];

      // Pad platform
      this.draw.line(pad.x, y, pad.x + pad.width, y, 3);

      // Markers
      this.draw.line(pad.x, y, pad.x, y - 10, 2);
      this.draw.line(pad.x + pad.width, y, pad.x + pad.width, y - 10, 2);

      // Multiplier label
      const pulse = Math.sin(performance.now() / 300) * 0.3 + 0.7;
      this.ctx.save();
      this.ctx.globalAlpha = pulse;
      this.draw.text(`PAD ×${pad.multiplier}`, pad.x + 5, y - 25, 10);
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

    // Draw lander
    if (!this.lander.landed || this.statusTimer > 0) {
      this.ctx.save();
      this.ctx.translate(this.lander.x, this.lander.y);
      this.ctx.rotate((this.lander.angle * Math.PI) / 180);

      // Lander body (triangle)
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(12, 0);
      this.ctx.lineTo(-8, -8);
      this.ctx.lineTo(-8, 8);
      this.ctx.closePath();
      this.ctx.stroke();

      // Legs
      this.ctx.beginPath();
      this.ctx.moveTo(-6, -6);
      this.ctx.lineTo(-10, -10);
      this.ctx.moveTo(-6, 6);
      this.ctx.lineTo(-10, 10);
      this.ctx.stroke();

      // Thrust flame
      if (this.thrustPressed && this.lander.fuel > 0) {
        const flameLen = 10 + Math.random() * 5;
        this.ctx.beginPath();
        this.ctx.moveTo(-8, -3);
        this.ctx.lineTo(-8 - flameLen, 0);
        this.ctx.lineTo(-8, 3);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    // Instrument panel
    const panelX = 10;
    const panelY = 10;
    const panelW = 240;
    const panelH = 90;

    this.draw.rect(panelX, panelY, panelW, panelH, 1);

    // Readouts
    const vy = this.lander.vy.toFixed(1);
    const vx = this.lander.vx.toFixed(1);
    const alt = Math.max(0, this.height - this.lander.y).toFixed(0);
    const angle = (-this.lander.angle - 90).toFixed(0);

    this.draw.text(`ALT: ${alt} m`, panelX + 10, panelY + 10, 12);
    this.draw.text(`V.VEL: ${vy}`, panelX + 10, panelY + 30, 12);
    this.draw.text(`H.VEL: ${vx}`, panelX + 10, panelY + 50, 12);
    this.draw.text(`ANGLE: ${angle}°`, panelX + 130, panelY + 10, 12);

    // Fuel bar
    const fuelPercent = this.lander.fuel / 1000;
    const fuelBarW = 160;
    this.draw.text('FUEL:', panelX + 10, panelY + 70, 10);
    this.draw.rect(panelX + 50, panelY + 68, fuelBarW, 12, 1);
    this.draw.rectFilled(panelX + 50, panelY + 68, fuelBarW * fuelPercent, 12);
    this.draw.text(`${Math.floor(fuelPercent * 100)}%`, panelX + 215, panelY + 70, 10);

    // Status
    let status = 'DESCENDING';
    if (this.lander.fuel <= 0) status = 'OUT OF FUEL';
    else if (this.lander.vy > this.MAX_LANDING_VY * 2) status = 'WARNING: HIGH SPEED';
    else if (this.lander.fuel < 200) status = 'CRITICAL: LOW FUEL';

    const statusColor = status.indexOf('CRITICAL') >= 0 || status.indexOf('WARNING') >= 0 ? '#FF0000' : '#FFFFFF';
    this.ctx.save();
    this.ctx.fillStyle = statusColor;
    this.draw.text(`STATUS: ${status}`, panelX + 260, panelY + 40, 11);
    this.ctx.restore();

    // Score and modules
    this.draw.text(`SCORE: ${this.score.current}`, this.width / 2 - 60, 10, 14);

    let modulesText = 'MODULES: ';
    for (let i = 0; i < this.modules; i++) {
      modulesText += '▲ ';
    }
    this.draw.text(modulesText, this.width - 150, 10, 14);

    // Landing status
    if (this.landingStatus && this.statusTimer > 0) {
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(centerX - 150, centerY - 100, 300, 200);

      this.draw.textCentered(this.landingStatus, centerX, centerY - 40, 24);

      const speedY = Math.abs(this.lander.vy).toFixed(1);
      const speedX = Math.abs(this.lander.vx).toFixed(1);
      const angleCheck = Math.abs(this.lander.angle + 90).toFixed(0);

      this.draw.textCentered(`Vertical speed: ${speedY} m/s ✓`, centerX, centerY, 14);
      this.draw.textCentered(`Horizontal speed: ${speedX} m/s ✓`, centerX, centerY + 20, 14);
      this.draw.textCentered(`Angle: ${angleCheck}° ✓`, centerX, centerY + 40, 14);

      this.draw.textCentered('[Loading next level...]', centerX, centerY + 80, 12);
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

    this.draw.textCentered('IMPACT DETECTED', centerX, centerY - 80, 24);
    this.draw.textCentered('───────────────', centerX, centerY - 50, 14);
    this.draw.textCentered(`Final score: ${this.score.current}`, centerX, centerY - 10, 20);
    this.draw.textCentered(`Levels completed: ${this.level - 1}`, centerX, centerY + 20, 18);

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
        this.thrustPressed = true;
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
      this.thrustPressed = true;
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
    if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') {
      this.thrustPressed = false;
    }
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
