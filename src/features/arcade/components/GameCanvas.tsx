/**
 * Fusion Lab Arcade - Game Canvas Component
 * Base canvas component for all arcade games
 */

import { useEffect, useRef, useCallback } from 'react';
import type { BaseGameEngine } from '../types';

interface GameCanvasProps {
  game: BaseGameEngine;
  width?: number;
  height?: number;
  onGameOver?: (score: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  game,
  width = 800,
  height = 500,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize game context
    game.init({
      canvas,
      ctx,
      width,
      height,
      state: 'idle',
      score: { current: 0, high: 0 },
    });

    return () => {
      game.cleanup();
    };
  }, [game, width, height]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Update and render
    game.update(deltaTime);
    game.render();

    // Check for game over
    const state = game.getState();
    if (state === 'gameover' && onGameOver) {
      const score = game.getScore();
      onGameOver(score.current);
    }

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [game, onGameOver]);

  // Start game loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for game controls
      const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'];
      if (gameKeys.indexOf(e.key) !== -1) {
        e.preventDefault();
      }
      game.handleKeyDown(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      game.handleKeyUp(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-white/20"
      style={{
        maxWidth: '100%',
        height: 'auto',
        imageRendering: 'crisp-edges',
      }}
    />
  );
};
