/**
 * Fusion Lab Arcade - Drawing Helpers
 * Blueprint/wireframe style drawing utilities
 */

import { DEFAULT_ARCADE_CONFIG } from '../types';

export class DrawHelpers {
  private ctx: CanvasRenderingContext2D;
  private color: string;

  constructor(ctx: CanvasRenderingContext2D, color: string = DEFAULT_ARCADE_CONFIG.primaryColor) {
    this.ctx = ctx;
    this.color = color;
  }

  /**
   * Draw text in monospace font
   */
  text(
    text: string,
    x: number,
    y: number,
    size: number = 16,
    align: CanvasTextAlign = 'left',
    baseline: CanvasTextBaseline = 'top'
  ): void {
    this.ctx.save();
    this.ctx.fillStyle = this.color;
    this.ctx.font = `${size}px ${DEFAULT_ARCADE_CONFIG.fontFamily}`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  /**
   * Draw rectangle (stroke only, blueprint style)
   */
  rect(x: number, y: number, width: number, height: number, lineWidth: number = 2): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
  }

  /**
   * Draw filled rectangle
   */
  rectFilled(x: number, y: number, width: number, height: number): void {
    this.ctx.save();
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.restore();
  }

  /**
   * Draw circle (stroke only)
   */
  circle(x: number, y: number, radius: number, lineWidth: number = 2): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Draw filled circle
   */
  circleFilled(x: number, y: number, radius: number): void {
    this.ctx.save();
    this.ctx.fillStyle = this.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  /**
   * Draw line
   */
  line(x1: number, y1: number, x2: number, y2: number, lineWidth: number = 2): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Draw dashed line
   */
  dashedLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dashPattern: number[] = [10, 5],
    lineWidth: number = 1
  ): void {
    this.ctx.save();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.setLineDash(dashPattern);
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  /**
   * Draw grid (blueprint background)
   */
  grid(width: number, height: number, cellSize: number = 20, gridColor: string = '#111111'): void {
    this.ctx.save();
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Clear canvas
   */
  clear(width: number, height: number): void {
    this.ctx.fillStyle = DEFAULT_ARCADE_CONFIG.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draw centered text
   */
  textCentered(text: string, x: number, y: number, size: number = 16): void {
    this.text(text, x, y, size, 'center', 'middle');
  }

  /**
   * Draw blinking text (call with timestamp)
   */
  textBlinking(
    text: string,
    x: number,
    y: number,
    timestamp: number,
    blinkSpeed: number = 500,
    size: number = 16,
    align: CanvasTextAlign = 'left'
  ): void {
    if (Math.floor(timestamp / blinkSpeed) % 2 === 0) {
      this.text(text, x, y, size, align);
    }
  }
}
